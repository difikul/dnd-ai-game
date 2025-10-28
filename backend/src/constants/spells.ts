/**
 * D&D 5e Spell Definitions
 * Complete spell lists for each class with descriptions
 */

export interface SpellDefinition {
  name: string
  level: number // 0-9 (0 = cantrip)
  school: string
  description: string
  castingTime: string
  range: string
  components: string
  duration: string
}

// ═══════════════════════════════════════════════
// PALADIN SPELLS
// ═══════════════════════════════════════════════

export const PALADIN_SPELLS: SpellDefinition[] = [
  // Level 1 (dostupné od Paladin L2)
  {
    name: "Bless",
    level: 1,
    school: "Enchantment",
    description: "Požehnáš až 3 tvory. Když hodí útok nebo saving throw, mohou přidat 1d4 k hodu.",
    castingTime: "1 action",
    range: "30 feet",
    components: "V, S, M (svěcená voda)",
    duration: "Concentration, up to 1 minute"
  },
  {
    name: "Cure Wounds",
    level: 1,
    school: "Evocation",
    description: "Dotkneš se tvora a vyléčíš mu 1d8 + spellcasting modifier HP.",
    castingTime: "1 action",
    range: "Touch",
    components: "V, S",
    duration: "Instantaneous"
  },
  {
    name: "Divine Favor",
    level: 1,
    school: "Evocation",
    description: "Tvá zbraň září svatým světlem. Přičti 1d4 radiant damage ke každému útoku.",
    castingTime: "1 bonus action",
    range: "Self",
    components: "V, S",
    duration: "Concentration, up to 1 minute"
  },
  {
    name: "Shield of Faith",
    level: 1,
    school: "Abjuration",
    description: "Štít z víry chrání tvora, přidává +2 k AC.",
    castingTime: "1 bonus action",
    range: "60 feet",
    components: "V, S, M (malý pergamen s textem svatého písma)",
    duration: "Concentration, up to 10 minutes"
  },
  {
    name: "Thunderous Smite",
    level: 1,
    school: "Evocation",
    description: "Při příštím zásahu útoku přidáš 2d6 thunder damage a můžeš odhodit cíl.",
    castingTime: "1 bonus action",
    range: "Self",
    components: "V",
    duration: "Concentration, up to 1 minute"
  },
  // Level 2
  {
    name: "Aid",
    level: 2,
    school: "Abjuration",
    description: "Posílíš až 3 tvory, přidáš jim 5 temporary HP a zvýšíš maximum HP o 5.",
    castingTime: "1 action",
    range: "30 feet",
    components: "V, S, M (bílý pásek)",
    duration: "8 hours"
  },
  {
    name: "Lesser Restoration",
    level: 2,
    school: "Abjuration",
    description: "Odstraníš jeden stav: blinded, deafened, paralyzed, nebo poisoned.",
    castingTime: "1 action",
    range: "Touch",
    components: "V, S",
    duration: "Instantaneous"
  },
  {
    name: "Zone of Truth",
    level: 2,
    school: "Enchantment",
    description: "Vytvoříš zónu kde nikdo nemůže záměrně lhát.",
    castingTime: "1 action",
    range: "60 feet",
    components: "V, S",
    duration: "10 minutes"
  }
]

// ═══════════════════════════════════════════════
// WIZARD SPELLS
// ═══════════════════════════════════════════════

export const WIZARD_SPELLS: SpellDefinition[] = [
  // CANTRIPS (Level 0)
  {
    name: "Fire Bolt",
    level: 0,
    school: "Evocation",
    description: "Vrhneš ohnivou střelu na cíl. Způsobíš 1d10 fire damage.",
    castingTime: "1 action",
    range: "120 feet",
    components: "V, S",
    duration: "Instantaneous"
  },
  {
    name: "Mage Hand",
    level: 0,
    school: "Conjuration",
    description: "Vytvoříš spectral floating hand která může manipulovat s objekty.",
    castingTime: "1 action",
    range: "30 feet",
    components: "V, S",
    duration: "1 minute"
  },
  {
    name: "Ray of Frost",
    level: 0,
    school: "Evocation",
    description: "Paprsek mrazivé energie. 1d8 cold damage a snížení rychlosti o 10 ft.",
    castingTime: "1 action",
    range: "60 feet",
    components: "V, S",
    duration: "Instantaneous"
  },
  {
    name: "Light",
    level: 0,
    school: "Evocation",
    description: "Předmět září jasným světlem v radiusu 20 ft a dim light dalších 20 ft.",
    castingTime: "1 action",
    range: "Touch",
    components: "V, M (firefly nebo phosphorescent moss)",
    duration: "1 hour"
  },
  // LEVEL 1
  {
    name: "Magic Missile",
    level: 1,
    school: "Evocation",
    description: "Vytvoříš 3 magické střely. Každá zasáhne cíl a způsobí 1d4+1 force damage.",
    castingTime: "1 action",
    range: "120 feet",
    components: "V, S",
    duration: "Instantaneous"
  },
  {
    name: "Shield",
    level: 1,
    school: "Abjuration",
    description: "Reakce: Neviditelná bariéra ti dá +5 AC až do začátku tvého příštího tahu.",
    castingTime: "1 reaction",
    range: "Self",
    components: "V, S",
    duration: "1 round"
  },
  {
    name: "Detect Magic",
    level: 1,
    school: "Divination",
    description: "Vnímáš přítomnost magie do 30 ft a můžeš zjistit její školu.",
    castingTime: "1 action",
    range: "Self",
    components: "V, S",
    duration: "Concentration, up to 10 minutes"
  },
  {
    name: "Burning Hands",
    level: 1,
    school: "Evocation",
    description: "Kužel plamenů 15 ft. Každý tvor v oblasti: 3d6 fire damage (DEX save půlka).",
    castingTime: "1 action",
    range: "Self (15-foot cone)",
    components: "V, S",
    duration: "Instantaneous"
  },
  {
    name: "Sleep",
    level: 1,
    school: "Enchantment",
    description: "Uspíš tvory s celkovými HP až 5d8. Začíná od nejslabších.",
    castingTime: "1 action",
    range: "90 feet",
    components: "V, S, M (sand, rose petals, or cricket)",
    duration: "1 minute"
  },
  // LEVEL 2
  {
    name: "Scorching Ray",
    level: 2,
    school: "Evocation",
    description: "Vytvoříš 3 paprsky ohně. Každý útok: 2d6 fire damage.",
    castingTime: "1 action",
    range: "120 feet",
    components: "V, S",
    duration: "Instantaneous"
  },
  {
    name: "Misty Step",
    level: 2,
    school: "Conjuration",
    description: "Teleportuješ se až 30 ft na místo které vidíš.",
    castingTime: "1 bonus action",
    range: "Self",
    components: "V",
    duration: "Instantaneous"
  },
  {
    name: "Invisibility",
    level: 2,
    school: "Illusion",
    description: "Tvor se stane neviditelným až do útoku nebo seslání kouzla.",
    castingTime: "1 action",
    range: "Touch",
    components: "V, S, M (eyelash encased in gum arabic)",
    duration: "Concentration, up to 1 hour"
  },
  // LEVEL 3
  {
    name: "Fireball",
    level: 3,
    school: "Evocation",
    description: "Ohnivá koule exploduje v radiusu 20 ft. 8d6 fire damage (DEX save půlka).",
    castingTime: "1 action",
    range: "150 feet",
    components: "V, S, M (tiny ball of bat guano and sulfur)",
    duration: "Instantaneous"
  },
  {
    name: "Lightning Bolt",
    level: 3,
    school: "Evocation",
    description: "Blesk v linii 100 ft dlouhé a 5 ft široké. 8d6 lightning damage (DEX save půlka).",
    castingTime: "1 action",
    range: "Self (100-foot line)",
    components: "V, S, M (bit of fur and rod of amber, crystal, or glass)",
    duration: "Instantaneous"
  },
  {
    name: "Counterspell",
    level: 3,
    school: "Abjuration",
    description: "Reakce: Zruš kouzlo 3rd level nebo nižší které někdo sesílá.",
    castingTime: "1 reaction",
    range: "60 feet",
    components: "S",
    duration: "Instantaneous"
  }
]

// ═══════════════════════════════════════════════
// CLERIC SPELLS
// ═══════════════════════════════════════════════

export const CLERIC_SPELLS: SpellDefinition[] = [
  // CANTRIPS
  {
    name: "Sacred Flame",
    level: 0,
    school: "Evocation",
    description: "Plameny sesílají z nebe na tvora. 1d8 radiant damage (DEX save).",
    castingTime: "1 action",
    range: "60 feet",
    components: "V, S",
    duration: "Instantaneous"
  },
  {
    name: "Spare the Dying",
    level: 0,
    school: "Necromancy",
    description: "Stabilizuješ umírajícího tvora.",
    castingTime: "1 action",
    range: "Touch",
    components: "V, S",
    duration: "Instantaneous"
  },
  {
    name: "Guidance",
    level: 0,
    school: "Divination",
    description: "Tvor přidá 1d4 k jednomu ability checku v příštích 10 minutách.",
    castingTime: "1 action",
    range: "Touch",
    components: "V, S",
    duration: "Concentration, up to 1 minute"
  },
  // LEVEL 1
  {
    name: "Cure Wounds",
    level: 1,
    school: "Evocation",
    description: "Vyléčíš tvora o 1d8 + spellcasting modifier HP.",
    castingTime: "1 action",
    range: "Touch",
    components: "V, S",
    duration: "Instantaneous"
  },
  {
    name: "Healing Word",
    level: 1,
    school: "Evocation",
    description: "Bonus action: Vyléčíš tvora o 1d4 + spellcasting modifier HP.",
    castingTime: "1 bonus action",
    range: "60 feet",
    components: "V",
    duration: "Instantaneous"
  },
  {
    name: "Bless",
    level: 1,
    school: "Enchantment",
    description: "Až 3 tvorové dostanou +1d4 na útoky a saving throws.",
    castingTime: "1 action",
    range: "30 feet",
    components: "V, S, M (svěcená voda)",
    duration: "Concentration, up to 1 minute"
  }
]

// ═══════════════════════════════════════════════
// SPELL SLOTS BY CLASS AND LEVEL
// ═══════════════════════════════════════════════

export const SPELL_SLOTS_BY_CLASS_LEVEL: Record<string, Record<number, Record<number, number>>> = {
  Paladin: {
    1: {}, // Paladin nemá kouzla na level 1
    2: { 1: 2 },
    3: { 1: 3 },
    4: { 1: 3 },
    5: { 1: 4, 2: 2 },
    6: { 1: 4, 2: 2 },
    7: { 1: 4, 2: 3 },
    8: { 1: 4, 2: 3 },
    9: { 1: 4, 2: 3, 3: 2 },
    10: { 1: 4, 2: 3, 3: 2 },
    11: { 1: 4, 2: 3, 3: 3 },
    12: { 1: 4, 2: 3, 3: 3 },
    13: { 1: 4, 2: 3, 3: 3, 4: 1 },
    14: { 1: 4, 2: 3, 3: 3, 4: 1 },
    15: { 1: 4, 2: 3, 3: 3, 4: 2 },
    16: { 1: 4, 2: 3, 3: 3, 4: 2 },
    17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
    18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
    19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
    20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }
  },
  Wizard: {
    1: { 1: 2 },
    2: { 1: 3 },
    3: { 1: 4, 2: 2 },
    4: { 1: 4, 2: 3 },
    5: { 1: 4, 2: 3, 3: 2 },
    6: { 1: 4, 2: 3, 3: 3 },
    7: { 1: 4, 2: 3, 3: 3, 4: 1 },
    8: { 1: 4, 2: 3, 3: 3, 4: 2 },
    9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
    10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
    11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
    12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
    13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
    14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
    15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
    16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
    17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
    18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
    19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
    20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 }
  },
  Cleric: {
    1: { 1: 2 },
    2: { 1: 3 },
    3: { 1: 4, 2: 2 },
    4: { 1: 4, 2: 3 },
    5: { 1: 4, 2: 3, 3: 2 },
    6: { 1: 4, 2: 3, 3: 3 },
    7: { 1: 4, 2: 3, 3: 3, 4: 1 },
    8: { 1: 4, 2: 3, 3: 3, 4: 2 },
    9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
    10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
    11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
    12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
    13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
    14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
    15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
    16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
    17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
    18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
    19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
    20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 }
  },
  // Fighter, Rogue, Barbarian, Monk - non-spellcasters
  Fighter: {},
  Rogue: {},
  Barbarian: {},
  Monk: {}
}

// ═══════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════

/**
 * Získá všechna kouzla dostupná pro danou třídu
 */
export function getSpellsForClass(className: string): SpellDefinition[] {
  switch (className) {
    case 'Paladin':
      return PALADIN_SPELLS
    case 'Wizard':
      return WIZARD_SPELLS
    case 'Cleric':
      return CLERIC_SPELLS
    default:
      return []
  }
}

/**
 * Získá spell sloty pro danou třídu a level
 */
export function getSpellSlotsForLevel(
  className: string,
  characterLevel: number
): Record<number, number> {
  return SPELL_SLOTS_BY_CLASS_LEVEL[className]?.[characterLevel] || {}
}

/**
 * Získá počáteční kouzla pro novou postavu
 * Cantrips + nějaká level 1 kouzla (pokud jsou dostupná)
 */
export function getInitialSpellsForCharacter(
  className: string,
  characterLevel: number
): SpellDefinition[] {
  const allSpells = getSpellsForClass(className)

  if (allSpells.length === 0) {
    return [] // Non-spellcaster
  }

  // Paladin nemá kouzla na level 1
  if (className === 'Paladin' && characterLevel < 2) {
    return []
  }

  // Začínající wizard dostane cantrips + nějaká level 1 kouzla
  if (className === 'Wizard') {
    const cantrips = allSpells.filter(s => s.level === 0).slice(0, 3)
    const level1Spells = allSpells.filter(s => s.level === 1).slice(0, 4)
    return [...cantrips, ...level1Spells]
  }

  // Cleric dostane všechny cantrips + pár level 1
  if (className === 'Cleric') {
    const cantrips = allSpells.filter(s => s.level === 0)
    const level1Spells = allSpells.filter(s => s.level === 1).slice(0, 3)
    return [...cantrips, ...level1Spells]
  }

  // Paladin level 2+ dostane pár level 1 kouzel
  if (className === 'Paladin' && characterLevel >= 2) {
    return allSpells.filter(s => s.level === 1).slice(0, 3)
  }

  return []
}

/**
 * Kontrola zda třída je spellcaster
 */
export function isSpellcaster(className: string): boolean {
  return ['Paladin', 'Wizard', 'Cleric', 'Sorcerer', 'Warlock', 'Bard', 'Druid', 'Ranger'].includes(className)
}
