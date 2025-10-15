# Character System - Quick Start Guide

## Stav implementace

✅ **KOMPLETNÍ** - Character System frontend je plně implementován a připraven k použití.

## Co bylo implementováno

### 1. **TypeScript Types & Interfaces**
- `/src/types/character.ts` - Všechny typy pro Character system
- 9 ras (Human, Elf, Dwarf, Halfling, Dragonborn, Gnome, Half-Elf, Half-Orc, Tiefling)
- 12 tříd (Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard)

### 2. **Constants & Data**
- `/src/constants/races.ts` - Informace o rasách s bonusy a vlastnostmi
- `/src/constants/classes.ts` - Informace o třídách s hit dice a abilities

### 3. **Utility Functions**
- `/src/utils/dndCalculations.ts` - D&D mechaniky (modifiers, HP, AC, XP, Point Buy)

### 4. **API Services**
- `/src/services/api.service.ts` - Axios instance s interceptory
- `/src/services/character.service.ts` - Character API calls

### 5. **Pinia Store**
- `/src/stores/characterStore.ts` - State management pro postavy

### 6. **Vue Components**
```
/src/components/character/
├── StatBlock.vue          - Zobrazení ability score
├── RaceSelector.vue       - Grid výběr rasy
├── ClassSelector.vue      - Grid výběr třídy
├── CharacterCreator.vue   - Multi-step wizard
├── CharacterSheet.vue     - Detailní zobrazení postavy
└── CharacterList.vue      - Seznam postav
```

### 7. **Views**
- `/src/views/CharacterCreationView.vue` - Main view pro tvorbu postavy

## Jak spustit

### 1. Nastavení environment
```bash
cd frontend
cp .env.example .env
```

Upravit `.env`:
```env
VITE_API_URL=http://localhost:3000
```

### 2. Instalace dependencies
```bash
npm install
```

### 3. Type checking
```bash
npm run type-check
```

### 4. Spuštění dev serveru
```bash
npm run dev
```

Aplikace běží na: `http://localhost:5173`

## Použití

### Character Creation Flow

1. **Naviguj na `/create-character`**
2. **Krok 1 - Jméno & Rasa:**
   - Zadej jméno (min 3 znaky)
   - Vyber rasu z grid karet
   - Klikni "Další"

3. **Krok 2 - Povolání:**
   - Vyber třídu z grid karet
   - Klikni "Další"

4. **Krok 3 - Statistiky:**
   - **Standard Array:** Přiřaď hodnoty [15,14,13,12,10,8] k ability scores
   - **Point Buy:** Nastav statistiky s 27 body (rozsah 8-15)
   - Sleduj preview HP a AC
   - Klikni "Další"

5. **Krok 4 - Pozadí:**
   - (Volitelné) Přidej avatar URL
   - (Volitelné) Napiš příběh postavy
   - Zkontroluj shrnutí
   - Klikni "Vytvořit postavu"

6. **Redirect** → Automatický přesun do hry s novou postavou

### Zobrazení Character Sheet

```vue
<script setup lang="ts">
import CharacterSheet from '@/components/character/CharacterSheet.vue'
import { useCharacterStore } from '@/stores/characterStore'

const characterStore = useCharacterStore()
const character = characterStore.currentCharacter
</script>

<template>
  <CharacterSheet v-if="character" :character="character" />
</template>
```

### Seznam postav

```vue
<script setup lang="ts">
import CharacterList from '@/components/character/CharacterList.vue'
</script>

<template>
  <CharacterList />
</template>
```

## API Endpointy (očekávané)

Backend musí implementovat tyto endpointy:

### POST /api/characters
```json
// Request
{
  "name": "Aragorn",
  "race": "Human",
  "class": "Ranger",
  "strength": 15,
  "dexterity": 14,
  "constitution": 13,
  "intelligence": 10,
  "wisdom": 12,
  "charisma": 8,
  "background": "...",
  "avatarUrl": "https://..."
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Aragorn",
    "race": "Human",
    "class": "Ranger",
    "level": 1,
    "strength": 15,
    "dexterity": 14,
    "constitution": 13,
    "intelligence": 10,
    "wisdom": 12,
    "charisma": 8,
    "hitPoints": 12,
    "maxHitPoints": 12,
    "armorClass": 12,
    "experience": 0,
    "background": "...",
    "avatarUrl": "https://...",
    "createdAt": "2025-10-14T...",
    "updatedAt": "2025-10-14T..."
  }
}
```

### GET /api/characters/:id
Vrací jednu postavu

### GET /api/characters
```json
{
  "success": true,
  "data": {
    "characters": [...],
    "total": 5
  }
}
```

### PUT /api/characters/:id
Aktualizace postavy

### DELETE /api/characters/:id
Smazání postavy

## Styling

Používá TailwindCSS s dark fantasy theme:

### Hlavní barvy
- **Dark backgrounds:** `bg-dark-900`, `bg-dark-800`, `bg-dark-700`
- **Primary:** `bg-primary-500` (fantasy orange #f97316)
- **Accents:**
  - Gold: `text-fantasy-gold` (#ffd700)
  - Ruby: `text-fantasy-ruby` (#e0115f)
  - Emerald: `text-fantasy-emerald` (#50c878)
  - Sapphire: `text-fantasy-sapphire` (#0f52ba)

### Fonts
- **Display:** Cinzel (nadpisy)
- **Body:** Inter (text)
- **Mono:** JetBrains Mono (kód)

## D&D Mechaniky

### Ability Modifiers
```typescript
modifier = Math.floor((score - 10) / 2)
```

### Hit Points (Level 1)
```typescript
HP = hitDice + constitutionModifier
```

Hit dice dle třídy:
- d12: Barbarian
- d10: Fighter, Paladin, Ranger
- d8: Bard, Cleric, Druid, Monk, Rogue, Warlock
- d6: Sorcerer, Wizard

### Armor Class
```typescript
AC = 10 + dexterityModifier
```

### Proficiency Bonus
```typescript
bonus = Math.floor((level - 1) / 4) + 2
```

## TypeScript

Projekt je plně typovaný:

```typescript
import type { Character, CharacterRace, CharacterClass } from '@/types/character'
import { useCharacterStore } from '@/stores/characterStore'

const characterStore = useCharacterStore()

// Create character
const character: Character = await characterStore.createCharacter({
  name: 'Gandalf',
  race: 'Human',
  class: 'Wizard',
  strength: 8,
  dexterity: 10,
  constitution: 12,
  intelligence: 15,
  wisdom: 14,
  charisma: 13
})
```

## Responsivní Design

- **Mobile:** < 640px (1 column)
- **Tablet:** 640-1024px (2 columns)
- **Desktop:** > 1024px (3-4 columns)

## Validace

### Character Name
- Min 3 znaky
- Max 50 znaků
- Required

### Race & Class
- Required výběr

### Ability Scores
- **Standard Array:** Všech 6 hodnot musí být přiřazeno
- **Point Buy:** Maximálně 27 bodů, rozsah 8-15

### Background
- Max 1000 znaků
- Volitelné

## Error Handling

- API errors zobrazeny v UI
- Form validation errors pod inputy
- Loading states během API calls
- Retry mechanismus při chybách

## Další kroky (budoucí rozšíření)

1. Skills & Proficiencies
2. Equipment & Inventory
3. Spell management
4. Level up system
5. Character import/export
6. Multi-classing
7. Custom backgrounds

## Dokumentace

Kompletní dokumentace v `/CHARACTER_SYSTEM_DOCS.md`

## Status

✅ TypeScript kompilace bez chyb
✅ Všechny komponenty implementovány
✅ Pinia store připravena
✅ API services připraveny
✅ Dark fantasy theme
✅ Responsive design
✅ Form validace

**PŘIPRAVENO PRO BACKEND INTEGRACI**
