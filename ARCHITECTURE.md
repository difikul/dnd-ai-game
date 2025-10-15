# 🏗️ D&D AI Game - Architektura Projektu

**Verze:** 1.0
**Datum:** 2025-10-14
**Status:** KROK 2 - 99% Dokončeno

---

## 📋 Obsah

1. [System Overview](#system-overview)
2. [Tech Stack](#tech-stack)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Database Architecture](#database-architecture)
6. [API Architecture](#api-architecture)
7. [Gemini AI Integration](#gemini-ai-integration)
8. [Security Architecture](#security-architecture)
9. [Data Flow Diagrams](#data-flow-diagrams)
10. [Docker Infrastructure](#docker-infrastructure)
11. [Performance & Scalability](#performance--scalability)

---

## 🎯 System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                                │
│                   Vue 3 SPA (Port 5173)                             │
└────────────────────────┬────────────────────────────────────────────┘
                         │ HTTP/REST
                         │ (Future: WebSocket)
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND API (Port 3000)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Routes     │→ │ Controllers  │→ │   Services   │              │
│  │ (Express)    │  │ (Logic Layer)│  │ (Business)   │              │
│  └──────────────┘  └──────────────┘  └──────┬───────┘              │
│         ↑                                     │                       │
│         │                                     ↓                       │
│  ┌──────────────┐                    ┌──────────────┐               │
│  │  Middleware  │                    │   Prisma ORM │               │
│  │ - CORS       │                    │   (Client)   │               │
│  │ - Helmet     │                    └──────┬───────┘               │
│  │ - Morgan     │                           │                        │
│  │ - Rate Limit │                           │                        │
│  └──────────────┘                           │                        │
└─────────────────────────────────────────────┼────────────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────┐
                    │                                               │
                    ↓                                               ↓
        ┌───────────────────────┐                    ┌──────────────────────┐
        │  PostgreSQL 16        │                    │   Google Gemini API  │
        │  (Port 5432)          │                    │   gemini-pro         │
        │  ┌─────────────────┐  │                    │   - Narrator AI      │
        │  │ Characters      │  │                    │   - Story Gen        │
        │  │ GameSessions    │  │                    │   - NPC Dialog       │
        │  │ Messages        │  │                    │   - Combat Desc      │
        │  │ Items           │  │                    └──────────────────────┘
        │  │ WorldLocations  │  │
        │  └─────────────────┘  │
        └───────────────────────┘
```

### Container Orchestration (Docker Compose)

```
dnd-network (bridge)
├── dnd-database    (postgres:16-alpine)
│   └── Volume: postgres_data
│
├── dnd-backend     (node:20-alpine)
│   ├── Depends on: dnd-database (healthy)
│   ├── Volume: ./backend → /app
│   └── Hot reload: tsx watch
│
└── dnd-frontend    (node:20-alpine)
    ├── Depends on: dnd-backend
    ├── Volume: ./frontend → /app
    └── Hot reload: Vite HMR
```

---

## 🛠️ Tech Stack

### Backend
| Technologie | Verze | Účel |
|------------|-------|------|
| **Node.js** | 20 LTS | Runtime environment |
| **TypeScript** | 5.6.3 | Type safety, better DX |
| **Express** | 4.21.1 | HTTP server & routing |
| **Prisma** | 5.22.0 | ORM & database toolkit |
| **PostgreSQL** | 16 | Relational database |
| **Google Gemini API** | 0.21.0 | AI narrator (generative-ai SDK) |
| **Zod** | 3.23.8 | Runtime validation |
| **Helmet** | 8.0.0 | Security headers |
| **CORS** | 2.8.5 | Cross-origin handling |
| **Morgan** | 1.10.0 | HTTP request logger |
| **Express Rate Limit** | 7.4.1 | API rate limiting |
| **Compression** | 1.7.4 | Response compression |
| **nanoid** | 3.3.7 | Unique ID generation |
| **ws** | 8.18.0 | WebSocket support (future) |

### Frontend
| Technologie | Verze | Účel |
|------------|-------|------|
| **Vue 3** | 3.5.12 | Reactive UI framework |
| **TypeScript** | 5.6.3 | Type safety |
| **Vite** | 5.4.10 | Build tool & dev server |
| **Pinia** | 2.2.6 | State management |
| **Vue Router** | 4.4.5 | Client-side routing |
| **TailwindCSS** | 3.4.14 | Utility-first CSS |
| **Axios** | 1.7.7 | HTTP client |
| **VueUse** | 11.2.0 | Composition utilities |
| **Socket.io Client** | 4.8.1 | WebSocket client (future) |

### DevOps
| Technologie | Verze | Účel |
|------------|-------|------|
| **Docker** | 24+ | Containerization |
| **Docker Compose** | 3.8 | Multi-container orchestration |
| **tsx** | 4.19.2 | TypeScript execution (dev) |
| **PostgreSQL** | 16-alpine | Database image |

---

## 🔧 Backend Architecture

### Vrstvová Architektura (Layered Pattern)

```
┌─────────────────────────────────────────────────────────────┐
│                      HTTP REQUEST                            │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: MIDDLEWARE                                         │
│  ────────────────────────────────────────────────────────    │
│  1. CORS (allowed origins)                                   │
│  2. Helmet (security headers)                                │
│  3. Morgan (logging)                                         │
│  4. express.json() (body parsing)                            │
│  5. Compression (gzip)                                       │
│  6. Rate Limiting (15 req/min for AI)                        │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: ROUTING                                            │
│  ────────────────────────────────────────────────────────    │
│  - /health              → Health check                       │
│  - /api                 → API info                           │
│  - /api/test/*          → Test endpoints (testRoutes)        │
│  - /api/characters/*    → Character CRUD (TODO: KROK 3)      │
│  - /api/game/*          → Game sessions (TODO: KROK 4)       │
│  - /api/dice/*          → Dice rolling (TODO: KROK 5)        │
│  - /api/saves/*         → Save/Load (TODO: KROK 6)           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: CONTROLLERS                                        │
│  ────────────────────────────────────────────────────────    │
│  - testController.ts (✅ implemented)                        │
│    - testNarrator()       → Test Gemini AI                  │
│    - testConnections()    → Test DB + Gemini                │
│                                                              │
│  - characterController.ts (⏸️ TODO: KROK 3)                 │
│  - gameController.ts      (⏸️ TODO: KROK 4)                 │
│  - diceController.ts      (⏸️ TODO: KROK 5)                 │
│  - saveController.ts      (⏸️ TODO: KROK 6)                 │
│                                                              │
│  Zodpovědnost: Request/Response handling, validation        │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 4: SERVICES (Business Logic)                          │
│  ────────────────────────────────────────────────────────    │
│  - geminiService.ts (✅ implemented)                         │
│    - generateNarratorResponse()   → Main AI narrator        │
│    - generateGameStart()          → Initial story            │
│    - generateCombatResponse()     → Combat narration         │
│    - generateNPCDialog()          → NPC conversations        │
│    - summarizeConversation()      → Long session summary     │
│    - testConnection()             → API health check         │
│                                                              │
│  - characterService.ts (⏸️ TODO: KROK 3)                    │
│    - createCharacter()                                       │
│    - calculateStats()                                        │
│    - updateCharacter()                                       │
│                                                              │
│  - gameService.ts (⏸️ TODO: KROK 4)                         │
│    - startNewGame()                                          │
│    - processPlayerAction()                                   │
│                                                              │
│  - contextService.ts (⏸️ TODO: KROK 4)                      │
│    - buildContextForAI()                                     │
│    - summarizeOldMessages()                                  │
│                                                              │
│  Zodpovědnost: Business rules, orchestration                │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 5: DATA ACCESS (Prisma ORM)                           │
│  ────────────────────────────────────────────────────────    │
│  - prisma.character.create()                                 │
│  - prisma.gameSession.findUnique()                           │
│  - prisma.message.create()                                   │
│  - prisma.item.findMany()                                    │
│  - prisma.worldLocation.findMany()                           │
│                                                              │
│  Zodpovědnost: Database queries, transactions               │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 6: DATABASE (PostgreSQL)                              │
│  ────────────────────────────────────────────────────────    │
│  Tables: characters, game_sessions, messages,                │
│          items, world_locations                              │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns

#### 1. Singleton Pattern
```typescript
// config/database.ts
const prisma = globalForPrisma.prisma ?? new PrismaClient()
// Ensures only one Prisma instance

// config/gemini.ts
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
// Shared AI client instance
```

#### 2. Service Pattern
```typescript
// services/geminiService.ts
class GeminiService {
  async generateNarratorResponse(...) { }
  async generateGameStart(...) { }
  // Encapsulates all AI business logic
}
export const geminiService = new GeminiService()
```

#### 3. Repository Pattern (via Prisma)
```typescript
// Prisma acts as repository layer
await prisma.character.findUnique({ where: { id } })
// Clean abstraction over raw SQL
```

#### 4. Retry Pattern (Resilience)
```typescript
// config/gemini.ts
export async function withRetry<T>(fn, maxRetries = 3, delay = 1000) {
  // Exponential backoff: delay * 2^attemptNumber
}
```

### Error Handling Flow

```
Request Error Occurs
        ↓
Try-Catch in Controller
        ↓
Log Error (console.error)
        ↓
Send Structured Error Response
        ↓
{
  success: false,
  error: "User-friendly message",
  code: "ERROR_CODE",
  timestamp: "ISO date"
}
```

---

## 🎨 Frontend Architecture

### Component Hierarchy

```
App.vue (Root)
├── Router View
    ├── HomeView.vue
    │   └── UI Components
    │       ├── Button
    │       └── Card
    │
    ├── CharacterCreationView.vue (TODO: KROK 3)
    │   └── CharacterCreator.vue
    │       ├── StatBlock.vue
    │       ├── RaceSelector.vue
    │       └── ClassSelector.vue
    │
    ├── GameView.vue (TODO: KROK 4)
    │   ├── CharacterSheet.vue
    │   ├── GameChat.vue
    │   │   ├── MessageBubble.vue
    │   │   └── TypingIndicator.vue
    │   ├── DiceRoller.vue (TODO: KROK 5)
    │   └── ActionPanel.vue
    │
    └── SavedGamesView.vue (TODO: KROK 6)
        └── SaveGameCard.vue
```

### State Management (Pinia)

```typescript
┌────────────────────────────────────────────────┐
│  stores/characterStore.ts (TODO: KROK 3)       │
│  ──────────────────────────────────────────    │
│  State:                                        │
│    - currentCharacter: Character | null        │
│    - characters: Character[]                   │
│  Actions:                                      │
│    - createCharacter(data)                     │
│    - loadCharacter(id)                         │
│    - updateCharacter(id, data)                 │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  stores/gameStore.ts (TODO: KROK 4)            │
│  ──────────────────────────────────────────    │
│  State:                                        │
│    - currentSession: GameSession | null        │
│    - gameContext: GameContext                  │
│  Actions:                                      │
│    - startNewGame(characterId)                 │
│    - loadGame(sessionId)                       │
│    - updateGameState(state)                    │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  stores/chatStore.ts (TODO: KROK 4)            │
│  ──────────────────────────────────────────    │
│  State:                                        │
│    - messages: Message[]                       │
│    - isLoading: boolean                        │
│  Actions:                                      │
│    - sendMessage(content)                      │
│    - receiveNarratorResponse(response)         │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  stores/uiStore.ts (TODO: KROK 7)              │
│  ──────────────────────────────────────────    │
│  State:                                        │
│    - theme: 'dark'                             │
│    - notifications: Notification[]             │
│    - modals: { [key: string]: boolean }        │
└────────────────────────────────────────────────┘
```

### Composables (Reusable Logic)

```typescript
┌────────────────────────────────────────────────┐
│  composables/useAPI.ts (TODO: KROK 3)          │
│  ──────────────────────────────────────────    │
│  - axios instance with baseURL                 │
│  - Request/response interceptors               │
│  - Error handling                              │
│  - Loading states                              │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  composables/useDice.ts (TODO: KROK 5)         │
│  ──────────────────────────────────────────    │
│  - rollDice(notation)                          │
│  - parseNotation(notation)                     │
│  - Roll history tracking                       │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  composables/useGame.ts (TODO: KROK 4)         │
│  ──────────────────────────────────────────    │
│  - Game logic helpers                          │
│  - Character stat calculations                 │
│  - Combat helpers                              │
└────────────────────────────────────────────────┘
```

### Router Configuration

```typescript
// router/index.ts
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/create-character',
    name: 'character-creation',
    component: () => import('../views/CharacterCreationView.vue')
    // Lazy loading for code splitting
  },
  {
    path: '/game/:id',
    name: 'game',
    component: () => import('../views/GameView.vue'),
    props: true
  },
  {
    path: '/saves',
    name: 'saved-games',
    component: () => import('../views/SavedGamesView.vue')
  }
]
```

### TailwindCSS Theme

```javascript
// tailwind.config.js - Fantasy Dark Theme
colors: {
  primary: {
    500: '#f97316',  // Fantasy Orange
    700: '#c2410c',
  },
  dark: {
    900: '#0a0a0f',  // Near Black background
    800: '#1a1a2e',  // Card backgrounds
    700: '#16213e',  // Hover states
  },
  fantasy: {
    gold: '#ffd700',
    ruby: '#e0115f',
    emerald: '#50c878',
    sapphire: '#0f52ba',
  }
}
```

---

## 🗄️ Database Architecture

### Entity-Relationship Diagram

```
┌─────────────────────────────────┐
│        Character                │
├─────────────────────────────────┤
│ id: UUID (PK)                   │
│ name: String                    │
│ race: String                    │
│ class: String                   │
│ level: Integer                  │
│ strength: Integer               │
│ dexterity: Integer              │
│ constitution: Integer           │
│ intelligence: Integer           │
│ wisdom: Integer                 │
│ charisma: Integer               │
│ hitPoints: Integer              │
│ maxHitPoints: Integer           │
│ armorClass: Integer             │
│ experience: Integer             │
│ avatarUrl: String?              │
│ background: Text?               │
│ createdAt: DateTime             │
│ updatedAt: DateTime             │
└──────────┬──────────────────────┘
           │ 1
           │
           │ gameSessions (1:N)
           │
           ↓ N
┌─────────────────────────────────┐
│      GameSession                │
├─────────────────────────────────┤
│ id: UUID (PK)                   │
│ sessionToken: String (UNIQUE)   │◄───── Shareable link
│ characterId: UUID (FK)          │
│ currentLocation: String         │
│ questLog: JSON                  │
│ worldState: JSON                │
│ isActive: Boolean               │
│ lastPlayedAt: DateTime          │
│ createdAt: DateTime             │
│ updatedAt: DateTime             │
└──────────┬──────────────────────┘
           │ 1
           │
           │ messages (1:N)
           │
           ↓ N
┌─────────────────────────────────┐
│         Message                 │
├─────────────────────────────────┤
│ id: UUID (PK)                   │
│ sessionId: UUID (FK)            │
│ role: String                    │◄───── 'player' | 'narrator' | 'system'
│ content: Text                   │
│ metadata: JSON?                 │◄───── { diceRolls, combat, etc. }
│ createdAt: DateTime             │
└─────────────────────────────────┘


┌─────────────────────────────────┐
│        Character                │
└──────────┬──────────────────────┘
           │ 1
           │
           │ inventory (1:N)
           │
           ↓ N
┌─────────────────────────────────┐
│          Item                   │
├─────────────────────────────────┤
│ id: UUID (PK)                   │
│ characterId: UUID (FK)          │
│ name: String                    │
│ type: String                    │◄───── 'weapon' | 'armor' | 'potion' | 'misc'
│ description: Text?              │
│ quantity: Integer               │
│ equipped: Boolean               │
│ damage: String?                 │◄───── "1d8+2"
│ armorValue: Integer?            │
│ properties: JSON?               │
│ createdAt: DateTime             │
└─────────────────────────────────┘


┌─────────────────────────────────┐
│      WorldLocation              │
├─────────────────────────────────┤
│ id: UUID (PK)                   │
│ name: String (UNIQUE)           │
│ description: Text               │
│ type: String                    │◄───── 'town' | 'dungeon' | 'wilderness'
│ imageUrl: String?               │
│ connectedTo: JSON               │◄───── [locationId1, locationId2, ...]
│ npcs: JSON?                     │◄───── NPC data
│ encounters: JSON?               │◄───── Random encounters
│ discovered: Boolean             │
│ createdAt: DateTime             │
│ updatedAt: DateTime             │
└─────────────────────────────────┘
```

### Indexes (Performance Optimization)

```sql
-- Character indexes
CREATE INDEX idx_character_name ON characters(name);

-- GameSession indexes
CREATE INDEX idx_game_session_token ON game_sessions(session_token);
CREATE INDEX idx_game_session_character ON game_sessions(character_id);
CREATE INDEX idx_game_session_last_played ON game_sessions(last_played_at);

-- Message indexes
CREATE INDEX idx_message_session ON messages(session_id);
CREATE INDEX idx_message_created ON messages(created_at);

-- Item indexes
CREATE INDEX idx_item_character ON items(character_id);
CREATE INDEX idx_item_equipped ON items(equipped);

-- WorldLocation indexes
CREATE INDEX idx_location_name ON world_locations(name);
CREATE INDEX idx_location_type ON world_locations(type);
```

### JSON Field Structures

```typescript
// questLog: JSON in GameSession
[
  {
    id: "quest_1",
    title: "Najít ztracenou relikvii",
    description: "Místní kněz tě požádal o nalezení staré relikvie...",
    status: "active" | "completed" | "failed",
    objectives: [
      { id: "obj_1", text: "Navštiv chrám", completed: true },
      { id: "obj_2", text: "Promluvit s knězem", completed: false }
    ]
  }
]

// worldState: JSON in GameSession
{
  reputation: {
    "Bree": 50,          // Reputation in Bree (0-100)
    "Mirkwood": -20
  },
  completedEvents: ["event_dragon_slain", "event_rescued_villager"],
  gameTime: "2024-10-14T15:30:00Z",
  customFlags: {
    "dragon_defeated": true,
    "has_magic_sword": false
  }
}

// metadata: JSON in Message
{
  timestamp: "2024-10-14T15:30:00Z",
  diceRolls: [
    { notation: "1d20+5", rolls: [15], modifier: 5, total: 20, type: "attack" }
  ],
  combat: {
    inCombat: true,
    enemies: [
      { id: "goblin_1", name: "Goblin", hp: 7, maxHp: 7, ac: 15, damage: "1d6" }
    ],
    initiative: [20, 15, 12],
    currentTurn: 0
  }
}

// properties: JSON in Item
{
  rarity: "legendary",
  attunement: true,
  effects: ["fire_damage", "light_source"],
  lore: "This sword was forged in dragon fire..."
}

// npcs: JSON in WorldLocation
[
  {
    id: "npc_innkeeper",
    name: "Barlin the Innkeeper",
    personality: "friendly, talkative",
    relationship: 50,
    dialogue: {
      greeting: "Vítej v mé hospodě, dobrodruhu!",
      quests: ["quest_missing_daughter"]
    }
  }
]
```

### Cascade Delete Behavior

```prisma
// When Character is deleted:
character.delete()
  → ALL gameSessions deleted (CASCADE)
    → ALL messages deleted (CASCADE)
  → ALL items deleted (CASCADE)

// When GameSession is deleted:
gameSession.delete()
  → ALL messages deleted (CASCADE)

// When Item is deleted:
item.delete()
  → No cascade (leaf node)
```

---

## 🌐 API Architecture

### REST Endpoint Mapping

#### ✅ Implemented (KROK 2)
```
GET  /health
     Response: { status: 'ok', timestamp: ISO }

GET  /api
     Response: { message: 'D&D AI API v1.0', endpoints: [...] }

GET  /api/test/connections
     Response: {
       database: { connected: true },
       gemini: { connected: false, error: "404..." }
     }

POST /api/test/narrator
     Request:  { prompt: "Test prompt here" }
     Response: { response: "AI generated text..." }
```

#### ⏸️ TODO: KROK 3 - Character System
```
POST /api/characters
     Request:  { name, race, class, stats: {...} }
     Response: { success: true, character: {...} }
     Validation: Zod schema

GET  /api/characters/:id
     Response: { character: {...} }

PUT  /api/characters/:id
     Request:  { hitPoints: 25, experience: 1500 }
     Response: { success: true, character: {...} }

DELETE /api/characters/:id
     Response: { success: true }
```

#### ⏸️ TODO: KROK 4 - Game Sessions
```
POST /api/game/start
     Request:  { characterId: "uuid" }
     Response: {
       sessionId: "uuid",
       sessionToken: "ck_...",
       initialNarrative: "Začínáš svou cestu..."
     }

POST /api/game/session/:id/action
     Request:  {
       action: "Prohledávám místnost",
       characterId: "uuid"
     }
     Response: {
       narratorResponse: "Nacházíš starý meč...",
       requiresDiceRoll: false,
       suggestedActions: [...]
     }

GET  /api/game/session/:id
     Response: {
       session: {...},
       messages: [...],
       character: {...}
     }
```

#### ⏸️ TODO: KROK 5 - Dice Rolling
```
POST /api/dice/roll
     Request:  {
       notation: "1d20+5",
       advantage: false,
       disadvantage: false,
       type: "attack"
     }
     Response: {
       notation: "1d20+5",
       rolls: [15],
       modifier: 5,
       total: 20,
       type: "attack"
     }
```

#### ⏸️ TODO: KROK 6 - Save/Load
```
GET  /api/saves
     Query: ?characterId=uuid
     Response: { saves: [{ sessionId, sessionToken, lastPlayedAt, ... }] }

POST /api/saves
     Request:  { sessionId: "uuid" }
     Response: { success: true, sessionToken: "ck_..." }

GET  /api/saves/:token
     Response: { session: {...}, messages: [...], character: {...} }
```

### Request/Response Flow

```
1. CLIENT REQUEST
   ↓
   axios.post('/api/game/session/123/action', {
     action: "Útočím na goblina",
     characterId: "char_123"
   })

2. MIDDLEWARE PIPELINE
   ↓
   CORS → Helmet → Morgan → JSON Parser → Rate Limiter

3. ROUTE MATCHING
   ↓
   router.post('/session/:id/action', gameController.handleAction)

4. CONTROLLER (Validation)
   ↓
   const { action, characterId } = playerActionSchema.parse(req.body)

5. SERVICE (Business Logic)
   ↓
   const response = await gameService.processPlayerAction(...)

6. GEMINI AI CALL
   ↓
   const narrative = await geminiService.generateNarratorResponse(...)

7. DATABASE SAVE
   ↓
   await prisma.message.create({ data: { role: 'narrator', content: narrative } })

8. RESPONSE
   ↓
   res.json({ success: true, narratorResponse: narrative })
```

### Error Responses

```typescript
// 400 Bad Request - Validation Error
{
  success: false,
  error: "Invalid request data",
  details: {
    field: "action",
    message: "Action must be between 1-500 characters"
  }
}

// 404 Not Found
{
  success: false,
  error: "Game session not found",
  code: "SESSION_NOT_FOUND"
}

// 429 Too Many Requests
{
  success: false,
  error: "Příliš mnoho požadavků, zkuste to za chvíli.",
  retryAfter: 60
}

// 500 Internal Server Error
{
  success: false,
  error: "An unexpected error occurred",
  code: "INTERNAL_ERROR",
  timestamp: "2024-10-14T15:30:00Z"
}
```

---

## 🤖 Gemini AI Integration

### Context Management System

```typescript
┌────────────────────────────────────────────────────────────┐
│  CONVERSATION HISTORY MANAGEMENT                           │
└────────────────────────────────────────────────────────────┘

Player sends action: "Prohledávám místnost"
        ↓
1. Fetch last 10 messages from database
   ↓
   [
     { role: 'narrator', content: 'Vcházíš do temné místnosti...' },
     { role: 'player', content: 'Rozsvítím pochodeň' },
     { role: 'narrator', content: 'Vidíš starou truhlu...' },
     ...
   ]

2. Build character context
   ↓
   Character: Thorin (Dwarf Fighter, Level 3)
   HP: 28/30, AC: 16
   Current Location: Mirkwood Forest

3. Assemble prompt
   ↓
   SYSTEM_PROMPT (D&D DM persona)
   + Character context
   + Last 10 messages
   + New player action

4. Send to Gemini API
   ↓
   const result = await model.generateContent(fullPrompt)

5. Parse response
   ↓
   Check for [DICE: 1d20+X] patterns
   Extract suggested actions

6. Save to database
   ↓
   await prisma.message.create({
     role: 'narrator',
     content: response,
     metadata: { diceRolls, timestamp }
   })
```

### Prompt Template Flow

```typescript
// utils/promptTemplates.ts

SYSTEM_PROMPT (Czech D&D DM persona)
        ↓
buildCharacterContext(character)
        ↓
"Jméno: Thorin
 Rasa: Dwarf
 Povolání: Fighter
 Level: 3
 HP: 28/30
 AC: 16"
        ↓
buildGameStartPrompt(character, location)
        ↓
"Začínáš svou dobrodružnou cestu v [location].
 Popis prostředí..."
        ↓
buildActionPrompt(action, character, history)
        ↓
"Hráč dělá: [action]
 Historie konverzace: [...]
 Reaguj jako DM..."
        ↓
buildCombatPrompt(action, combat, character)
        ↓
"COMBAT MODE
 Nepřátelé: [enemies]
 Initiative: [...]
 Hráč: [action]"
```

### Retry Mechanism (Exponential Backoff)

```typescript
// config/gemini.ts - withRetry()

Attempt 1: Call Gemini API
    ↓ FAIL (rate limit)
    Wait: 1000ms * 2^0 = 1000ms (1 second)
    ↓
Attempt 2: Call Gemini API
    ↓ FAIL (timeout)
    Wait: 1000ms * 2^1 = 2000ms (2 seconds)
    ↓
Attempt 3: Call Gemini API
    ↓ SUCCESS
    Return response

If all 3 attempts fail → Throw error to controller
```

### Message Parsing

```typescript
// Parse narrator response for special patterns

Response: "Házíš si na útok. [DICE: 1d20+5] Pokud uspěješ, útočíš mečem [DICE: 1d8+3]"
        ↓
Regex: /\[DICE:\s*([^\]]+)\]/g
        ↓
Matches: ["[DICE: 1d20+5]", "[DICE: 1d8+3]"]
        ↓
Extracted:
{
  requiresDiceRoll: true,
  diceRolls: ["1d20+5", "1d8+3"]
}
```

### Rate Limiting Strategy

```typescript
// 15 requests per minute (Gemini free tier)

Express Rate Limit middleware:
  windowMs: 60 * 1000,  // 1 minute window
  max: 15,              // 15 requests max
  message: "Příliš mnoho požadavků"

Applied to: /api/game/*, /api/test/narrator
```

---

## 🔒 Security Architecture

### 1. API Key Management

```bash
# ✅ CORRECT - Backend only
.env (not committed)
GEMINI_API_KEY=AIzaSy...

Backend reads: process.env.GEMINI_API_KEY
Frontend NEVER sees this key

# ❌ WRONG - Never do this
Frontend environment: VITE_GEMINI_API_KEY=...
```

### 2. CORS Configuration

```typescript
// app.ts
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}))

// Prevents unauthorized domains from calling API
```

### 3. Helmet (Security Headers)

```typescript
app.use(helmet())

// Adds headers:
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - Strict-Transport-Security
// - Content-Security-Policy
```

### 4. Input Validation (Zod)

```typescript
// types/api.types.ts
export const playerActionSchema = z.object({
  sessionId: z.string().uuid(),
  action: z.string().min(1).max(500),
  characterId: z.string().uuid()
})

// Controller
const data = playerActionSchema.parse(req.body)
// Throws if invalid → 400 Bad Request
```

### 5. SQL Injection Protection

```typescript
// ✅ Prisma prevents SQL injection automatically
await prisma.character.findUnique({
  where: { id: userInput }
})
// Prisma sanitizes all inputs

// ❌ Raw SQL would be vulnerable
// db.query(`SELECT * FROM characters WHERE id = '${userInput}'`)
```

### 6. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

const narratorRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Příliš mnoho požadavků, zkuste to za chvíli.'
})

router.post('/narrator/generate', narratorRateLimiter, narratorController.generate)
```

### 7. Environment Variables

```bash
# .env (gitignored)
DB_USER=dnd_user
DB_PASSWORD=SecureDnD2024!Pass
DB_NAME=dnd_game
GEMINI_API_KEY=AIzaSy...
NODE_ENV=development

# .env.example (committed)
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
# ... (no real secrets)
```

---

## 📊 Data Flow Diagrams

### 1. Character Creation Flow

```
User opens /create-character
        ↓
CharacterCreationView.vue renders
        ↓
User fills form:
  - Name: "Thorin"
  - Race: "Dwarf"
  - Class: "Fighter"
  - Stats: STR 16, DEX 12, CON 15, INT 10, WIS 13, CHA 8
        ↓
User clicks "Vytvořit postavu"
        ↓
characterStore.createCharacter(data)
        ↓
POST /api/characters
  Request: { name, race, class, strength, dexterity, ... }
        ↓
characterController.create()
        ↓
Validate with Zod schema
        ↓
characterService.createCharacter()
        ↓
Calculate modifiers:
  STR modifier = (16 - 10) / 2 = +3
  Calculate HP = 10 + CON modifier * level
  Calculate AC = 10 + DEX modifier + armor bonus
        ↓
prisma.character.create({ data: {...} })
        ↓
Response: { success: true, character: {...} }
        ↓
Frontend: router.push('/') or router.push(`/game/${sessionId}`)
```

### 2. Game Session Flow

```
User clicks "Nová Hra" with characterId
        ↓
gameStore.startNewGame(characterId)
        ↓
POST /api/game/start
        ↓
gameService.startNewGame(characterId)
        ↓
1. Create GameSession:
   prisma.gameSession.create({
     characterId,
     sessionToken: nanoid(),
     currentLocation: 'Bree',
     questLog: [],
     worldState: {}
   })
        ↓
2. Generate initial narrative:
   geminiService.generateGameStart(character, 'Bree')
        ↓
3. Save initial message:
   prisma.message.create({
     sessionId,
     role: 'narrator',
     content: "Vcházíš do města Bree..."
   })
        ↓
Response: { sessionId, sessionToken, initialNarrative }
        ↓
Frontend: router.push(`/game/${sessionId}`)
        ↓
GameView.vue renders with ChatStore
```

### 3. Player Action → AI Response Flow

```
User types: "Prohledávám místnost"
        ↓
User presses Enter
        ↓
chatStore.sendMessage("Prohledávám místnost")
        ↓
1. Add player message to UI immediately
   messages.push({ role: 'player', content: action })
        ↓
2. Set loading state
   isLoading = true
        ↓
3. Send to backend
   POST /api/game/session/:id/action
   { action: "Prohledávám místnost", characterId }
        ↓
gameController.handleAction()
        ↓
4. Save player message to DB
   prisma.message.create({ role: 'player', content: action })
        ↓
5. Fetch conversation history
   const messages = await prisma.message.findMany({
     where: { sessionId },
     orderBy: { createdAt: 'desc' },
     take: 10
   })
        ↓
6. Build context for AI
   const context = contextService.buildContextForAI(session, messages)
        ↓
7. Call Gemini API with retry
   const response = await geminiService.generateNarratorResponse(
     action,
     character,
     messages,
     context
   )
        ↓
   Gemini API processes:
   - System prompt (DM persona)
   - Character info
   - Last 10 messages
   - New action
        ↓
   Returns: "Prohledáváš místnost a nacházíš starý meč..."
        ↓
8. Parse response for dice rolls
   if (response.includes('[DICE:')) {
     // Extract dice notation
   }
        ↓
9. Save narrator response to DB
   prisma.message.create({
     role: 'narrator',
     content: response,
     metadata: { diceRolls: [...] }
   })
        ↓
10. Send response to frontend
    Response: {
      narratorResponse: "...",
      requiresDiceRoll: false,
      suggestedActions: [...]
    }
        ↓
11. Frontend updates UI
    chatStore.receiveNarratorResponse(response)
    isLoading = false
        ↓
User sees narrator response with typewriter effect
```

### 4. Save/Load Game Flow

```
SAVE FLOW:
User clicks "Uložit hru"
        ↓
gameStore.saveGame()
        ↓
POST /api/saves { sessionId }
        ↓
saveService.saveGame(sessionId)
        ↓
Session already has sessionToken (created at game start)
        ↓
Update lastPlayedAt:
  prisma.gameSession.update({
    where: { id: sessionId },
    data: { lastPlayedAt: new Date() }
  })
        ↓
Response: { success: true, sessionToken: "ck_..." }
        ↓
Frontend: Show modal with shareable link
  "Tvoje hra: localhost:3000/saves/ck_OelOmCsjKkfzi"


LOAD FLOW:
User opens /saves/ck_OelOmCsjKkfzi
        ↓
gameStore.loadGame('ck_OelOmCsjKkfzi')
        ↓
GET /api/saves/ck_OelOmCsjKkfzi
        ↓
saveService.loadGame(token)
        ↓
prisma.gameSession.findUnique({
  where: { sessionToken: token },
  include: {
    character: true,
    messages: {
      orderBy: { createdAt: 'asc' }
    }
  }
})
        ↓
Response: {
  session: {...},
  messages: [...],
  character: {...}
}
        ↓
Frontend: Restore state
  gameStore.currentSession = session
  chatStore.messages = messages
  characterStore.currentCharacter = character
        ↓
router.push(`/game/${session.id}`)
```

---

## 🐳 Docker Infrastructure

### Container Communication

```
┌──────────────────────────────────────────────────────────────┐
│  dnd-network (bridge)                                        │
│                                                              │
│  ┌────────────────┐   ┌────────────────┐   ┌─────────────┐ │
│  │  dnd-frontend  │   │  dnd-backend   │   │ dnd-database│ │
│  │  :5173         │   │  :3000         │   │ :5432       │ │
│  └────────┬───────┘   └────────┬───────┘   └──────┬──────┘ │
│           │                     │                  │         │
│           │  HTTP requests      │  SQL queries     │         │
│           │─────────────────────▶                  │         │
│           │                     │──────────────────▶         │
│           │                     │                  │         │
└───────────┼─────────────────────┼──────────────────┼─────────┘
            │                     │                  │
            │                     │                  │
   Exposed to host:        Exposed to host:  Exposed to host:
   localhost:5173          localhost:3000    localhost:5432
```

### Volume Mounts (Hot Reload)

```yaml
backend:
  volumes:
    - ./backend:/app         # Source code → container
    - /app/node_modules      # Anonymous volume (preserves npm install)
  command: npm run dev       # tsx watch src/server.ts

# When you edit backend/src/server.ts:
#   1. Host filesystem changes
#   2. Docker bind mount syncs
#   3. tsx watch detects change
#   4. Server auto-restarts
```

### Health Checks

```yaml
database:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
    interval: 10s
    timeout: 5s
    retries: 5

backend:
  depends_on:
    database:
      condition: service_healthy
# Backend waits until database is healthy before starting
```

### Environment Variables

```yaml
backend:
  environment:
    NODE_ENV: ${NODE_ENV:-development}
    PORT: 3000
    DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@database:5432/${DB_NAME}
    GEMINI_API_KEY: ${GEMINI_API_KEY}
    CORS_ORIGIN: http://localhost:5173

# Variables injected from .env file at runtime
```

### Build Process

```dockerfile
# Backend Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Development: tsx watch (no build step)
# Production: npm run build → node dist/server.js
```

---

## ⚡ Performance & Scalability

### Frontend Optimizations

```typescript
// 1. Lazy Loading Routes
const routes = [
  {
    path: '/game/:id',
    component: () => import('./views/GameView.vue')
    // Code splitting → smaller initial bundle
  }
]

// 2. Debounce Player Input
import { useDebounceFn } from '@vueuse/core'

const sendAction = useDebounceFn((action: string) => {
  gameStore.sendPlayerAction(action)
}, 300)  // Wait 300ms after user stops typing

// 3. Memoized Computed Properties
const characterModifiers = computed(() => {
  return calculateModifiers(character.value)
  // Only recalculates when character changes
})

// 4. Virtual Scrolling (future)
// For long message history (1000+ messages)
import { useVirtualList } from '@vueuse/core'
```

### Backend Optimizations

```typescript
// 1. Database Indexes (already configured)
@@index([sessionToken])
@@index([characterId])
// Fast lookups for common queries

// 2. Connection Pooling (Prisma built-in)
// Reuses database connections instead of creating new ones

// 3. Response Compression
import compression from 'compression'
app.use(compression())
// Gzip response bodies → faster transfer

// 4. Caching (future enhancement)
import NodeCache from 'node-cache'
const cache = new NodeCache({ stdTTL: 300 })

// Cache character data for 5 minutes
const character = cache.get(`character_${id}`) || await fetchCharacter(id)
```

### Scalability Strategy

```
Current (MVP):
  1 Database container
  1 Backend container
  1 Frontend container
  ↓
  Handles: ~100 concurrent users

Phase 2:
  1 Database (upgraded specs)
  2-3 Backend replicas (load balanced)
  CDN for frontend static assets
  ↓
  Handles: ~1000 concurrent users

Phase 3:
  PostgreSQL with read replicas
  Horizontal backend scaling (Kubernetes)
  Redis cache layer
  WebSocket server cluster
  ↓
  Handles: ~10,000+ concurrent users
```

### Gemini API Quota Management

```typescript
// Free tier: 15 requests per minute

// Rate limiting middleware
const narratorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15
})

// Future: Implement queue system
class GeminiQueue {
  private queue: Request[] = []
  private processing = false

  async enqueue(request: Request) {
    this.queue.push(request)
    if (!this.processing) {
      this.processQueue()
    }
  }

  private async processQueue() {
    // Process max 15 requests per minute
    // Distribute evenly: 1 request every 4 seconds
  }
}
```

---

## 🔮 Future Enhancements

### WebSocket Integration Points

```typescript
// Real-time features (Phase 2+)

// Backend: websocket/gameSocket.ts
io.on('connection', (socket) => {
  socket.on('join_game', (sessionId) => {
    socket.join(sessionId)
  })

  socket.on('player_action', async (action) => {
    // Process action
    const response = await geminiService.generateResponse(action)

    // Broadcast to all in game session
    io.to(sessionId).emit('narrator_response', response)
  })
})

// Frontend: composables/useWebSocket.ts
const socket = io('ws://localhost:3000')

socket.on('narrator_response', (response) => {
  chatStore.addMessage({
    role: 'narrator',
    content: response
  })
})
```

### Combat System Architecture

```typescript
// Phase 2 feature

interface CombatState {
  active: boolean
  participants: Combatant[]
  initiative: number[]
  currentTurn: number
  round: number
}

class CombatService {
  async startCombat(sessionId: string, enemies: Enemy[]) {
    // Roll initiative for all participants
    // Sort by initiative
    // Save combat state in gameSession.worldState
  }

  async processCombatAction(action: CombatAction) {
    // Resolve attack/defense
    // Update HP
    // Check for defeat
    // Advance turn
  }
}
```

---

## 📚 File Structure Reference

### Backend Files (Current State)

```
backend/
├── src/
│   ├── server.ts              ✅ Entry point
│   ├── app.ts                 ✅ Express app setup
│   ├── config/
│   │   ├── database.ts        ✅ Prisma client
│   │   └── gemini.ts          ✅ Gemini AI client
│   ├── controllers/
│   │   └── testController.ts ✅ Test endpoints
│   ├── services/
│   │   └── geminiService.ts   ✅ AI narrator service
│   ├── routes/
│   │   └── test.routes.ts     ✅ Test routes
│   ├── types/
│   │   ├── dnd.types.ts       ✅ D&D interfaces
│   │   └── api.types.ts       ✅ API types
│   └── utils/
│       └── promptTemplates.ts ✅ AI prompts
├── prisma/
│   ├── schema.prisma          ✅ Database schema
│   └── seed.ts                ✅ Test data
├── package.json               ✅
├── tsconfig.json              ✅
└── Dockerfile                 ✅
```

### Frontend Files (Current State)

```
frontend/
├── src/
│   ├── main.ts                ✅ Vue app entry
│   ├── App.vue                ✅ Root component
│   ├── router/
│   │   └── index.ts           ✅ Vue Router
│   └── views/
│       ├── HomeView.vue       ✅ Landing page
│       ├── CharacterCreationView.vue ⏸️ TODO
│       ├── GameView.vue       ⏸️ TODO
│       └── SavedGamesView.vue ⏸️ TODO
├── package.json               ✅
├── vite.config.ts             ✅
├── tailwind.config.js         ✅
└── Dockerfile                 ✅
```

---

## 🎓 Design Decisions & Rationale

### Why Prisma over raw SQL?
- Type-safe database queries
- Automatic migrations
- Built-in connection pooling
- Clean API with relations

### Why Pinia over Vuex?
- Better TypeScript support
- Simpler API (no mutations)
- Modular store design
- Official Vue 3 recommendation

### Why TailwindCSS?
- Utility-first → fast prototyping
- No CSS conflicts
- Consistent design system
- Small production bundle (purged)

### Why Docker Compose?
- Consistent dev environment
- Easy onboarding (one command: `docker-compose up`)
- Production-like setup
- Service isolation

### Why Google Gemini over OpenAI?
- Free tier (15 req/min)
- Good creative storytelling
- Multimodal capabilities (future: images)
- Czech language support

---

## 📝 Notes

- **Current Blocker:** Gemini API returning 404 for all model names (`gemini-pro`, `gemini-1.5-flash`, etc.)
- **Database Status:** ✅ Healthy, migrations run, seed data loaded
- **Backend Status:** ✅ Running, all services implemented
- **Frontend Status:** ✅ Running, basic structure ready

**Next Steps:** Resolve Gemini API issue → Continue with KROK 3 (Character System)

---

**Dokument vytvořen:** 2025-10-14
**Poslední update:** 2025-10-14
**Autor:** Claude Code + Scoreone
