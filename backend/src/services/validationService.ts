/**
 * Validation Service
 * Pre-validation layer pro kontrolu herních akcí před odesláním do AI
 * Zajišťuje hard rules - spell casting, forbidden actions, atd.
 */

import { prisma } from '../config/database'
import { KnownSpell, SpellSlot } from '@prisma/client'

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

export interface ValidationResult {
  valid: boolean
  reason?: string
  detectedSpell?: {
    name: string
    level: number
  }
}

// ═══════════════════════════════════════════════
// FORBIDDEN PATTERNS
// ═══════════════════════════════════════════════

/**
 * Zakázané vzory - moderní technologie, nesmysly, atd.
 * Tyto akce jsou odmítnuty ještě před AI
 */
const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /počítač|computer|pc|laptop|notebook|tablet/i,
    reason: 'Počítače ve fantasy světě neexistují. Zkus použít kouzlo nebo komunikovat s mágem.'
  },
  {
    pattern: /hitler|stalin|lenin|moderní|současnost|21\. století/i,
    reason: 'Reference na moderní historii nedávají ve fantasy světě smysl.'
  },
  {
    pattern: /auto|automobil|car|truck|bus|letadlo|airplane|plane|helikoptéra/i,
    reason: 'Moderní dopravní prostředky ve fantasy světě neexistují. Můžeš použít koně, vůz, nebo loď.'
  },
  {
    pattern: /telefon|mobil|smartphone|iphone|android/i,
    reason: 'Komunikační technologie neexistují. Můžeš použít kouzlo Message nebo poslat posla.'
  },
  {
    pattern: /internet|wifi|bluetooth|usb|email|www/i,
    reason: 'Digitální technologie ve fantasy světě neexistují.'
  },
  {
    pattern: /puška|pistole|revolver|samopal|granát|bomba|dynamit/i,
    reason: 'Střelné zbraně a výbušniny v tomto fantasy světě neexistují. Použij meč, luk, nebo kouzlo.'
  }
]

// ═══════════════════════════════════════════════
// SPELL DETECTION
// ═══════════════════════════════════════════════

/**
 * Detekuje spell casting v akci hráče
 * Vrací název kouzla pokud je nalezeno
 */
function detectSpellInAction(action: string, knownSpells: KnownSpell[]): string | null {
  const lowerAction = action.toLowerCase()

  // Hledej přesné shody se známými kouzly
  for (const spell of knownSpells) {
    const spellNameLower = spell.spellName.toLowerCase()

    // Přesná shoda nebo shoda s českým překladem běžných kouzel
    if (lowerAction.includes(spellNameLower)) {
      return spell.spellName
    }

    // České aliasy pro běžná kouzla
    const czechAliases: Record<string, string[]> = {
      'Fireball': ['ohnivá koule', 'ohnivou kouli', 'fireball'],
      'Magic Missile': ['magická střela', 'magickou střelu', 'magic missile'],
      'Cure Wounds': ['vyléčení ran', 'vyléčení', 'cure wounds', 'heal', 'léčení'],
      'Shield': ['štít', 'shield'],
      'Fire Bolt': ['ohnivý šíp', 'ohnivou střelu', 'fire bolt'],
      'Healing Word': ['léčivé slovo', 'healing word'],
      'Bless': ['požehnání', 'bless', 'požehnej']
    }

    const aliases = czechAliases[spell.spellName] || []
    for (const alias of aliases) {
      if (lowerAction.includes(alias)) {
        return spell.spellName
      }
    }
  }

  // Regex vzory pro spell casting
  const spellCastingPatterns = [
    /(?:sešlu|použiju|cast|vyvolám|sesílám)\s+([a-zá-ž\s]+)/i,
    /(?:kouzlo|spell)\s+([a-zá-ž\s]+)/i,
    /(?:vyčaruji|vyčarovat)\s+([a-zá-ž\s]+)/i
  ]

  for (const pattern of spellCastingPatterns) {
    const match = action.match(pattern)
    if (match) {
      const potentialSpellName = match[1].trim()

      // Fuzzy match s known spells
      const found = knownSpells.find(s =>
        s.spellName.toLowerCase().includes(potentialSpellName.toLowerCase()) ||
        potentialSpellName.toLowerCase().includes(s.spellName.toLowerCase())
      )

      if (found) {
        return found.spellName
      }
    }
  }

  return null
}

// ═══════════════════════════════════════════════
// MAIN VALIDATION FUNCTION
// ═══════════════════════════════════════════════

/**
 * Validuje akci hráče před odesláním do AI
 * Kontroluje:
 * 1. Spell casting - zda postava zná kouzlo a má dostupný spell slot
 * 2. Forbidden actions - moderní technologie, nesmysly
 */
export async function validatePlayerAction(
  characterId: string,
  action: string
): Promise<ValidationResult> {
  console.log(`🔍 Validuji akci pro postavu ${characterId}`)
  console.log(`   Akce: "${action.substring(0, 100)}..."`)

  // 1. Načti postavu s relations
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: {
      knownSpells: true,
      spellSlots: {
        orderBy: { level: 'asc' }
      }
    }
  })

  if (!character) {
    return { valid: false, reason: 'Postava nenalezena' }
  }

  // 2. Kontrola zakázaných akcí (moderní technologie, atd.)
  for (const forbidden of FORBIDDEN_PATTERNS) {
    if (forbidden.pattern.test(action)) {
      console.log(`   ❌ Zakázaná akce detekována: ${forbidden.reason}`)
      return {
        valid: false,
        reason: forbidden.reason
      }
    }
  }

  // 3. Detekce spell castingu
  const detectedSpell = detectSpellInAction(action, character.knownSpells)

  if (detectedSpell) {
    console.log(`   🔮 Detekováno kouzlo: ${detectedSpell}`)

    // 4. Kontrola, zda postava zná kouzlo
    const knownSpell = character.knownSpells.find(
      s => s.spellName === detectedSpell
    )

    if (!knownSpell) {
      const availableSpells = character.knownSpells
        .filter(s => s.spellLevel <= 3) // Zobraz jen nízké levely
        .map(s => `${s.spellName} (L${s.spellLevel})`)
        .join(', ')

      return {
        valid: false,
        reason: `Tvá postava nezná kouzlo "${detectedSpell}". Dostupná kouzla: ${availableSpells || 'žádná'}`
      }
    }

    // 5. Kontrola spell slotů (pokud není cantrip)
    if (knownSpell.spellLevel > 0) {
      const slot = character.spellSlots.find(s => s.level === knownSpell.spellLevel)

      if (!slot || slot.current <= 0) {
        const availableSlots = character.spellSlots
          .filter(s => s.current > 0)
          .map(s => `Level ${s.level}: ${s.current}/${s.maximum}`)
          .join(', ')

        return {
          valid: false,
          reason: `Nemáš dostupný spell slot úrovně ${knownSpell.spellLevel} pro kouzlo "${knownSpell.spellName}". ${availableSlots ? `Dostupné sloty: ${availableSlots}` : 'Všechny spell sloty byly spotřebovány. Odpočiň si pro obnovení.'}`
        }
      }

      console.log(`   ✅ Spell slot level ${knownSpell.spellLevel} je dostupný (${slot.current}/${slot.maximum})`)
    } else {
      console.log(`   ✅ Cantrip - nevyžaduje spell slot`)
    }

    return {
      valid: true,
      detectedSpell: {
        name: knownSpell.spellName,
        level: knownSpell.spellLevel
      }
    }
  }

  // 6. Akce neobsahuje spell ani zakázané vzory - je validní
  console.log(`   ✅ Akce je validní`)
  return { valid: true }
}

// ═══════════════════════════════════════════════
// SPELL SLOT MANAGEMENT
// ═══════════════════════════════════════════════

/**
 * Spotřebuje spell slot po úspěšném seslání kouzla
 */
export async function consumeSpellSlot(
  characterId: string,
  spellLevel: number
): Promise<void> {
  console.log(`⚡ Spotřebovávám spell slot level ${spellLevel} pro postavu ${characterId}`)

  const slot = await prisma.spellSlot.findFirst({
    where: {
      characterId,
      level: spellLevel
    }
  })

  if (slot && slot.current > 0) {
    await prisma.spellSlot.update({
      where: { id: slot.id },
      data: { current: slot.current - 1 }
    })

    console.log(`   ✅ Spell slot spotřebován (zbývá ${slot.current - 1}/${slot.maximum})`)
  } else {
    console.warn(`   ⚠️  Spell slot level ${spellLevel} nebyl nalezen nebo je již prázdný`)
  }
}

/**
 * Obnoví všechny spell sloty na maximum (Long Rest)
 */
export async function performLongRest(characterId: string): Promise<void> {
  console.log(`💤 Provádím Long Rest pro postavu ${characterId}`)

  // Obnov všechny spell sloty
  const slots = await prisma.spellSlot.findMany({
    where: { characterId }
  })

  for (const slot of slots) {
    await prisma.spellSlot.update({
      where: { id: slot.id },
      data: { current: slot.maximum }
    })
  }

  console.log(`   ⚡ Obnoveno ${slots.length} spell slotů`)

  // Obnov HP na maximum
  const character = await prisma.character.findUnique({
    where: { id: characterId }
  })

  if (character) {
    await prisma.character.update({
      where: { id: characterId },
      data: { hitPoints: character.maxHitPoints }
    })

    console.log(`   ❤️  HP obnoveno na ${character.maxHitPoints}`)
  }

  // TODO: Obnov class feature uses (když budou implementovány)

  console.log(`   ✅ Long Rest dokončen`)
}

/**
 * Obnoví polovinu spell slotů (Short Rest)
 * Zatím jednoduchá implementace - některé třídy mají speciální pravidla
 */
export async function performShortRest(characterId: string): Promise<void> {
  console.log(`☕ Provádím Short Rest pro postavu ${characterId}`)

  const character = await prisma.character.findUnique({
    where: { id: characterId }
  })

  if (character && character.class === 'Warlock') {
    // Warlock obnovuje všechny spell sloty i při Short Rest
    const slots = await prisma.spellSlot.findMany({
      where: { characterId }
    })

    for (const slot of slots) {
      await prisma.spellSlot.update({
        where: { id: slot.id },
        data: { current: slot.maximum }
      })
    }

    console.log(`   ⚡ Warlock: Obnoveny všechny spell sloty`)
  }

  // TODO: Monks obnovují ki points, fighters obnovují Second Wind, atd.

  console.log(`   ✅ Short Rest dokončen`)
}
