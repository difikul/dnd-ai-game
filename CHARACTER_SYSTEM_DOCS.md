# Character System - Dokumentace Frontend

## Přehled

Kompletní frontend implementace Character System pro D&D aplikaci v rámci KROK 3. Systém umožňuje vytváření, zobrazení a správu D&D postav pomocí Vue 3, TypeScript, Pinia a TailwindCSS.

## Struktura projektu

```
frontend/src/
├── types/
│   └── character.ts              # TypeScript interfaces a typy
├── constants/
│   ├── races.ts                  # Informace o rasách
│   └── classes.ts                # Informace o povoláních
├── utils/
│   └── dndCalculations.ts        # D&D kalkulace (modifiers, HP, AC)
├── services/
│   ├── api.service.ts            # Axios instance s interceptory
│   └── character.service.ts      # Character API volání
├── stores/
│   └── characterStore.ts         # Pinia store pro character state
├── components/
│   └── character/
│       ├── StatBlock.vue         # Zobrazení jednotlivé statistiky
│       ├── RaceSelector.vue      # Grid pro výběr rasy
│       ├── ClassSelector.vue     # Grid pro výběr povolání
│       ├── CharacterCreator.vue  # Multi-step wizard pro tvorbu postavy
│       ├── CharacterSheet.vue    # Detailní zobrazení postavy
│       └── CharacterList.vue     # Seznam postav
└── views/
    └── CharacterCreationView.vue # View pro tvorbu postavy
```

## Implementované komponenty

### 1. TypeScript Types (`types/character.ts`)

**Definované typy:**
- `CharacterRace` - 9 ras (Human, Elf, Dwarf, Halfling, Dragonborn, Gnome, Half-Elf, Half-Orc, Tiefling)
- `CharacterClass` - 12 tříd (Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard)
- `Character` - Hlavní interface pro postavu
- `CreateCharacterDto` - DTO pro vytvoření postavy
- `UpdateCharacterDto` - DTO pro aktualizaci postavy
- `AbilityScores` - Interface pro ability scores
- `CreationStep` - Enum pro kroky tvorby postavy
- `AbilityScoreMethod` - Enum pro metody přidělování statistik

### 2. Constants

**Races (`constants/races.ts`):**
```typescript
export const RACE_DATA: Record<CharacterRace, RaceInfo>
```
Obsahuje kompletní informace o všech 9 rasách včetně:
- Description
- Ability bonuses
- Rasové vlastnosti
- Ikony

**Classes (`constants/classes.ts`):**
```typescript
export const CLASS_DATA: Record<CharacterClass, ClassInfo>
```
Obsahuje kompletní informace o všech 12 třídách včetně:
- Description
- Hit dice
- Primary abilities
- Saving throws
- Ikony

### 3. Utility Functions (`utils/dndCalculations.ts`)

**Hlavní funkce:**
- `calculateModifier(score)` - Výpočet modifikátoru z ability score
- `formatModifier(modifier)` - Formátování modifikátoru (+2, -1)
- `calculateProficiencyBonus(level)` - Proficiency bonus dle úrovně
- `calculateMaxHP(class, conModifier)` - Výpočet max HP
- `calculateBaseAC(dexModifier)` - Základní AC
- `calculatePointBuyCost(scores)` - Point Buy kalkulace
- `getStandardArray()` - Standard Array [15, 14, 13, 12, 10, 8]
- `experienceForLevel(level)` - XP potřebné pro level

### 4. API Services

**API Service (`services/api.service.ts`):**
- Axios instance s base URL
- Request interceptor pro auth token
- Response interceptor pro error handling
- Error message extraction

**Character Service (`services/character.service.ts`):**
- `createCharacter(data)` - POST /api/characters
- `getCharacter(id)` - GET /api/characters/:id
- `getAllCharacters()` - GET /api/characters
- `updateCharacter(id, data)` - PUT /api/characters/:id
- `deleteCharacter(id)` - DELETE /api/characters/:id

### 5. Pinia Store (`stores/characterStore.ts`)

**State:**
- `currentCharacter: Character | null`
- `characters: Character[]`
- `loading: boolean`
- `error: string | null`

**Getters:**
- `hasCharacter`
- `characterCount`
- `isLoading`
- `hasError`

**Actions:**
- `createCharacter(data)`
- `loadCharacter(id)`
- `loadAllCharacters()`
- `updateCharacter(id, data)`
- `deleteCharacter(id)`
- `setCurrentCharacter(character)`
- `clearError()`
- `reset()`

### 6. Vue Komponenty

#### StatBlock.vue
Zobrazuje jednotlivou ability statistiku (STR, DEX, CON, INT, WIS, CHA).

**Props:**
- `ability: AbilityScoreName` - Název statistiky
- `score: number` - Hodnota statistiky
- `highlighted?: boolean` - Zvýraznění (pro primary abilities)

**Features:**
- Zobrazení score a modifikátoru
- Highlighted stav pro primary abilities
- Hover efekty

#### RaceSelector.vue
Grid karet pro výběr rasy postavy.

**Props:**
- `modelValue: CharacterRace | null` - V-model pro výběr

**Emits:**
- `update:modelValue` - Emituje vybranou rasu

**Features:**
- 3x3 grid s 9 rasami
- Zobrazení ikony, názvu, popisu
- Ability bonusy
- Selection indicator
- Hover a focus efekty

#### ClassSelector.vue
Grid karet pro výběr povolání postavy.

**Props:**
- `modelValue: CharacterClass | null` - V-model pro výběr

**Emits:**
- `update:modelValue` - Emituje vybrané povolání

**Features:**
- 4-column responsive grid s 12 třídami
- Zobrazení ikony, názvu, popisu
- Hit dice a primary abilities
- Selection indicator
- Hover a focus efekty

#### CharacterCreator.vue
Multi-step wizard pro vytvoření postavy.

**Kroky:**
1. **Name & Race** - Jméno + výběr rasy
2. **Class** - Výběr povolání
3. **Ability Scores** - Standard Array nebo Point Buy
4. **Background** - Avatar URL + příběh (volitelné)

**Features:**
- Progress bar
- Form validace na každém kroku
- Real-time stat preview (HP, AC)
- Standard Array assignment
- Point Buy s cost tracking
- Loading states
- Error handling
- Navigace Zpět/Další/Vytvořit

#### CharacterSheet.vue
Detailní zobrazení vytvořené postavy.

**Props:**
- `character: Character` - Postava k zobrazení

**Features:**
- Header s avatarem a základními info
- Combat stats (HP bar, AC, XP progress)
- Všechny ability scores s highlighting
- Background/příběh
- Race & class information s vlastnostmi
- Responsive design

#### CharacterList.vue
Seznam všech postav uživatele.

**Features:**
- Grid postav (1/2/3 columns responsive)
- Character cards s základními stats
- Loading state
- Error state s retry
- Empty state
- "Nová postava" button
- Kliknutí na kartu → navigace do game

### 7. Views

#### CharacterCreationView.vue
Main view pro tvorbu postavy.

**Features:**
- Header s nadpisem
- Error display s dismiss
- CharacterCreator component
- "Zpět na hlavní stránku" link
- Čištění errors při mount

## D&D Mechaniky

### Ability Scores
- **Rozsah:** 3-20 (standardně 8-15 pro Point Buy/Array)
- **Modifikátor:** `(score - 10) / 2` zaokrouhleno dolů
- **Formát:** +2, -1, +0

### Hit Points (HP)
- **Level 1:** Hit dice + CON modifier
- **Hit dice dle třídy:**
  - d12: Barbarian
  - d10: Fighter, Paladin, Ranger
  - d8: Bard, Cleric, Druid, Monk, Rogue, Warlock
  - d6: Sorcerer, Wizard

### Armor Class (AC)
- **Base AC:** 10 + DEX modifier
- **Zobrazení:** S kruhovým indikátorem

### Proficiency Bonus
- **Vzorec:** `⌊(level - 1) / 4⌋ + 2`
- **Hodnoty:** +2 (lvl 1-4), +3 (5-8), +4 (9-12), +5 (13-16), +6 (17-20)

### Experience (XP)
- **Tracking:** Current XP / Next level XP
- **Progress bar:** Vizuální indikátor
- **XP table:** Implementováno pro level 1-20

### Ability Score Assignment

**Standard Array:**
- Hodnoty: [15, 14, 13, 12, 10, 8]
- Hráč přiřadí každou hodnotu jedné statistice
- Dropdown select pro každou ability

**Point Buy:**
- 27 bodů k distribuci
- Rozsah: 8-15
- Cost table:
  - 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
- Real-time cost tracking

## Styling - Dark Fantasy Theme

### Barvy
```css
/* Dark backgrounds */
bg-dark-900: #0a0a0f
bg-dark-800: #1a1a2e
bg-dark-700: #16213e

/* Primary - Fantasy Orange */
bg-primary-500: #f97316
bg-primary-600: #ea580c

/* Fantasy accents */
text-fantasy-gold: #ffd700
text-fantasy-ruby: #e0115f
text-fantasy-emerald: #50c878
text-fantasy-sapphire: #0f52ba
```

### Komponenty
- **Cards:** dark-800 background, dark-600 border, hover efekty
- **Buttons:** primary-600, hover:primary-500
- **Inputs:** dark-800 bg, dark-600 border, focus:primary-500
- **Progress bars:** Gradient od primary-500 k fantasy-gold

### Animace
- `animate-fade-in` - Fade in při změně kroku
- Transition duration: 300ms
- Hover scale efekty na kartách
- Loading spinners

## API Integrace

### Environment Variables
```env
VITE_API_URL=http://localhost:3000
```

### Expected Backend Endpoints

**POST /api/characters**
```json
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
```

**Response:**
```json
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

**GET /api/characters/:id**
- Vrací jednu postavu

**GET /api/characters**
```json
{
  "success": true,
  "data": {
    "characters": [...],
    "total": 5
  }
}
```

**PUT /api/characters/:id**
- Aktualizace postavy (level, HP, XP, etc.)

**DELETE /api/characters/:id**
- Smazání postavy

## Testovací Flow

### 1. Vytvoření postavy
```bash
# Spusť frontend
cd frontend
npm run dev
```

1. Naviguj na `/create-character`
2. **Krok 1:** Zadej jméno (min 3 znaky) + vyber rasu
3. **Krok 2:** Vyber povolání (class)
4. **Krok 3:**
   - Standard Array: Přiřaď všech 6 hodnot
   - Point Buy: Nastav statistiky (27 bodů)
5. **Krok 4:** Volitelně přidej avatar URL + příběh
6. Klikni "Vytvořit postavu"
7. Redirect do game s novou postavou

### 2. Zobrazení seznamu postav
```vue
<template>
  <CharacterList />
</template>
```

### 3. Zobrazení character sheet
```vue
<template>
  <CharacterSheet :character="character" />
</template>
```

## TypeScript Usage

### Import typů
```typescript
import type {
  Character,
  CharacterRace,
  CharacterClass,
  CreateCharacterDto,
  AbilityScores
} from '@/types/character'
```

### Použití store
```typescript
import { useCharacterStore } from '@/stores/characterStore'
import { storeToRefs } from 'pinia'

const characterStore = useCharacterStore()
const { currentCharacter, loading, error } = storeToRefs(characterStore)

// Create character
await characterStore.createCharacter({
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

## Responsivita

### Breakpoints
- **Mobile:** < 640px (1 column)
- **Tablet:** 640px-1024px (2 columns)
- **Desktop:** > 1024px (3-4 columns)

### Grid layouts
- RaceSelector: 1/2/3 columns
- ClassSelector: 1/2/3/4 columns
- CharacterList: 1/2/3 columns
- Ability Scores: 2/3/6 columns

## Accessibility

- Semantic HTML (button, nav, section, article)
- Keyboard navigation (focus states)
- ARIA labels where needed
- Alt text pro avatary
- Color contrast pro text
- Focus visible indicators

## Validace

### Jméno postavy
- Min 3 znaky
- Max 50 znaků
- Required

### Rasa & Povolání
- Required výběr

### Ability Scores
- Standard Array: Všech 6 hodnot musí být přiřazeno
- Point Buy: 27 bodů, rozsah 8-15

### Background
- Volitelné
- Max 1000 znaků

## Error Handling

### API Errors
- Axios interceptor zachytává chyby
- Error messages v `characterStore.error`
- Toast-style error display
- Retry mechanismus

### Form Validation
- Real-time validace
- Error messages pod inputs
- Disabled buttons při invalid state
- Visual feedback (červené borders)

## Performance

### Optimalizace
- Lazy loading routes (už implementováno)
- V-memo pro static content (připraveno)
- Computed properties pro derived state
- Throttle/debounce na inputy (lze přidat)

### Loading States
- Skeleton screens (lze přidat)
- Loading spinners
- Disabled buttons během API callů
- Progress indicators

## Další kroky (budoucí rozšíření)

1. **Skills & Proficiencies** - Přidat skill selection
2. **Equipment** - Inventory management
3. **Spells** - Spell book pro casters
4. **Leveling** - Level up flow
5. **Character Import** - JSON import
6. **Character Export** - PDF/JSON export
7. **Multi-classing** - Support pro více tříd
8. **Custom backgrounds** - Vlastní pozadí
9. **Portraits** - Image upload místo URL
10. **Character templates** - Pre-made postavy

## Troubleshooting

### Backend není dostupný
```
Error: Network error - no response received
```
✅ Zkontroluj že backend běží na `http://localhost:3000`
✅ Zkontroluj VITE_API_URL v .env

### Pinia store není definován
```
Error: getActivePinia was called with no active Pinia
```
✅ Zkontroluj že `app.use(createPinia())` je v main.ts

### TypeScript errors
```
Error: Cannot find module '@/types/character'
```
✅ Zkontroluj tsconfig.json paths alias
✅ Restart TS server v editoru

### Tailwind classes nefungují
✅ Zkontroluj že main.css je importováno
✅ Zkontroluj tailwind.config.js content paths
✅ Restart dev server

## Závěr

Character System je plně funkční a připravený pro integraci s backendem. Všechny komponenty jsou type-safe, responsive, accessibility-friendly a dodržují dark fantasy estetiku.

**Status:** ✅ KOMPLETNÍ - Připraveno pro KROK 4 (Game Session & AI Narrator)
