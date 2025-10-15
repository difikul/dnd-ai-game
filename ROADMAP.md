# 🗺️ D&D AI Game - Development Roadmap

**Projekt:** Fullstack D&D hra s AI vypravěčem
**Start:** 2025-10-09
**Aktuální stav:** KROK 2 (99% dokončeno)
**Target MVP:** 12-15 hodin celkového vývoje

---

## 📋 Obsah

1. [Current Status](#current-status)
2. [MVP Roadmap (KROK 3-7)](#mvp-roadmap-krok-3-7)
3. [Phase 2: Intermediate Features](#phase-2-intermediate-features)
4. [Phase 3: Full Product](#phase-3-full-product)
5. [Timeline & Estimates](#timeline--estimates)
6. [Dependencies & Risks](#dependencies--risks)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Plan](#deployment-plan)

---

## 🎯 Current Status

### ✅ KROK 1: Project Setup (Dokončeno 2025-10-09)
**Čas: ~2 hodiny**

#### Vytvořeno:
- ✅ Docker Compose orchestrace (3 services: database, backend, frontend)
- ✅ PostgreSQL 16 databáze s health checks
- ✅ Backend Express + TypeScript
  - `package.json` s všemi dependencies
  - `tsconfig.json` konfigurace
  - `Dockerfile` pro development
  - `server.ts` + `app.ts` s middleware stack
  - Prisma schema s 5 modely
- ✅ Frontend Vue 3 + TypeScript + TailwindCSS
  - `package.json` s Pinia, Vue Router, Axios
  - `vite.config.ts` konfigurace
  - TailwindCSS s fantasy dark theme
  - Router s 4 views
- ✅ Hot reload pro backend (tsx watch) i frontend (Vite HMR)

#### Běžící služby:
```
✅ Database:  localhost:5432 (healthy)
✅ Backend:   localhost:3000 (running)
✅ Frontend:  localhost:5173 (running)
```

---

### ⚠️ KROK 2: Database & Backend Core (99% dokončeno)
**Čas: ~3 hodiny**
**Status: ALMOST DONE** (zbývá vyřešit Gemini API)

#### Dokončené komponenty:

##### Database Layer
- ✅ **Prisma migrations** - init migration vytvořena
- ✅ **Database schema** - 5 modelů s indexy a relacemi
  - Character (postava)
  - GameSession (herní session)
  - Message (chat historie)
  - Item (inventář)
  - WorldLocation (lokace ve světě)
- ✅ **Seed data** - testovací data:
  - Postava: Thorin Oakenshield (Dwarf Fighter, lvl 3)
  - 3 items (meč, zbroj, lektvary)
  - 2 lokace (Bree, Mirkwood)
  - Session s úvodní zprávou
  - Token: `ck_OelOmCsjKkfzi`

##### Configuration
- ✅ **config/database.ts**
  - Prisma client singleton
  - Connection pooling
  - testDatabaseConnection() funkce
  - Graceful shutdown handling

- ✅ **config/gemini.ts**
  - GoogleGenerativeAI client
  - Model config (temperature 0.9 pro kreativitu)
  - Safety settings pro D&D content
  - Retry logic s exponential backoff
  - testGeminiConnection() funkce

##### Services
- ✅ **services/geminiService.ts** - Kompletní AI služba:
  - `generateGameStart()` - Úvodní narativ
  - `generateNarratorResponse()` - Main AI narrator
  - `generateCombatResponse()` - Combat narration
  - `generateNPCDialog()` - NPC dialogy
  - `summarizeConversation()` - Shrnutí dlouhých sessions
  - `testConnection()` - API health check

##### Utilities & Types
- ✅ **utils/promptTemplates.ts** - D&D DM system prompty
  - SYSTEM_PROMPT (kompletní DM persona v češtině)
  - buildCharacterContext()
  - buildGameStartPrompt()
  - buildActionPrompt()
  - buildCombatPrompt()
  - buildSummaryPrompt()

- ✅ **types/dnd.types.ts** - D&D interfaces
  - CharacterRace, CharacterClass
  - CharacterStats, CharacterModifiers
  - DiceRoll, DiceNotation
  - Quest, QuestObjective
  - CombatInfo, Enemy
  - MessageRole, NarratorResponse

- ✅ **types/api.types.ts** - API request/response types
  - CreateCharacterRequest, UpdateCharacterRequest
  - StartGameRequest, StartGameResponse
  - PlayerActionRequest, PlayerActionResponse
  - GenerateNarratorRequest, GenerateNarratorResponse
  - TestNarratorRequest, TestNarratorResponse
  - ApiResponse, ErrorResponse

##### API Endpoints
- ✅ **controllers/testController.ts**
  - `testNarrator()` - Test Gemini s custom promptem
  - `testConnections()` - Test DB + Gemini

- ✅ **routes/test.routes.ts**
  - POST `/api/test/narrator`
  - GET `/api/test/connections`

- ✅ **app.ts** - Middleware stack:
  - CORS (configured origin)
  - Helmet (security headers)
  - Morgan (HTTP logging)
  - Compression (gzip)
  - JSON body parser
  - Error handler

#### Endpoint Test Results:
```bash
✅ GET  /health              → { status: 'ok' }
✅ GET  /api                 → { message: 'D&D AI API v1.0' }
⚠️  GET  /api/test/connections → DB: ✅ OK, Gemini: ❌ FAIL (404)
⚠️  POST /api/test/narrator    → ❌ Gemini 404 error
```

#### 🚧 Zbývající problém:
```
BLOCKER: Gemini API vrací 404 error
─────────────────────────────────────
Error: [GoogleGenerativeAI Error]: Error fetching from
       https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
       [404 Not Found] models/gemini-pro is not found for API version v1beta

Zkušené model names:
  - gemini-1.5-flash       → 404
  - gemini-pro             → 404
  - gemini-1.5-pro-latest  → 404
  - gemini-1.5-pro         → 404

Možné příčiny:
  1. Nevalidní API klíč nebo nedostatečná oprávnění
  2. Špatná verze @google/generative-ai SDK (0.21.0)
  3. Model names se změnily
  4. API endpoint changed

Status: VYŽADUJE ŘEŠENÍ před pokračováním na KROK 3
```

---

## 🚀 MVP Roadmap (KROK 3-7)

### KROK 3: Character System
**Priorita:** 🔴 HIGH
**Odhadovaný čas:** 2-3 hodiny
**Prerekvizity:** KROK 2 dokončen (Gemini opraveno)
**Status:** ⏸️ Waiting

#### Backend Tasks:
```typescript
// 3.1 Character Models & Types (30 min)
└── models/Character.ts
    - Rozšířené TypeScript interfaces
    - D&D 5e stat calculation helpers

// 3.2 Character Service (45 min)
└── services/characterService.ts
    ├── createCharacter(data: CreateCharacterRequest): Character
    ├── getCharacter(id: string): Character | null
    ├── updateCharacter(id: string, data: UpdateCharacterRequest): Character
    ├── deleteCharacter(id: string): boolean
    └── calculateStats(character: Character): CharacterModifiers
        - Stat modifiers: (stat - 10) / 2
        - Saving throws
        - Initiative bonus
        - Skill bonuses

// 3.3 Validation Schemas (20 min)
└── types/api.types.ts
    - Zod schemas pro character creation/update
    - Validation rules:
      * Stats: 3-20 range
      * Level: 1-20
      * Required fields

// 3.4 Character Controller (30 min)
└── controllers/characterController.ts
    ├── create(req, res)    → POST /api/characters
    ├── getById(req, res)   → GET /api/characters/:id
    ├── update(req, res)    → PUT /api/characters/:id
    └── delete(req, res)    → DELETE /api/characters/:id

// 3.5 Character Routes (15 min)
└── routes/character.routes.ts
    - Mount all character endpoints
    - Apply validation middleware
```

#### Frontend Tasks:
```vue
// 3.6 Character Store (45 min)
└── stores/characterStore.ts
    State:
      - currentCharacter: Character | null
      - characters: Character[]
      - loading: boolean
      - error: string | null

    Actions:
      - async createCharacter(data)
      - async loadCharacter(id)
      - async updateCharacter(id, data)
      - async deleteCharacter(id)
      - async fetchAllCharacters()

// 3.7 Character Creator Component (1.5 h)
└── components/character/CharacterCreator.vue
    Features:
      - Multi-step wizard (4 kroky)
        1. Jméno + Rasa
        2. Povolání (Class)
        3. Ability Scores (Point Buy nebo Standard Array)
        4. Background + Avatar
      - Real-time stat preview
      - Validation on each step
      - "Zpět" / "Další" / "Vytvořit" buttons

└── components/character/StatBlock.vue
    - Display 6 ability scores
    - Show modifiers (+3, -1, etc.)
    - Highlight scores

└── components/character/RaceSelector.vue
    - Grid of race cards
    - Racial bonuses preview

└── components/character/ClassSelector.vue
    - Grid of class cards
    - Hit dice, primary abilities

// 3.8 Character Sheet Component (1 h)
└── components/character/CharacterSheet.vue
    Display:
      - Name, race, class, level
      - Ability scores + modifiers
      - HP, AC, Initiative
      - Saving throws
      - Skills
      - Equipment (basic list)

    Editable:
      - Current HP (slider)
      - Notes field

// 3.9 Character Creation View (30 min)
└── views/CharacterCreationView.vue
    - Embed CharacterCreator
    - Handle form submission
    - Navigate to /game/:sessionId on success
```

#### Testing Checklist:
- [ ] Vytvořit postavu s validními stats
- [ ] Validace zabrání invalid input (STR > 20)
- [ ] Character se uloží do databáze
- [ ] CharacterSheet zobrazí správné modifikátory
- [ ] Navigation funguje (create → game)

---

### KROK 4: Game Loop & Chat UI
**Priorita:** 🔴 HIGH
**Odhadovaný čas:** 3-4 hodiny
**Prerekvizity:** KROK 3 dokončen
**Status:** ⏸️ Waiting

#### Backend Tasks:
```typescript
// 4.1 Game Service (1.5 h)
└── services/gameService.ts
    ├── startNewGame(characterId: string): GameSession
    │   - Create GameSession s unique token
    │   - Generate initial narrative (Gemini)
    │   - Save initial message
    │   - Return session + narrative
    │
    ├── processPlayerAction(sessionId, action, characterId): NarratorResponse
    │   - Save player message
    │   - Fetch last 10 messages
    │   - Build context
    │   - Call Gemini
    │   - Parse response
    │   - Save narrator message
    │   - Return response
    │
    └── getGameState(sessionId: string): GameState
        - Session + Character + Messages

// 4.2 Context Service (45 min)
└── services/contextService.ts
    ├── buildContextForAI(session, messages, character): string
    │   - Assemble context from history
    │   - Add quest log
    │   - Add world state
    │
    └── summarizeOldMessages(messages: Message[]): string
        - For sessions with 100+ messages
        - Call Gemini to summarize oldest messages
        - Keep summary + recent 10

// 4.3 Game Controller (45 min)
└── controllers/gameController.ts
    ├── startGame(req, res)         → POST /api/game/start
    ├── handleAction(req, res)      → POST /api/game/session/:id/action
    └── getGameState(req, res)      → GET /api/game/session/:id

// 4.4 Game Routes (15 min)
└── routes/game.routes.ts
    - Mount game endpoints
    - Apply rate limiting (15 req/min)
```

#### Frontend Tasks:
```vue
// 4.5 Chat Store (1 h)
└── stores/chatStore.ts
    State:
      - messages: Message[]
      - isLoading: boolean
      - isTyping: boolean
      - error: string | null

    Actions:
      - async sendMessage(content: string)
        * Add player message to UI
        * Call API
        * Add narrator response
      - clearMessages()
      - loadMessageHistory(sessionId)

// 4.6 Game Store (45 min)
└── stores/gameStore.ts
    State:
      - currentSession: GameSession | null
      - gameContext: GameContext
      - loading: boolean

    Actions:
      - async startNewGame(characterId)
      - async loadGame(sessionId)
      - updateGameState(state)

// 4.7 Game Chat Component (1.5 h)
└── components/game/GameChat.vue
    Features:
      - Message list s auto-scroll
      - Player/Narrator message bubbles (different styles)
      - Input field s Enter to send
      - Loading indicator (typing animation)
      - Timestamp na messages
      - Parse [DICE: 1d20+5] patterns

    UI/UX:
      - Scroll to bottom on new message
      - Disable input while loading
      - Show "Narrator píše..." indicator

└── components/game/MessageBubble.vue
    Props:
      - message: Message
      - role: 'player' | 'narrator' | 'system'

    Styling:
      - Player: align-right, primary color
      - Narrator: align-left, dark color
      - System: centered, italic

└── components/game/TypingIndicator.vue
    - Animated dots (...)
    - Show when isLoading = true

// 4.8 Game View (1 h)
└── views/GameView.vue
    Layout:
      ┌──────────────────────────────────┐
      │  Character Sheet │   Game Chat   │
      │   (sidebar)      │   (main area) │
      │                  │               │
      │  - Avatar        │  - Messages   │
      │  - Stats         │  - Input      │
      │  - HP/AC         │               │
      │                  │               │
      └──────────────────────────────────┘

    Responsive:
      - Desktop: 2-column grid
      - Tablet: Collapsible sidebar
      - Mobile: Stack vertically

// 4.9 API Service (30 min)
└── services/api.service.ts
    - Axios instance s baseURL
    - Request/response interceptors
    - Error handling
    - Loading state management
```

#### Testing Checklist:
- [ ] Start new game → initial narrative se zobrazí
- [ ] Poslat player action → narrator odpovídá
- [ ] Message history se načítá správně
- [ ] Loading states fungují
- [ ] Auto-scroll funguje
- [ ] Responsive layout na mobile

---

### KROK 5: Dice Rolling System
**Priorita:** 🟡 MEDIUM
**Odhadovaný čas:** 1-2 hodiny
**Prerekvizity:** KROK 4 dokončen
**Status:** ⏸️ Waiting

#### Backend Tasks:
```typescript
// 5.1 Dice Utilities (45 min)
└── utils/dice.ts
    ├── parseDiceNotation(notation: string): DiceRoll
    │   Examples:
    │     "1d20+5"  → { count: 1, sides: 20, modifier: 5 }
    │     "2d6"     → { count: 2, sides: 6, modifier: 0 }
    │     "1d8+3"   → { count: 1, sides: 8, modifier: 3 }
    │
    ├── rollDice(notation: string): DiceRoll
    │   - Parse notation
    │   - Roll each die (Math.random * sides + 1)
    │   - Sum rolls + modifier
    │   - Return { notation, rolls, modifier, total }
    │
    ├── rollWithAdvantage(notation: string): DiceRoll
    │   - Roll twice, take higher
    │
    └── rollWithDisadvantage(notation: string): DiceRoll
        - Roll twice, take lower

// 5.2 Dice Controller (30 min)
└── controllers/diceController.ts
    └── roll(req, res) → POST /api/dice/roll
        Request: { notation, advantage?, disadvantage?, type? }
        Response: { notation, rolls, modifier, total, type }

// 5.3 Dice Routes (10 min)
└── routes/dice.routes.ts
    - POST /api/dice/roll
```

#### Frontend Tasks:
```vue
// 5.4 Dice Composable (30 min)
└── composables/useDice.ts
    - rollDice(notation): DiceRoll
    - Roll history state
    - Parse notation helper

// 5.5 Dice Roller Component (1 h)
└── components/game/DiceRoller.vue
    Features:
      - Quick roll buttons (d4, d6, d8, d10, d12, d20, d100)
      - Custom notation input field
      - Modifier input (+/-)
      - Advantage/Disadvantage checkboxes
      - Roll history panel (last 10 rolls)
      - Animated result display

    UI:
      ┌─────────────────────────────────┐
      │  Quick Rolls:                   │
      │  [d4] [d6] [d8] [d10] [d12] [d20]│
      │                                  │
      │  Custom: [1d20+5] [Roll]         │
      │  ☐ Advantage  ☐ Disadvantage     │
      │                                  │
      │  Result: 🎲 18 (rolled 13 + 5)  │
      │                                  │
      │  History:                        │
      │  - 1d20+5 → 18                   │
      │  - 2d6    → 7                    │
      └─────────────────────────────────┘

// 5.6 Integration s GameChat (30 min)
└── Parse [DICE: 1d20+5] v narrator response
    - Detect dice pattern
    - Show "Roll Dice" button
    - Auto-open DiceRoller modal
    - Send result back to narrator
```

#### Testing Checklist:
- [ ] Parse "1d20+5" správně
- [ ] Roll vrací hodnoty v range (1-20 pro d20)
- [ ] Advantage/Disadvantage funguje
- [ ] Historie se ukládá
- [ ] Integration s chat funguje

---

### KROK 6: Save/Load System
**Priorita:** 🟡 MEDIUM
**Odhadovaný čas:** 2 hodiny
**Prerekvizity:** KROK 4 dokončen
**Status:** ⏸️ Waiting

#### Backend Tasks:
```typescript
// 6.1 Save Service (1 h)
└── services/saveService.ts
    ├── saveGame(sessionId: string): { sessionToken: string }
    │   - Session již má token (vytvořen při startGame)
    │   - Update lastPlayedAt
    │   - Return token for sharing
    │
    ├── loadGame(sessionToken: string): GameState
    │   - Find session by token
    │   - Include character + messages
    │   - Return full game state
    │
    └── listSaves(characterId?: string): GameSession[]
        - All sessions (or filtered by character)
        - Order by lastPlayedAt DESC

// 6.2 Save Controller (30 min)
└── controllers/saveController.ts
    ├── save(req, res)      → POST /api/saves
    ├── load(req, res)      → GET /api/saves/:token
    └── list(req, res)      → GET /api/saves
```

#### Frontend Tasks:
```vue
// 6.3 Saved Games View (1 h)
└── views/SavedGamesView.vue
    Features:
      - Grid of saved game cards
      - Each card shows:
        * Character name + avatar
        * Last played timestamp
        * Current location
        * Session token (shareable link)
      - Actions:
        * [Continue Game]
        * [Copy Link]
        * [Delete]
      - Filter by character
      - Sort by date

└── components/game/SaveGameCard.vue
    Props: { session: GameSession }
    UI:
      ┌───────────────────────────────┐
      │  🧙 Thorin Oakenshield        │
      │  Level 3 Fighter              │
      │  📍 Bree Tavern               │
      │  🕐 2h ago                     │
      │                               │
      │  [Continue] [Copy Link] [Del] │
      └───────────────────────────────┘

// 6.4 Save Game Modal (30 min)
└── components/game/SaveGameModal.vue
    - Triggered from GameView
    - Show session token
    - Copy to clipboard button
    - Share link generator
```

#### Testing Checklist:
- [ ] Save game → získám token
- [ ] Load game by token → restore stavu
- [ ] List saves zobrazí všechny sessions
- [ ] Delete funguje
- [ ] Copy link funguje

---

### KROK 7: Polish & MVP Finalization
**Priorita:** 🟢 LOW
**Odhadovaný čas:** 1-2 hodiny
**Prerekvizity:** KROK 3-6 dokončeny
**Status:** ⏸️ Waiting

#### Tasks:
```typescript
// 7.1 Error Handling (30 min)
└── Global error boundary (Vue)
└── Toast notifications (vue-toastification)
└── Fallback UI pro API failures
└── Retry buttons

// 7.2 Loading States (30 min)
└── Skeleton loaders (character sheet, messages)
└── Disabled button states
└── Progress indicators

// 7.3 UI/UX Polish (1 h)
└── Animations:
    - Fade in messages
    - Slide up modals
    - Dice roll animation
└── Transitions:
    - Route transitions
    - Hover effects
└── Responsive fixes:
    - Mobile layout
    - Tablet layout

// 7.4 Documentation (30 min)
└── Update README.md
    - Setup instructions
    - Environment variables
    - API documentation
    - Screenshots
└── API docs (OpenAPI/Swagger - optional)

// 7.5 Testing (1 h)
└── Manual test celého flow:
    1. docker-compose up
    2. Create character
    3. Start game
    4. Chat s AI
    5. Roll dice
    6. Save game
    7. Load game
    8. Verify state persistence
└── Fix critical bugs
```

#### MVP Ready Checklist:
- [ ] Docker compose spustí stack na první pokus
- [ ] Lze vytvořit postavu s validními stats
- [ ] AI vypravěč generuje konzistentní odpovědi
- [ ] Dice roller funguje pro všechny notace
- [ ] Hru lze uložit a nahrát pomocí tokenu
- [ ] Responsive design funguje na mobile
- [ ] Žádné critical bugs v konzoli
- [ ] API rate limits jsou respektovány
- [ ] README obsahuje setup guide

---

## 🌟 Phase 2: Intermediate Features

**Start:** Po dokončení MVP
**Odhadovaný čas:** 20-30 hodin
**Priorita:** Po user feedbacku z MVP

### Feature List:

#### 1. Combat System (4-5 h)
```typescript
Features:
  - Initiative tracker (roll + sort)
  - Attack/Defense rolls
  - HP tracking pro enemies
  - Combat log (separate panel)
  - Enemy AI (Gemini-driven)
  - Turn-based flow

Implementation:
  └── services/combatService.ts
      ├── startCombat(sessionId, enemies)
      ├── rollInitiative(participants)
      ├── processCombatAction(action)
      ├── checkCombatEnd()
      └── updateCombatState()

UI:
  └── components/game/CombatTracker.vue
      - Initiative order list
      - Enemy HP bars
      - Attack/Defend buttons
      - Combat log
```

#### 2. Inventory & Equipment (3-4 h)
```typescript
Features:
  - Add/Remove items
  - Equip weapons/armor
  - Item tooltips
  - Weight/capacity system
  - Drag & drop (optional)

Implementation:
  └── services/inventoryService.ts
      ├── addItem(characterId, item)
      ├── removeItem(itemId)
      ├── equipItem(itemId)
      ├── unequipItem(itemId)
      └── calculateCarryWeight()

UI:
  └── components/game/InventoryPanel.vue
      - Item grid
      - Equipment slots
      - Weight indicator
```

#### 3. Quest System (2-3 h)
```typescript
Features:
  - Quest tracking
  - Objectives checklist
  - Quest rewards
  - Multiple active quests

Implementation:
  └── Quest data v gameSession.questLog (JSON)

UI:
  └── components/game/QuestLog.vue
      - Active quests list
      - Objective checkboxes
      - Completed quests archive
```

#### 4. World Map (4-5 h)
```typescript
Features:
  - Interactive SVG/Canvas map
  - Clickable locations
  - Fog of war (revealed as explored)
  - Fast travel

Implementation:
  └── components/world/WorldMap.vue
      - SVG map rendering
      - Location markers
      - Click handlers
      - Zoom/pan
```

#### 5. Advanced Dice Roller (2 h)
```typescript
Features:
  - 3D dice animation (CSS/Three.js)
  - Roll statistics
  - Custom dice skins
  - Dice sound effects
```

#### 6. NPC System (3-4 h)
```typescript
Features:
  - Dynamic NPC generation
  - Personality-based dialogue
  - Relationship tracking
  - NPC quest givers

Implementation:
  └── services/npcService.ts
      ├── generateNPC(location)
      ├── getNPCDialogue(npcId, relationship)
      └── updateRelationship(npcId, delta)
```

#### 7. Session Sharing (2 h)
```typescript
Features:
  - Spectator mode (view-only)
  - Optional: Multiplayer party (multiple players)
  - Shareable URLs

Implementation:
  - Already have sessionToken
  - Add viewer mode to GameView
  - WebSocket for real-time spectating
```

#### 8. Animations & Sounds (3-4 h)
```typescript
Features:
  - Typewriter effect pro narrator
  - Dice roll animation
  - Sound effects (sword swing, dice roll)
  - Background ambience
  - Particle effects (criticals)

Libraries:
  - Howler.js (audio)
  - GSAP (animations)
```

---

## 🎨 Phase 3: Full Product

**Start:** Po dokončení Phase 2
**Odhadovaný čas:** 40-60 hodin
**Priorita:** Long-term roadmap

### Feature Categories:

#### AI Image Generation (5-6 h)
- Gemini Imagen integration
- Character portraits
- Location images
- Item/Enemy visuals
- Gallery

#### Advanced Character Builder (6-8 h)
- Full D&D 5e features
- Background & traits
- Spell selection
- Feats & multiclassing
- Character progression

#### Campaign System (8-10 h)
- Multi-session campaigns
- DM-created content
- Timeline tracking
- World building tools

#### Voice Integration (4-5 h)
- Speech-to-text (Web Speech API)
- Text-to-speech for narrator
- Voice commands

#### 3D Dice Physics (6-8 h)
- Three.js + Cannon.js/Rapier
- Realistic physics
- Multiple dice types
- Custom textures

#### Analytics & Achievements (4-5 h)
- Player stats tracking
- Unlockable badges
- Leaderboards
- Session analytics

#### Mobile PWA (5-6 h)
- Service Workers
- Offline mode
- Install prompt
- Push notifications

#### Admin Panel (4-5 h)
- Active sessions monitoring
- API usage dashboard
- User feedback system

---

## ⏱️ Timeline & Estimates

### MVP Timeline (KROK 3-7)

```
Week 1: KROK 3-4
├── Day 1-2: Character System (KROK 3)     [2-3h]
├── Day 3-4: Game Loop & Chat (KROK 4)     [3-4h]
└── Day 5: Testing & Fixes                 [1-2h]

Week 2: KROK 5-7
├── Day 1: Dice Rolling (KROK 5)           [1-2h]
├── Day 2: Save/Load (KROK 6)              [2h]
├── Day 3-4: Polish & Testing (KROK 7)     [2-3h]
└── Day 5: MVP Release                     [documentation]

Total MVP: 12-15 hours celkem
```

### Phase 2 Timeline

```
Month 2-3: Intermediate Features
├── Week 1: Combat System                  [4-5h]
├── Week 2: Inventory & Quests             [5-7h]
├── Week 3: World Map & NPCs               [7-9h]
├── Week 4: Animations & Polish            [4-6h]
└── Total: 20-27 hours
```

### Phase 3 Timeline

```
Month 4-6: Full Product
├── AI Images & Voice                      [9-11h]
├── Advanced Character & Campaign          [14-18h]
├── 3D Dice & Physics                      [6-8h]
├── PWA & Mobile                           [5-6h]
├── Analytics & Admin                      [8-10h]
└── Total: 42-53 hours
```

### Cumulative Timeline

```
MVP Ready:       2 weeks  (12-15h)
Phase 2 Ready:   2 months (32-42h total)
Phase 3 Ready:   6 months (74-95h total)
```

---

## ⚠️ Dependencies & Risks

### Critical Path Dependencies

```
KROK 2 (Gemini API) ─────► KROK 3 ─────► KROK 4 ─────► MVP
       ⚠️ BLOCKER           Character      Game Loop
                                              │
                                              ├─────► KROK 5 (Dice)
                                              └─────► KROK 6 (Save/Load)
```

### Risk Assessment

#### 🔴 HIGH RISK - Active Issues

**1. Gemini API 404 Error (BLOCKING)**
```
Risk: Cannot proceed to KROK 3 until resolved
Impact: Complete project halt
Likelihood: Currently happening
Mitigation:
  - Option 1: Debug API key permissions
  - Option 2: Try different SDK version
  - Option 3: Contact Google AI support
  - Option 4: Fallback to OpenAI (requires refactor)
Deadline: Must resolve before KROK 3
```

#### 🟡 MEDIUM RISK - Future Concerns

**2. Gemini Rate Limits (15 req/min)**
```
Risk: Users exceed rate limit during gameplay
Impact: Degraded UX, failed requests
Likelihood: High during testing, medium in production
Mitigation:
  - Implement request queue
  - Cache common responses
  - Show rate limit warnings to users
  - Upgrade to paid tier if needed
```

**3. WebSocket Complexity**
```
Risk: Real-time features may be complex to implement
Impact: Delayed Phase 2 timeline
Likelihood: Medium
Mitigation:
  - Start with polling (Phase 1)
  - Upgrade to WebSocket in Phase 2
  - Use Socket.io for easier implementation
```

**4. Database Performance**
```
Risk: Slow queries with large message history
Impact: Laggy chat experience
Likelihood: Low initially, medium at scale
Mitigation:
  - Already have indexes on critical fields
  - Implement pagination (load 50 messages at a time)
  - Archive old sessions
```

#### 🟢 LOW RISK

**5. Docker Development Issues**
```
Risk: Hot reload may fail, volume issues
Impact: Slower development
Likelihood: Low
Mitigation:
  - Well-tested Docker setup
  - Fallback to local development
```

**6. TypeScript Type Errors**
```
Risk: Type mismatches between frontend/backend
Impact: Build failures
Likelihood: Low (shared types)
Mitigation:
  - Shared type definitions
  - Strict TypeScript config
  - Regular type-checking
```

### Dependency Matrix

| Feature | Depends On | Risk Level |
|---------|-----------|------------|
| Character System | Gemini API fixed | 🔴 HIGH |
| Game Loop | Character System | 🟡 MEDIUM |
| Dice Rolling | Game Loop | 🟢 LOW |
| Save/Load | Game Loop | 🟢 LOW |
| Combat System | Dice Rolling | 🟡 MEDIUM |
| WebSocket | Game Loop | 🟡 MEDIUM |
| AI Images | Gemini API | 🟡 MEDIUM |

---

## 🧪 Testing Strategy

### Unit Tests (Future - Post MVP)

```typescript
// Backend unit tests (Vitest)
describe('DiceService', () => {
  it('should parse "1d20+5" correctly', () => {
    const result = parseDiceNotation('1d20+5')
    expect(result).toEqual({ count: 1, sides: 20, modifier: 5 })
  })

  it('should roll within valid range', () => {
    const result = rollDice('1d20')
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.total).toBeLessThanOrEqual(20)
  })
})

// Frontend unit tests (Vitest + Vue Test Utils)
describe('CharacterCreator', () => {
  it('validates stat ranges', async () => {
    const wrapper = mount(CharacterCreator)
    await wrapper.find('input[name="strength"]').setValue(25)
    expect(wrapper.text()).toContain('Max 20')
  })
})
```

### Integration Tests (Critical Path)

```bash
# API Integration Tests
npm run test:integration

Tests:
  ✓ POST /api/characters → creates character in DB
  ✓ POST /api/game/start → generates initial narrative
  ✓ POST /api/game/session/:id/action → AI responds
  ✓ POST /api/dice/roll → returns valid dice result
  ✓ GET /api/saves/:token → loads game state
```

### E2E Tests (Post MVP)

```typescript
// Playwright E2E tests
test('complete game flow', async ({ page }) => {
  // 1. Navigate to app
  await page.goto('http://localhost:5173')

  // 2. Create character
  await page.click('text=Nová Hra')
  await page.fill('[name="characterName"]', 'Thorin')
  await page.selectOption('[name="race"]', 'Dwarf')
  await page.selectOption('[name="class"]', 'Fighter')
  await page.click('text=Vytvořit Postavu')

  // 3. Start game
  await page.waitForSelector('.game-chat')
  expect(await page.textContent('.narrator-message')).toContain('Vcházíš')

  // 4. Send action
  await page.fill('.action-input', 'Prohledávám místnost')
  await page.press('.action-input', 'Enter')
  await page.waitForSelector('.narrator-message:last-child')

  // 5. Save game
  await page.click('text=Uložit Hru')
  const token = await page.inputValue('.session-token')
  expect(token).toMatch(/^ck_/)

  // 6. Load game
  await page.goto(`http://localhost:5173/saves/${token}`)
  await page.waitForSelector('.game-chat')
  expect(await page.locator('.message').count()).toBeGreaterThan(0)
})
```

### Manual Testing Checklist (MVP)

```markdown
KROK 3: Character System
- [ ] Create character with valid stats
- [ ] Validation prevents STR > 20
- [ ] Character appears in database
- [ ] CharacterSheet displays correctly
- [ ] Navigation works (create → game)

KROK 4: Game Loop
- [ ] Start new game generates narrative
- [ ] Player action triggers AI response
- [ ] Messages save to database
- [ ] Chat scrolls to bottom
- [ ] Loading states work

KROK 5: Dice Rolling
- [ ] Parse "1d20+5" correctly
- [ ] Rolls within range (1-20)
- [ ] Advantage/Disadvantage works
- [ ] History saves rolls
- [ ] Integration with chat works

KROK 6: Save/Load
- [ ] Save generates token
- [ ] Load restores full state
- [ ] List shows all saves
- [ ] Delete removes session
- [ ] Share link works

KROK 7: Polish
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Error messages friendly
- [ ] Loading states smooth
- [ ] All routes work
```

---

## 🚀 Deployment Plan

### Development Environment (Current)

```bash
# Local development
docker-compose up

Services:
  - Frontend: http://localhost:5173
  - Backend:  http://localhost:3000
  - Database: localhost:5432

Environment: .env (local)
```

### Staging Environment (Post MVP)

```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  backend:
    environment:
      NODE_ENV: staging
      DATABASE_URL: $STAGING_DATABASE_URL
      GEMINI_API_KEY: $STAGING_GEMINI_KEY

  frontend:
    environment:
      VITE_API_URL: https://staging-api.dnd-game.com

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.staging.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

### Production Environment (Phase 2+)

#### Option 1: VPS (DigitalOcean/Hetzner)

```bash
# Setup on Ubuntu 24.04 VPS
1. Install Docker + Docker Compose
2. Clone repository
3. Create .env.production
4. docker-compose -f docker-compose.prod.yml up -d
5. Setup Nginx reverse proxy
6. Configure SSL (Let's Encrypt)
7. Setup automatic backups (PostgreSQL)
```

#### Option 2: Cloud Platform

```yaml
Frontend Deployment:
  Platform: Vercel / Netlify
  Build: npm run build
  Output: dist/
  Domain: dnd-game.com

Backend Deployment:
  Platform: Railway / Render / Fly.io
  Build: npm run build
  Start: npm start
  Environment: .env.production

Database:
  Platform: Supabase / Railway PostgreSQL
  Backup: Daily automated backups
  Monitoring: PgAdmin / Supabase Dashboard
```

#### Production Checklist

```markdown
Pre-Production:
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates configured
- [ ] CORS origins updated
- [ ] API rate limits configured
- [ ] Error tracking setup (Sentry)
- [ ] Analytics setup (Umami/Plausible)
- [ ] Backup strategy implemented
- [ ] Monitoring setup (UptimeRobot)

Post-Production:
- [ ] Health check endpoint responding
- [ ] Database connected
- [ ] Gemini API working
- [ ] Frontend loads correctly
- [ ] Test complete user flow
- [ ] Monitor error logs
- [ ] Check performance metrics
```

### CI/CD Pipeline (Phase 3)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Run unit tests
      - Run integration tests
      - Build frontend
      - Build backend

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Deploy frontend to Vercel
      - Deploy backend to Railway
      - Run database migrations
      - Health check
      - Notify team (Discord/Slack)
```

---

## 📈 Success Metrics

### MVP Success Criteria

```markdown
Technical:
- [ ] All KROK 1-7 tasks completed
- [ ] Zero critical bugs
- [ ] <3s page load time
- [ ] 99% API uptime
- [ ] Mobile responsive

User Experience:
- [ ] Complete game session in <10 min
- [ ] AI responses in <5s
- [ ] Intuitive UI (no tutorial needed)
- [ ] Error recovery (retry on fail)

Business:
- [ ] 5+ beta testers complete full session
- [ ] Positive feedback (3.5+ stars)
- [ ] <5% error rate
- [ ] Document all features
```

### Phase 2 Success Criteria

```markdown
- [ ] Combat system fully functional
- [ ] Inventory management smooth
- [ ] World map interactive
- [ ] 50+ active users
- [ ] <2% error rate
```

### Phase 3 Success Criteria

```markdown
- [ ] AI image generation working
- [ ] Voice integration functional
- [ ] PWA installable
- [ ] 500+ active users
- [ ] Revenue model established (optional)
```

---

## 🎯 Next Immediate Actions

### Today (Priority 1 - CRITICAL)

1. **Resolve Gemini API 404 Error**
   ```bash
   Options to try:
   1. Verify API key permissions in Google AI Studio
   2. Try gemini-2.0-flash-exp model
   3. Check SDK documentation for correct model names
   4. Test with curl directly to API
   5. Contact Google AI support if all else fails
   ```

2. **Document Gemini Fix**
   - Update CLAUDE_CODE_PROMPT.md with solution
   - Update ARCHITECTURE.md if architecture changes

### This Week (Priority 2 - HIGH)

3. **Start KROK 3: Character System**
   - Backend: Character service + controller
   - Frontend: Character creator component
   - Testing: Manual flow test

4. **Continue KROK 4: Game Loop**
   - Game service implementation
   - Chat UI components
   - Integration testing

### Next Week (Priority 3 - MEDIUM)

5. **Complete MVP (KROK 5-7)**
   - Dice rolling system
   - Save/Load functionality
   - Polish & testing

6. **MVP Launch**
   - Deploy to staging
   - Beta testing with 5+ users
   - Gather feedback

---

## 📞 Support & Resources

### Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Kompletní architektura
- [CLAUDE_CODE_PROMPT.md](./CLAUDE_CODE_PROMPT.md) - Project spec
- [README.md](./README.md) - Setup guide

### External Resources
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Vue 3 Docs](https://vuejs.org/guide)
- [D&D 5e Rules](https://www.dndbeyond.com/sources/basic-rules)

### Team Communication
- Issues: GitHub Issues
- Progress: CLAUDE_CODE_PROMPT.md (Progress Tracking)
- Architecture: ARCHITECTURE.md

---

**Roadmap vytvořena:** 2025-10-14
**Poslední update:** 2025-10-14
**Status:** KROK 2 - 99% (Gemini API blocking)
**Next Milestone:** Resolve Gemini API → Start KROK 3

---

## 🏁 Conclusion

Tento roadmap poskytuje **detailní plán** pro vývoj D&D AI Game od aktuálního stavu (KROK 2) až po finální produkt.

**Key Takeaways:**
- ✅ KROK 1-2 dokončeny (kromě Gemini API)
- ⚠️ Gemini API 404 je CRITICAL BLOCKER
- 🎯 MVP je 12-15 hodin práce po vyřešení blockeru
- 🚀 Phase 2-3 přidává advanced features (60+ hodin)
- 📊 Clear milestones, dependencies, a risk assessment

**Začneme hned jak vyřešíme Gemini API! 🎲🐉⚔️**
