/**
 * Dice Utilities
 * D&D dice rolling logic s podporou notation parsingu, advantage/disadvantage
 */

export interface DiceRoll {
  notation: string          // "1d20+5"
  count: number            // 1
  sides: number            // 20
  modifier: number         // 5
  rolls: number[]          // [13]
  total: number            // 18
  type?: string            // "attack", "saving_throw", "skill_check", atd.
  advantage?: boolean
  disadvantage?: boolean
}

/**
 * Parse dice notation string
 * Supported formats:
 *   "1d20"     → {count: 1, sides: 20, modifier: 0}
 *   "1d20+5"   → {count: 1, sides: 20, modifier: 5}
 *   "2d6-1"    → {count: 2, sides: 6, modifier: -1}
 *   "d20"      → {count: 1, sides: 20, modifier: 0}
 *
 * @param notation - Dice notation string
 * @returns Parsed dice roll object (without rolls yet)
 */
export function parseDiceNotation(notation: string): Partial<DiceRoll> {
  // Normalize notation (remove spaces, lowercase)
  const normalized = notation.trim().toLowerCase().replace(/\s/g, '')

  // Regex: (count)d(sides)(+/-modifier)
  const regex = /^(\d*)d(\d+)([+\-]\d+)?$/
  const match = normalized.match(regex)

  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`)
  }

  const count = match[1] ? parseInt(match[1]) : 1
  const sides = parseInt(match[2])
  const modifier = match[3] ? parseInt(match[3]) : 0

  // Validation
  if (count < 1 || count > 100) {
    throw new Error('Dice count must be between 1 and 100')
  }

  if (![4, 6, 8, 10, 12, 20, 100].includes(sides)) {
    throw new Error('Invalid dice type. Supported: d4, d6, d8, d10, d12, d20, d100')
  }

  return {
    notation: normalized,
    count,
    sides,
    modifier,
  }
}

/**
 * Roll a single die
 * @param sides - Number of sides on the die
 * @returns Random number between 1 and sides (inclusive)
 */
function rollSingleDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

/**
 * Roll dice based on notation
 *
 * @param notation - Dice notation string (e.g., "1d20+5")
 * @param type - Optional roll type (attack, saving_throw, etc.)
 * @returns Complete dice roll result
 *
 * @example
 * rollDice("1d20+5")
 * // Returns: {notation: "1d20+5", count: 1, sides: 20, modifier: 5, rolls: [13], total: 18}
 */
export function rollDice(notation: string, type?: string): DiceRoll {
  const parsed = parseDiceNotation(notation)

  // Roll each die
  const rolls: number[] = []
  for (let i = 0; i < parsed.count!; i++) {
    rolls.push(rollSingleDie(parsed.sides!))
  }

  // Calculate total
  const rollSum = rolls.reduce((sum, roll) => sum + roll, 0)
  const total = rollSum + parsed.modifier!

  return {
    notation: parsed.notation!,
    count: parsed.count!,
    sides: parsed.sides!,
    modifier: parsed.modifier!,
    rolls,
    total,
    type,
  }
}

/**
 * Roll with advantage (roll twice, take higher)
 * Only works with single die (e.g., "1d20+5")
 *
 * @param notation - Dice notation string
 * @param type - Optional roll type
 * @returns Dice roll result with advantage flag
 *
 * @example
 * rollWithAdvantage("1d20+5")
 * // Returns: {notation: "1d20+5", rolls: [13, 8], total: 18, advantage: true}
 */
export function rollWithAdvantage(notation: string, type?: string): DiceRoll {
  const parsed = parseDiceNotation(notation)

  if (parsed.count !== 1) {
    throw new Error('Advantage/Disadvantage only works with single die (e.g., 1d20)')
  }

  // Roll twice
  const roll1 = rollSingleDie(parsed.sides!)
  const roll2 = rollSingleDie(parsed.sides!)

  // Take higher
  const higherRoll = Math.max(roll1, roll2)
  const total = higherRoll + parsed.modifier!

  return {
    notation: parsed.notation!,
    count: parsed.count!,
    sides: parsed.sides!,
    modifier: parsed.modifier!,
    rolls: [roll1, roll2], // Both rolls for transparency
    total,
    type,
    advantage: true,
  }
}

/**
 * Roll with disadvantage (roll twice, take lower)
 * Only works with single die (e.g., "1d20+5")
 *
 * @param notation - Dice notation string
 * @param type - Optional roll type
 * @returns Dice roll result with disadvantage flag
 *
 * @example
 * rollWithDisadvantage("1d20+5")
 * // Returns: {notation: "1d20+5", rolls: [13, 8], total: 13, disadvantage: true}
 */
export function rollWithDisadvantage(notation: string, type?: string): DiceRoll {
  const parsed = parseDiceNotation(notation)

  if (parsed.count !== 1) {
    throw new Error('Advantage/Disadvantage only works with single die (e.g., 1d20)')
  }

  // Roll twice
  const roll1 = rollSingleDie(parsed.sides!)
  const roll2 = rollSingleDie(parsed.sides!)

  // Take lower
  const lowerRoll = Math.min(roll1, roll2)
  const total = lowerRoll + parsed.modifier!

  return {
    notation: parsed.notation!,
    count: parsed.count!,
    sides: parsed.sides!,
    modifier: parsed.modifier!,
    rolls: [roll1, roll2], // Both rolls for transparency
    total,
    type,
    disadvantage: true,
  }
}

/**
 * Check if a d20 roll is a critical hit (natural 20)
 * @param roll - Dice roll result
 * @returns True if natural 20
 */
export function isCriticalHit(roll: DiceRoll): boolean {
  if (roll.sides !== 20) return false

  if (roll.advantage || roll.disadvantage) {
    // Check if either roll is 20
    return roll.rolls.some(r => r === 20)
  }

  return roll.rolls[0] === 20
}

/**
 * Check if a d20 roll is a critical miss (natural 1)
 * @param roll - Dice roll result
 * @returns True if natural 1
 */
export function isCriticalMiss(roll: DiceRoll): boolean {
  if (roll.sides !== 20) return false

  if (roll.advantage || roll.disadvantage) {
    // Check if both rolls are 1
    return roll.rolls.every(r => r === 1)
  }

  return roll.rolls[0] === 1
}

/**
 * Format dice roll for display
 * @param roll - Dice roll result
 * @returns Formatted string for UI
 *
 * @example
 * formatDiceRoll({notation: "1d20+5", rolls: [13], total: 18})
 * // Returns: "1d20+5 → [13] + 5 = 18"
 */
export function formatDiceRoll(roll: DiceRoll): string {
  const rollsStr = roll.rolls.join(', ')
  const modifierStr = roll.modifier !== 0 ? ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}` : ''

  let result = `${roll.notation} → [${rollsStr}]${modifierStr} = ${roll.total}`

  if (roll.advantage) {
    result += ' (Advantage)'
  }

  if (roll.disadvantage) {
    result += ' (Disadvantage)'
  }

  if (isCriticalHit(roll)) {
    result += ' 🎯 CRITICAL HIT!'
  }

  if (isCriticalMiss(roll)) {
    result += ' 💀 CRITICAL MISS!'
  }

  return result
}
