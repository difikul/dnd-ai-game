# Plán opravy BUG-001: Stat bonusy v CharacterSheet

**Datum:** 2025-11-27
**Priorita:** HIGH
**Status:** PLANNED

---

## Popis problému

Stat bonusy z propojených předmětů se nezobrazují v CharacterSheet sidebaru.

| Komponenta | Aktuální stav | Očekávaný stav |
|------------|---------------|----------------|
| Inventář footer | "Bonusy: SÍL +2" | OK |
| CharacterSheet sidebar | STR: 15 (+2) | STR: 17 (+3) |

**Příčina:** Backend vrací pouze základní statistiky postavy. Frontend CharacterSheet nepřičítá bonusy z vybavení.

---

## Doporučený přístup: Backend rozšíření

Backend endpoint `GET /api/characters/:id` bude vracet i `effectiveStats` s bonusy z vybavení. Centralizovaná logika na backendu.

---

## Implementační kroky

### Krok 1: Rozšířit characterService.ts

**Soubor:** `backend/src/services/characterService.ts`

**Změny:**

1. Import itemService:
```typescript
import { itemService } from './itemService'
```

2. Upravit funkci `getCharacter()` - přidat výpočet effectiveStats:
```typescript
export async function getCharacter(userId: string, id: string): Promise<CharacterWithEffectiveStats | null> {
  const character = await prisma.character.findFirst({
    where: { id, userId },
    include: { inventory: true, knownSpells: true, spellSlots: true, classFeatures: true }
  })

  if (!character) return null

  // Vypočítat bonusy z vybavení
  const equippedBonuses = await itemService.calculateEquippedBonuses(id)

  // Vypočítat efektivní statistiky
  const effectiveStats = {
    strength: character.strength + (equippedBonuses.strength || 0),
    dexterity: character.dexterity + (equippedBonuses.dexterity || 0),
    constitution: character.constitution + (equippedBonuses.constitution || 0),
    intelligence: character.intelligence + (equippedBonuses.intelligence || 0),
    wisdom: character.wisdom + (equippedBonuses.wisdom || 0),
    charisma: character.charisma + (equippedBonuses.charisma || 0),
  }

  return {
    ...character,
    effectiveStats,
    equippedBonuses
  }
}
```

---

### Krok 2: Rozšířit backend typy

**Soubor:** `backend/src/types/api.types.ts`

**Přidat:**
```typescript
export interface EffectiveStats {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export interface EquippedBonuses {
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  acBonus?: number
  hpBonus?: number
}
```

---

### Krok 3: Rozšířit frontend Character interface

**Soubor:** `frontend/src/types/character.ts`

**Přidat do Character interface:**
```typescript
export interface Character {
  // ... existing fields ...

  // Efektivní statistiky (základní + bonusy z vybavení)
  effectiveStats?: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }

  // Bonusy z vybavení (pro vizuální indikaci)
  equippedBonuses?: {
    strength?: number
    dexterity?: number
    constitution?: number
    intelligence?: number
    wisdom?: number
    charisma?: number
    acBonus?: number
    hpBonus?: number
  }
}
```

---

### Krok 4: Upravit StatBlock.vue

**Soubor:** `frontend/src/components/character/StatBlock.vue`

**Změny:**

1. Přidat prop pro bonus:
```typescript
interface Props {
  ability: AbilityScoreName
  score: number
  bonus?: number  // Bonus z vybavení pro vizuální indikaci
  highlighted?: boolean
}
```

2. Přidat vizuální indikaci bonusu:
- Zelený rámeček kolem StatBlock s bonusem
- Malý badge v rohu zobrazující "+2"
- Tooltip s vysvětlením

---

### Krok 5: Upravit CharacterSheet.vue

**Soubor:** `frontend/src/components/character/CharacterSheet.vue`

**Změny:**

1. Použít effectiveStats místo základních statistik:
```typescript
function getAbilityScore(ability: AbilityScoreName): number {
  // Použij effectiveStats pokud jsou dostupné, jinak základní hodnotu
  if (props.character.effectiveStats) {
    return props.character.effectiveStats[ability]
  }
  return props.character[ability]
}

function getAbilityBonus(ability: AbilityScoreName): number {
  return props.character.equippedBonuses?.[ability] || 0
}
```

2. Předat bonus do StatBlock:
```vue
<StatBlock
  v-for="ability in ABILITY_SCORES"
  :key="ability"
  :ability="ability"
  :score="getAbilityScore(ability)"
  :bonus="getAbilityBonus(ability)"
  :highlighted="isHighlighted(ability)"
/>
```

---

## Vizuální návrh

**StatBlock s bonusem:**
```
┌─────────────────────┐
│            ┌──────┐ │
│ STR        │ +2   │ │  ← Zelený badge bonusu
│            └──────┘ │
│      17             │  ← Efektivní hodnota
│    ┌────────┐       │
│    │  +3    │       │  ← Modifikátor
│    └────────┘       │
└─────────────────────┘
     ↑ Zelený rámeček
```

---

## Kritické soubory

| Soubor | Akce |
|--------|------|
| `backend/src/services/characterService.ts` | Upravit - přidat výpočet effectiveStats |
| `backend/src/types/api.types.ts` | Přidat - EffectiveStats, EquippedBonuses interfaces |
| `frontend/src/types/character.ts` | Rozšířit - Character interface o effectiveStats |
| `frontend/src/components/character/StatBlock.vue` | Upravit - přidat props pro bonus |
| `frontend/src/components/character/CharacterSheet.vue` | Upravit - použít effectiveStats |

---

## Testování

1. Vytvořit postavu s STR 15
2. Přidat předmět s `statBonuses: { strength: 2 }` a `requiresAttunement: true`
3. Nasadit předmět → STR by měla zůstat 15
4. Propojit předmět → STR by se měla změnit na 17 (+3) se zelenou indikací
5. Odpojit předmět → STR zpět na 15 (+2)

---

## Výhody backend řešení

- Centralizovaná logika na jednom místě
- Frontend dostává kompletní data v jednom API callu
- Konzistentní výpočty napříč aplikací
- Snazší testování backend logiky
