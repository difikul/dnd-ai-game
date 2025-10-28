/**
 * D&D 5e Class Features Definitions
 * Schopnosti tříd podle levelu
 */

export interface ClassFeatureDefinition {
  name: string
  unlockLevel: number
  description: string
  usesPerRest?: number | 'proficiency' | 'charisma' | 'wisdom' // null = unlimited
}

// ═══════════════════════════════════════════════
// PALADIN CLASS FEATURES
// ═══════════════════════════════════════════════

export const PALADIN_FEATURES: ClassFeatureDefinition[] = [
  {
    name: "Divine Sense",
    unlockLevel: 1,
    description: "Jako akci můžeš detekovat přítomnost celestials, fiends a undead do 60 ft. Zjistíš jejich typ (ne identitu).",
    usesPerRest: 'charisma' // 1 + CHA modifier per long rest
  },
  {
    name: "Lay on Hands",
    unlockLevel: 1,
    description: "Máš pool HP (level × 5) který můžeš použít na léčení dotykem. Můžeš také vyléčit jednu nemoc nebo otravu za 5 HP.",
    usesPerRest: null // Pool se obnovuje na long rest
  },
  {
    name: "Fighting Style",
    unlockLevel: 2,
    description: "Vyber si fighting style: Defense (+1 AC v brnění), Dueling (+2 damage s one-handed zbraní), Great Weapon Fighting (přehoď 1-2 na damage dice).",
    usesPerRest: null // Pasivní
  },
  {
    name: "Divine Smite",
    unlockLevel: 2,
    description: "Když zasáhneš melee útokem, můžeš spotřebovat spell slot a přidat 2d8 radiant damage (+1d8 per slot level, max 5d8). +1d8 proti undead/fiendům.",
    usesPerRest: null // Vyžaduje spell slot
  },
  {
    name: "Divine Health",
    unlockLevel: 3,
    description: "Jsi imunní vůči všem nemocem.",
    usesPerRest: null // Pasivní
  },
  {
    name: "Sacred Oath",
    unlockLevel: 3,
    description: "Zvol si Sacred Oath (Oath of Devotion, Oath of Vengeance, atd.) která ti dá další schopnosti.",
    usesPerRest: null
  },
  {
    name: "Extra Attack",
    unlockLevel: 5,
    description: "Můžeš zaútočit dvakrát místo jednou když použiješ Attack action.",
    usesPerRest: null // Pasivní
  },
  {
    name: "Aura of Protection",
    unlockLevel: 6,
    description: "Ty a friendly creatures do 10 ft dostávají bonus k saving throwům roven tvému CHA modifieru.",
    usesPerRest: null // Pasivní
  }
]

// ═══════════════════════════════════════════════
// WIZARD CLASS FEATURES
// ═══════════════════════════════════════════════

export const WIZARD_FEATURES: ClassFeatureDefinition[] = [
  {
    name: "Arcane Recovery",
    unlockLevel: 1,
    description: "Během short rest můžeš obnovit spell sloty s celkovou úrovní max (level/2, zaokrouhleno nahoru). Nelze obnovit 6+ level sloty.",
    usesPerRest: 1 // Jednou per long rest
  },
  {
    name: "Arcane Tradition",
    unlockLevel: 2,
    description: "Vyber si Arcane Tradition (School of Evocation, School of Abjuration, atd.).",
    usesPerRest: null
  },
  {
    name: "Spell Mastery",
    unlockLevel: 18,
    description: "Vyber si jedno 1st-level spell a jedno 2nd-level spell z tvé spellbook. Můžeš je sesílat jako cantrips.",
    usesPerRest: null
  },
  {
    name: "Signature Spells",
    unlockLevel: 20,
    description: "Vyber si dvě 3rd-level spells z tvé spellbook. Jsou vždy prepared a každé můžeš seslat jednou bez spotřeby spell slotu.",
    usesPerRest: 2
  }
]

// ═══════════════════════════════════════════════
// CLERIC CLASS FEATURES
// ═══════════════════════════════════════════════

export const CLERIC_FEATURES: ClassFeatureDefinition[] = [
  {
    name: "Divine Domain",
    unlockLevel: 1,
    description: "Vyber si Divine Domain (Life, War, Light, atd.) která ti dá domain spells a schopnosti.",
    usesPerRest: null
  },
  {
    name: "Channel Divinity",
    unlockLevel: 2,
    description: "Můžeš channelovat divine energy přímo od svého božstva. Efekt závisí na Divine Domain.",
    usesPerRest: 1 // 2× per rest od level 6, 3× per rest od level 18
  },
  {
    name: "Destroy Undead",
    unlockLevel: 5,
    description: "Když použiješ Turn Undead, undead s CR 1/2 nebo nižší jsou automaticky zničeni.",
    usesPerRest: null // Součást Channel Divinity
  },
  {
    name: "Divine Intervention",
    unlockLevel: 10,
    description: "Můžeš požádat své božstvo o pomoc. Hod d100 - pokud hodíš level nebo méně, božstvo zasáhne. Pokud uspěješ, nemůžeš použít znovu 7 dní.",
    usesPerRest: null // Speciální pravidla
  }
]

// ═══════════════════════════════════════════════
// FIGHTER CLASS FEATURES
// ═══════════════════════════════════════════════

export const FIGHTER_FEATURES: ClassFeatureDefinition[] = [
  {
    name: "Fighting Style",
    unlockLevel: 1,
    description: "Vyber si fighting style: Archery (+2 k útoku s ranged), Defense (+1 AC), Dueling (+2 damage).",
    usesPerRest: null
  },
  {
    name: "Second Wind",
    unlockLevel: 1,
    description: "Jako bonus action si vyléčíš 1d10 + level HP.",
    usesPerRest: 1 // Per short rest
  },
  {
    name: "Action Surge",
    unlockLevel: 2,
    description: "Můžeš provést jednu extra akci ve svém tahu.",
    usesPerRest: 1 // 2× per rest od level 17
  },
  {
    name: "Extra Attack",
    unlockLevel: 5,
    description: "Můžeš zaútočit dvakrát když použiješ Attack action.",
    usesPerRest: null
  },
  {
    name: "Indomitable",
    unlockLevel: 9,
    description: "Můžeš rerollovat failed saving throw.",
    usesPerRest: 1 // 2× od level 13, 3× od level 17
  }
]

// ═══════════════════════════════════════════════
// ROGUE CLASS FEATURES
// ═══════════════════════════════════════════════

export const ROGUE_FEATURES: ClassFeatureDefinition[] = [
  {
    name: "Sneak Attack",
    unlockLevel: 1,
    description: "Jednou per turn přidej 1d6 damage (zvyšuje se s levelem) pokud máš advantage nebo je nepřítel vedle ally.",
    usesPerRest: null // Pasivní
  },
  {
    name: "Thieves' Cant",
    unlockLevel: 1,
    description: "Znáš tajný jazyk zlodějů pro skryté zprávy.",
    usesPerRest: null
  },
  {
    name: "Cunning Action",
    unlockLevel: 2,
    description: "Můžeš provést Dash, Disengage nebo Hide jako bonus action.",
    usesPerRest: null
  },
  {
    name: "Uncanny Dodge",
    unlockLevel: 5,
    description: "Jako reakci půlíš damage z útoku který vidíš.",
    usesPerRest: null
  },
  {
    name: "Evasion",
    unlockLevel: 7,
    description: "Při DEX saving throw nebereš žádný damage pokud uspěješ, půl pokud neuspěješ.",
    usesPerRest: null
  }
]

// ═══════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════

const CLASS_FEATURES_MAP: Record<string, ClassFeatureDefinition[]> = {
  Paladin: PALADIN_FEATURES,
  Wizard: WIZARD_FEATURES,
  Cleric: CLERIC_FEATURES,
  Fighter: FIGHTER_FEATURES,
  Rogue: ROGUE_FEATURES,
  // TODO: Přidat další třídy
  Barbarian: [],
  Bard: [],
  Druid: [],
  Monk: [],
  Ranger: [],
  Sorcerer: [],
  Warlock: []
}

/**
 * Získá class features pro danou třídu a level
 */
export function getClassFeaturesForLevel(
  className: string,
  characterLevel: number
): ClassFeatureDefinition[] {
  const allFeatures = CLASS_FEATURES_MAP[className] || []
  return allFeatures.filter(f => f.unlockLevel <= characterLevel)
}

/**
 * Vypočítá uses per rest pro feature podle typu
 */
export function calculateUsesPerRest(
  feature: ClassFeatureDefinition,
  character: { level: number; charisma: number; wisdom: number }
): number {
  if (typeof feature.usesPerRest === 'number') {
    return feature.usesPerRest
  }

  if (feature.usesPerRest === 'proficiency') {
    return Math.floor((character.level - 1) / 4) + 2
  }

  if (feature.usesPerRest === 'charisma') {
    const chaMod = Math.floor((character.charisma - 10) / 2)
    return Math.max(1, 1 + chaMod)
  }

  if (feature.usesPerRest === 'wisdom') {
    const wisMod = Math.floor((character.wisdom - 10) / 2)
    return Math.max(1, 1 + wisMod)
  }

  return 0 // Unlimited nebo speciální pravidla
}

/**
 * Získá počáteční class features pro nově vytvořenou postavu
 */
export function getInitialClassFeatures(
  className: string,
  level: number
): ClassFeatureDefinition[] {
  return getClassFeaturesForLevel(className, level)
}
