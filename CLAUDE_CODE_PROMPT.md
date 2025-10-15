# Claude Code: Fullstack D&D Hra s AI Vypravěčem (Vue 3 + TypeScript + Docker)

## 🎯 Project Overview

**Vytvoř profesionální fullstack webovou aplikaci** pro Dungeons & Dragons s AI vypravěčem:

**Tech Stack:**
- **Frontend**: Vue 3 (Composition API) + TypeScript + Pinia + TailwindCSS + Vite
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL
- **AI**: Google Gemini API (free tier)
- **Deployment**: Docker + Docker Compose
- **Build Strategy**: MVP → Intermediate → Full Product (3 fáze)

---

## 📊 Progress Tracking

### Stav implementace: KROK 3 DOKONČEN ✅ → Připraven KROK 4 🚀

#### ✅ KROK 1: Project Setup (dokončeno 2025-10-09)
**Status:** COMPLETED ✅

**Vytvořeno:**
- ✅ Docker Compose orchestrace (database, backend, frontend)
- ✅ PostgreSQL 16 databáze (healthy)
- ✅ Backend Express server (Node.js 20, TypeScript)
  - package.json s všemi dependencies
  - tsconfig.json konfigurace
  - Dockerfile pro development
  - server.ts + app.ts s middleware (cors, helmet, morgan, compression)
  - Prisma schema s modely (Character, GameSession, Message, Item, WorldLocation)
- ✅ Frontend Vue 3 aplikace (TypeScript, Vite)
  - package.json s Pinia, Vue Router, TailwindCSS
  - vite.config.ts + tsconfig.json
  - TailwindCSS s fantasy dark theme
  - Dockerfile pro development
  - Router s 4 views (Home, CharacterCreation, Game, SavedGames)
- ✅ API endpoints: GET /health ✓, GET /api ✓
- ✅ Všechny kontejnery běží a jsou dostupné

**Běžící služby:**
- Database: localhost:5432 (healthy)
- Backend: localhost:3000 (running)
- Frontend: localhost:5173 (running)

---

#### ✅ KROK 2: Database & Backend Core (dokončeno 2025-10-14)
**Status:** COMPLETED ✅

**Dokončeno:**
- ✅ Prisma migrations (init migration) - databáze vytvořena
- ✅ Prisma seed.ts s testovacími daty
  - Testovací postava: Thorin Oakenshield (Fighter, level 3)
  - 3 items (meč, zbroj, lektvary)
  - 2 lokace (Bree, Mirkwood)
  - Herní session s úvodní zprávou (token: ck_OelOmCsjKkfzi)
- ✅ config/database.ts - Prisma client singleton
- ✅ config/gemini.ts - Gemini API client s retry logikou
  - Model: **gemini-2.5-flash** (stable, June 2025)
  - Temperature: 0.9 pro kreativní storytelling
  - Exponential backoff retry logic
- ✅ services/geminiService.ts - kompletní AI služba
  - generateGameStart()
  - generateNarratorResponse()
  - generateCombatResponse()
  - testConnection()
  - summarizeConversation()
  - generateNPCDialog()
- ✅ utils/promptTemplates.ts - D&D DM system prompty v češtině
- ✅ types/dnd.types.ts - D&D interfaces (Character, Quest, Combat, etc.)
- ✅ types/api.types.ts - API request/response types
- ✅ controllers/testController.ts - test endpoints
- ✅ routes/test.routes.ts - test routes
- ✅ POST /api/test/narrator endpoint ✓
- ✅ GET /api/test/connections endpoint ✓

**Vyřešené problémy:**
- ✅ **Gemini API 404 error** - Vyřešeno!
  - Původní problém: `gemini-pro` a `gemini-1.5-flash` jsou deprecated
  - Řešení: Upgrade na `gemini-2.5-flash` (aktuální stable verze)
  - Metoda: Použit REST API list models endpoint k zjištění dostupných modelů
  - 50 dostupných modelů nalezeno, vybrán `gemini-2.5-flash`

**Endpoint testy:**
- GET /health - ✅ OK
- GET /api - ✅ OK
- GET /api/test/connections - ✅ DB OK, Gemini OK (gemini-2.5-flash)
- POST /api/test/narrator - ✅ Gemini generuje české fantasy příběhy

**Gemini API Test Response:**
```json
{
  "success": true,
  "model": "gemini-2.5-flash",
  "response": "Starobylý les šeptal o zapomenutém meči, který kdysi porazil temného čaroděje..."
}

---

#### ✅ KROK 3: Character System (dokončeno 2025-10-14)
**Status:** COMPLETED ✅
**Čas:** ~3 hodiny (implementace pomocí paralelních specialized agents)

**Backend (dnd-backend-architect agent):**
- ✅ `services/characterService.ts` - Kompletní Character service
  - createCharacter() s automatickým výpočtem HP a AC
  - getCharacter(), getAllCharacters()
  - updateCharacter() s přepočítáním stats
  - deleteCharacter()
  - modifyHP() - damage/healing s limity
  - addExperience() - XP systém
  - D&D 5e Hit Dice pro všechny třídy (d4-d12)
  - Modifikátory podle vzorce (stat - 10) / 2
- ✅ `controllers/characterController.ts` - REST API handlers
- ✅ `routes/character.routes.ts` - Express routes
- ✅ `middleware/validation.middleware.ts` - Zod validation middleware
- ✅ `types/api.types.ts` - Aktualizován s Zod schemas
  - createCharacterSchema
  - updateCharacterSchema
- ✅ `app.ts` - Mounted character routes na `/api/characters`

**Frontend (vue3-dnd-frontend agent):**
- ✅ `stores/characterStore.ts` - Pinia store
  - State: currentCharacter, characters[], loading, error
  - Actions: createCharacter, loadCharacter, updateCharacter, deleteCharacter
- ✅ `types/character.ts` - TypeScript interfaces
  - Character, CharacterRace, CharacterClass
- ✅ `constants/races.ts` - Data pro 9 ras
- ✅ `constants/classes.ts` - Data pro 12 tříd
- ✅ `utils/dndCalculations.ts` - D&D mechaniky
- ✅ `services/api.service.ts` - Axios instance
- ✅ `services/character.service.ts` - Character API calls
- ✅ **6 Vue komponent:**
  - `CharacterCreator.vue` - 4-step wizard (race → class → stats → background)
  - `CharacterSheet.vue` - Display character s všemi stats
  - `StatBlock.vue` - Zobrazení ability score s modifierem
  - `RaceSelector.vue` - Grid 9 ras s racial bonuses
  - `ClassSelector.vue` - Grid 12 tříd s hit dice
  - `CharacterList.vue` - Seznam postav
- ✅ `views/CharacterCreationView.vue` - Character creation flow
- ✅ `.env.example` - Environment variables template

**API Endpoints vytvořeno (7):**
- POST `/api/characters` - Vytvoření postavy
- GET `/api/characters` - Seznam všech postav
- GET `/api/characters/:id` - Detail postavy
- PUT `/api/characters/:id` - Update postavy
- DELETE `/api/characters/:id` - Smazání postavy
- POST `/api/characters/:id/hp` - Úprava HP (damage/healing)
- POST `/api/characters/:id/experience` - Přidání XP

**Features:**
- ✅ D&D 5e mechaniky (9 ras, 12 tříd, ability scores)
- ✅ Multi-step creation wizard s validací
- ✅ Standard Array a Point Buy metody
- ✅ Real-time preview HP a AC
- ✅ Dark fantasy theme (TailwindCSS)
- ✅ TypeScript strict mode (žádné errory)
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Loading states a error handling
- ✅ Zod validace na všech vstupech

**Dokumentace vytvořena:**
- CHARACTER_SYSTEM_DOCS.md - Technická dokumentace
- IMPLEMENTATION_SUMMARY.md - Implementační souhrn
- UI_FLOW.md - UI flow diagramy
- PROJECT_STRUCTURE.md - Struktura projektu

---

#### 🚀 KROK 4-7: Připraveno k implementaci

**KROK 4:** Game Loop & Chat UI (3-4 h) - Připraven k zahájení
**KROK 5:** Dice Rolling System (1-2 h) - Čeká na KROK 4
**KROK 6:** Save/Load System (2 h) - Čeká na KROK 4
**KROK 7:** Polish & MVP Finalization (1-2 h) - Čeká na KROK 5-6

**Status:** Character System ✅ API připraveno ✅ Frontend ready ✅

**Next Step:** → Zahájit KROK 4 (Game Loop & Chat UI implementation)

---

## 🚀 DevOps & Git Flow

### GitHub Repository
- **URL**: https://github.com/difikul/dnd-ai-game
- **Visibility**: Public
- **Owner**: difikul

### Git Flow Strategie

**Branch Model:**
```
main (v1.0.0) ───────────────┬─────────> (v1.1.0)
                             │
                      hotfix/critical-bug
                             │
develop ──┬────────┬─────────┴──────────>
          │        │
    feature/A  feature/B
```

**Branches:**
| Branch | Purpose | Protected | Lifetime |
|--------|---------|-----------|----------|
| `main` | Production-ready code, tagged releases | Yes | Permanent |
| `develop` | Integration branch pro development | Yes | Permanent |
| `feature/*` | Vývoj nových funkcí | No | Temporary |
| `hotfix/*` | Kritické opravy v produkci | No | Temporary |
| `release/*` | Příprava release verze | No | Temporary |

**Branch Naming Conventions:**
- Features: `feature/KROK-X-nazev`, `feature/issue-123`, `feature/add-combat-system`
- Hotfixes: `hotfix/critical-security-fix`, `hotfix/api-crash`
- Releases: `release/v1.0.0`, `release/v1.1.0`

### Commit Message Guidelines

**Conventional Commits Format:**
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
- `feat`: Nová funkce
- `fix`: Oprava bugu
- `docs`: Dokumentace
- `style`: Formátování (no logic change)
- `refactor`: Refactoring kódu
- `test`: Přidání testů
- `chore`: Maintenance, dependencies
- `ci`: CI/CD změny

**Scopes:** `(backend)`, `(frontend)`, `(docker)`, `(ci)`, `(docs)`, `(db)`

**Examples:**
```bash
feat(backend): implement race selection endpoint with validation
fix(frontend): correct character stats calculation in UI
docs: add Docker setup instructions to README
ci: enable PostgreSQL service in backend workflow
```

### CI/CD Pipeline

**GitHub Actions Workflows:**

1. **Backend CI** (`ci-backend.yml`) - TypeScript type check, ESLint, build, Prisma validation
2. **Frontend CI** (`ci-frontend.yml`) - Vue-tsc type check, ESLint, Vite build
3. **Docker CI** (`ci-docker.yml`) - Docker Compose build, Trivy security scan
4. **CD Deploy** (`cd-deploy.yml`) - Production deployment (triggered by v*.*.* tags)

**Required Status Checks:**
- Pro merge do `main`: ci-backend ✅, ci-frontend ✅, ci-docker ✅
- Pro merge do `develop`: ci-backend ✅, ci-frontend ✅

**GitHub Secrets Needed:**
- `GEMINI_API_KEY` - Pro Docker CI health checks (optional)
- `DOCKER_USERNAME` - Docker Hub login (pro CD)
- `DOCKER_PASSWORD` - Docker Hub token (pro CD)
- `VPS_SSH_KEY` - SSH private key (optional, pro VPS deployment)

### Pull Request Process

**PR Template:** `.github/PULL_REQUEST_TEMPLATE.md`
- Description & Type of Change checklist
- Related Issues (Closes #123)
- Testing Checklist (lokální, Docker, testy, CI)
- Code Quality Checklist

**Merge Strategies:**
| Source | Target | Strategy | Reasoning |
|--------|--------|----------|-----------|
| `feature/*` | `develop` | Squash Merge | Čistá historie, 1 commit = 1 feature |
| `release/*` | `main` | Merge Commit | Zachování release historie |
| `hotfix/*` | `main` | Merge Commit | Trackovatelnost hotfixů |

### GitHub Templates & Documentation

- **PR Template**: `.github/PULL_REQUEST_TEMPLATE.md`
- **Bug Report**: `.github/ISSUE_TEMPLATE/bug_report.md`
- **Feature Request**: `.github/ISSUE_TEMPLATE/feature_request.md`
- **Dependabot**: `.github/dependabot.yml` (weekly monday 9:00)
- **Contributing Guide**: `CONTRIBUTING.md` (14KB)
- **DevOps Guide**: `DEVOPS.md` (33KB kompletní DevOps dokumentace)

### Development Workflow Example

**Typický feature development flow:**
```bash
# 1. Sync s develop
git checkout develop
git pull origin develop

# 2. Vytvoř feature branch
git checkout -b feature/KROK-4-game-loop

# 3. Vývoj, commit, push
git add .
git commit -m "feat(backend): implement game loop service"
git push -u origin feature/KROK-4-game-loop

# 4. Vytvoř PR
gh pr create --base develop --title "feat: Implement game loop with chat UI"

# 5. Po merge: Cleanup
git checkout develop
git pull origin develop
git branch -d feature/KROK-4-game-loop
```

---

## 📁 Project Structure

```
dnd-ai-game/
├── docker-compose.yml
├── .env.example
├── README.md
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.ts
│       ├── App.vue
│       ├── assets/
│       ├── components/
│       │   ├── character/
│       │   │   ├── CharacterCreator.vue
│       │   │   ├── CharacterSheet.vue
│       │   │   └── StatBlock.vue
│       │   ├── game/
│       │   │   ├── GameChat.vue
│       │   │   ├── DiceRoller.vue
│       │   │   ├── CombatTracker.vue
│       │   │   └── InventoryPanel.vue
│       │   ├── ui/
│       │   │   ├── Button.vue
│       │   │   ├── Card.vue
│       │   │   ├── Modal.vue
│       │   │   └── LoadingSpinner.vue
│       │   └── world/
│       │       ├── WorldMap.vue
│       │       └── LocationCard.vue
│       ├── views/
│       │   ├── HomeView.vue
│       │   ├── CharacterCreationView.vue
│       │   ├── GameView.vue
│       │   └── SavedGamesView.vue
│       ├── stores/
│       │   ├── gameStore.ts
│       │   ├── characterStore.ts
│       │   ├── chatStore.ts
│       │   └── uiStore.ts
│       ├── composables/
│       │   ├── useAPI.ts
│       │   ├── useDice.ts
│       │   ├── useGame.ts
│       │   └── useWebSocket.ts
│       ├── types/
│       │   ├── character.ts
│       │   ├── game.ts
│       │   └── api.ts
│       ├── services/
│       │   └── api.service.ts
│       ├── utils/
│       │   ├── diceNotation.ts
│       │   └── validators.ts
│       └── router/
│           └── index.ts
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── server.ts
│       ├── app.ts
│       ├── config/
│       │   ├── database.ts
│       │   └── gemini.ts
│       ├── controllers/
│       │   ├── gameController.ts
│       │   ├── characterController.ts
│       │   ├── narratorController.ts
│       │   └── saveController.ts
│       ├── services/
│       │   ├── geminiService.ts
│       │   ├── gameService.ts
│       │   ├── characterService.ts
│       │   └── contextService.ts
│       ├── models/
│       │   ├── Character.ts
│       │   ├── GameSession.ts
│       │   └── Message.ts
│       ├── middleware/
│       │   ├── errorHandler.ts
│       │   ├── validateRequest.ts
│       │   └── rateLimiter.ts
│       ├── routes/
│       │   ├── index.ts
│       │   ├── game.routes.ts
│       │   ├── character.routes.ts
│       │   └── narrator.routes.ts
│       ├── utils/
│       │   ├── dice.ts
│       │   ├── dndRules.ts
│       │   └── promptTemplates.ts
│       ├── types/
│       │   ├── dnd.types.ts
│       │   └── api.types.ts
│       └── websocket/
│           └── gameSocket.ts
│
└── shared/
    └── types/
        └── common.types.ts
```

---

## 🐳 Docker Setup

### docker-compose.yml
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  database:
    image: postgres:16-alpine
    container_name: dnd-database
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - dnd-network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: dnd-backend
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3000
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@database:5432/${DB_NAME}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      CORS_ORIGIN: http://localhost:5173
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      database:
        condition: service_healthy
    command: npm run dev
    networks:
      - dnd-network

  # Frontend Vue App
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: dnd-frontend
    environment:
      VITE_API_URL: http://localhost:3000
      VITE_WS_URL: ws://localhost:3000
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    command: npm run dev
    networks:
      - dnd-network

volumes:
  postgres_data:

networks:
  dnd-network:
    driver: bridge
```

### .env.example
```env
# Database
DB_USER=dnd_user
DB_PASSWORD=your_secure_password_here
DB_NAME=dnd_game

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here

# App Config
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

---

## 🗄️ Database Schema (Prisma)

### prisma/schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Character {
  id        String   @id @default(uuid())
  name      String
  race      String
  class     String
  level     Int      @default(1)
  
  // Stats
  strength      Int
  dexterity     Int
  constitution  Int
  intelligence  Int
  wisdom        Int
  charisma      Int
  
  // Combat
  hitPoints       Int
  maxHitPoints    Int
  armorClass      Int
  
  // Meta
  experience      Int      @default(0)
  avatarUrl       String?
  
  // Relations
  gameSessions GameSession[]
  inventory    Item[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([name])
}

model GameSession {
  id              String   @id @default(uuid())
  sessionToken    String   @unique // Pro sdílení
  
  characterId     String
  character       Character @relation(fields: [characterId], references: [id])
  
  // Game State
  currentLocation String
  questLog        Json     // Array of quests
  worldState      Json     // Custom world variables
  
  // Conversation History
  messages        Message[]
  
  // Meta
  isActive        Boolean  @default(true)
  lastPlayedAt    DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([sessionToken])
  @@index([characterId])
}

model Message {
  id            String   @id @default(uuid())
  
  sessionId     String
  session       GameSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  role          String   // "player", "narrator", "system"
  content       String   @db.Text
  metadata      Json?    // Dice rolls, combat results, etc.
  
  createdAt     DateTime @default(now())
  
  @@index([sessionId])
  @@index([createdAt])
}

model Item {
  id          String   @id @default(uuid())
  
  characterId String
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  
  name        String
  type        String   // weapon, armor, potion, misc
  description String?
  quantity    Int      @default(1)
  equipped    Boolean  @default(false)
  
  // Stats for weapons/armor
  damage      String?  // "1d8+2"
  armorValue  Int?
  properties  Json?    // Special properties
  
  createdAt   DateTime @default(now())
  
  @@index([characterId])
}

model WorldLocation {
  id          String   @id @default(uuid())
  name        String
  description String   @db.Text
  type        String   // town, dungeon, wilderness, etc.
  imageUrl    String?
  
  // Connections
  connectedTo Json     // Array of location IDs
  
  // NPCs and Encounters
  npcs        Json?
  encounters  Json?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([name])
}
```

---

## 🎯 FÁZE 1: MVP (Minimální Funkční Produkt)

### Cíl MVP
Základní funkční hra kde hráč může:
- Vytvořit postavu
- Konverzovat s AI vypravěčem
- Házet kostkami
- Uložit a nahrát hru

### MVP Features Checklist

**Backend (MVP):**
```typescript
// Implementuj tyto endpointy:
POST   /api/characters              // Create character
GET    /api/characters/:id          // Get character
PUT    /api/characters/:id          // Update character

POST   /api/game/start              // Start new game
POST   /api/game/session/:id/action // Send player action
GET    /api/game/session/:id        // Get game state

POST   /api/narrator/generate       // Get AI response
POST   /api/dice/roll              // Roll dice

GET    /api/saves                   // List saved games
POST   /api/saves                   // Save game
GET    /api/saves/:token            // Load game by token
```

**Frontend (MVP):**
```typescript
// Implementuj tyto view a komponenty:

// Views:
- HomeView.vue           // Landing page with "New Game" / "Load Game"
- CharacterCreationView  // Step-by-step character creator
- GameView.vue           // Main game interface

// Components:
- CharacterCreator.vue   // Form for creating character
- CharacterSheet.vue     // Display character stats
- GameChat.vue           // Chat interface with AI
- DiceRoller.vue         // Visual dice roller
- SaveGameModal.vue      // Save/Load modal
```

**Gemini Integration (MVP):**
```typescript
// geminiService.ts - Základní AI narrator

const SYSTEM_PROMPT = `
Jsi zkušený Dungeon Master pro Dungeons & Dragons 5. edice.

TVOJE ROLE:
- Vyprávíš fantasy příběhy v češtině
- Reaguješ na akce hráče kreativně a konzistentně
- Dodržuješ pravidla D&D 5e
- Vytváříš zajímavé výzvy a dilema

PRAVIDLA ODPOVĚDÍ:
1. Popisuj prostředí pomocí smyslů (zrak, sluch, čich)
2. Dialog NPC piš v uvozovkách
3. Když hráč potřebuje házet kostkou, napiš: [DICE: 1d20+X]
4. Nabídni 2-4 možnosti akcí, ale umožni vlastní
5. Udržuj tempo hry - ani moc rychle, ani pomalu

FORMAT:
[📍 Lokace]
[👁️ Popis situace]
[💬 Dialog/Narrace]
[⚔️ Combat info - jen když relevantní]
[🎲 Co chceš dělat?]

KONTEXT POSTAVY:
Jméno: {name}
Rasa: {race}
Povolání: {class}
Level: {level}
HP: {hp}/{maxHp}
`;

class GeminiService {
  async generateNarratorResponse(
    playerAction: string,
    character: Character,
    conversationHistory: Message[]
  ): Promise<string> {
    // 1. Sestavit context z historie (posledních 10 zpráv)
    // 2. Přidat system prompt s character info
    // 3. Zavolat Gemini API
    // 4. Parse a vrátit response
  }
}
```

---

## 🚀 FÁZE 2: Intermediate (Rozšířené Funkce)

### Cíl Fáze 2
Přidat herní mechaniky, lepší UX a vizuální vylepšení.

### Phase 2 Features

**1. Combat System**
```typescript
// Implementuj tahový combat:
- Initiative tracker
- Attack/Defense rolls
- HP tracking
- Combat log
- Enemy AI (řízené Gemini)
```

**2. Inventory & Equipment**
```typescript
// Plně funkční inventář:
- Add/Remove items
- Equip weapons/armor
- Item tooltips
- Weight/capacity system
- Drag & drop (volitelné)
```

**3. Quest System**
```typescript
// Quest tracking:
interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  objectives: Objective[];
}

// UI komponenta pro quest log
```

**4. World Map**
```typescript
// Interaktivní mapa:
- SVG nebo Canvas mapa
- Clickable lokace
- Fog of war (odhalování mapy)
- Fast travel mezi objevenými lokacemi
```

**5. Animace & Zvuky**
```typescript
// Přidej juice:
- Dice roll animace (CSS/Three.js)
- Typewriter effect pro narrator text
- Sound effects pro akce (optional, Web Audio API)
- Background ambience
- Particle effects pro kritické zásahy
```

**6. Advanced Dice Roller**
```typescript
// Rozšířený dice systém:
- Advantage/Disadvantage (2d20 vezmi vyšší/nižší)
- Custom modifikátory
- Historie hodů
- Statistiky (average, critical rate)
```

**7. NPC System**
```typescript
// Dynamic NPCs:
interface NPC {
  id: string;
  name: string;
  personality: string;
  relationship: number; // -100 to 100
  dialogue: DialogueTree;
}

// Gemini generuje NPC dialog based on personality
```

**8. Session Sharing**
```typescript
// Sdílení her:
- Generuj unikátní URL token
- Kdokoliv s tokenem může "spectovat"
- Optional: Multiplayer party (víc hráčů = víc postav)
```

---

## 🎨 FÁZE 3: Full Product (Kompletní Zážitek)

### Cíl Fáze 3
Profesionální aplikace s všemi pokročilými funkcemi.

### Phase 3 Features

**1. AI Image Generation**
```typescript
// Gemini Imagen integration:
- Generate character portraits
- Generate location images
- Generate items/enemies
- Gallery pro vygenerované obrázky
```

**2. Advanced Character Builder**
```typescript
// Plný D&D 5e experience:
- Výběr background & traits
- Spells & abilities podle class
- Feats & multiclassing
- Character progression tracking
```

**3. Campaign System**
```typescript
// Multi-session campaigns:
interface Campaign {
  id: string;
  title: string;
  sessions: GameSession[];
  worldMap: WorldLocation[];
  timeline: Event[];
}

// DM může vytvořit custom campaign
```

**4. Voice Integration**
```typescript
// Speech-to-text & TTS:
- Web Speech API pro player input
- Text-to-Speech pro narrator (různé hlasy pro NPC)
- Voice commands ("roll dice", "check inventory")
```

**5. 3D Dice Physics**
```typescript
// Three.js 3D dice:
- Realistická fyzika (Cannon.js / Rapier)
- Různé druhy kostek (d4, d6, d8, d10, d12, d20, d100)
- Custom textures/materials
- Throw animation
```

**6. Analytics & Achievements**
```typescript
// Player achievements:
- Track kills, quests, dice rolls
- Unlock badges
- Leaderboards (optional)
- Session statistics
```

**7. AI Image Understanding**
```typescript
// Upload vlastní obrázky:
- Hráč může uploadnout obrázek
- Gemini Vision API analyzuje a zapracuje do příběhu
- "Describe this creature I found"
```

**8. Dynamic Music**
```typescript
// Adaptive soundtrack:
- AI generuje music prompts based on scene
- Integration s Suno API / music library
- Smooth transitions mezi tracks
- Volume/mood control
```

**9. Mobile PWA**
```typescript
// Progressive Web App:
- Service Workers
- Offline mode (cache conversations)
- Install prompt
- Push notifications (session reminders)
```

**10. Admin Panel**
```typescript
// Analytics dashboard:
- Active sessions
- API usage monitoring
- Popular character builds
- User feedback
```

---

## 📝 Implementační Instrukce pro Claude Code

### FÁZE 1 IMPLEMENTACE (Start Here!)

```bash
# ==================================================
# KROK 1: Project Setup (30 min)
# ==================================================

Claude, prosím vytvoř:

1. ROOT projekt strukturu:
   - Vytvoř docker-compose.yml dle specifikace výše
   - Vytvoř .env.example
   - Vytvoř hlavní README.md s setup instrukcemi

2. BACKEND setup (backend/):
   - npm init s TypeScript
   - Nainstaluj dependencies:
     * express, cors, helmet, morgan
     * @prisma/client, prisma
     * @google/generative-ai
     * dotenv, zod (validace)
     * ws (WebSocket)
   - Vytvoř tsconfig.json
   - Vytvoř Dockerfile pro backend
   - Vytvoř Prisma schema dle specifikace

3. FRONTEND setup (frontend/):
   - npm create vite@latest . -- --template vue-ts
   - Nainstaluj dependencies:
     * pinia
     * vue-router
     * tailwindcss + autoprefixer + postcss
     * axios
     * @vueuse/core (composables)
     * socket.io-client (pro WebSocket později)
   - Setup TailwindCSS config
   - Vytvoř Dockerfile pro frontend

4. Spusť docker-compose up a ověř že vše běží

# ==================================================
# KROK 2: Database & Backend Core (1-2 hodiny)
# ==================================================

Claude, implementuj:

1. PRISMA SETUP:
   - Spusť prisma migrate dev --name init
   - Vytvoř seed.ts s testovacími daty
   - Ověř connection

2. BACKEND STRUCTURE:
   - Vytvoř Express app.ts s middleware (cors, helmet, json parser)
   - Vytvoř server.ts s Express listen + error handling
   - Implementuj základní routes structure

3. GEMINI INTEGRATION:
   - Vytvoř config/gemini.ts s API inicializací
   - Vytvoř services/geminiService.ts:
     * generateNarratorResponse()
     * Implement context management
     * Error handling pro API limits
   - Testuj connection s jednoduchým promptem

4. BASIC ENDPOINTS:
   POST /api/test/narrator - Test Gemini response
   GET  /api/health - Health check

# ==================================================
# KROK 3: Character System (2-3 hodiny)
# ==================================================

Claude, vytvoř:

1. BACKEND Character API:
   - models/Character.ts s TypeScript interfaces
   - services/characterService.ts:
     * createCharacter(data)
     * getCharacter(id)
     * updateCharacter(id, data)
     * calculateStats() - D&D 5e stat modifiers
   - controllers/characterController.ts
   - routes/character.routes.ts
   - Validace pomocí Zod schemas

2. FRONTEND Character Components:
   - types/character.ts - TypeScript types
   - stores/characterStore.ts (Pinia):
     * state: currentCharacter, characters[]
     * actions: createCharacter, loadCharacter, updateCharacter
   - components/character/CharacterCreator.vue:
     * Multi-step form (race → class → stats → name)
     * Point-buy system pro stats
     * Real-time preview
   - components/character/CharacterSheet.vue:
     * Display all character info
     * Editable notes

3. ROUTING:
   - /create-character route
   - Navigation po dokončení character creation

# ==================================================
# KROK 4: Game Loop & Chat UI (3-4 hodiny)
# ==================================================

Claude, implementuj hlavní herní smyčku:

1. BACKEND Game Logic:
   - services/gameService.ts:
     * startNewGame(characterId)
     * processPlayerAction(sessionId, action)
     * getGameState(sessionId)
   - services/contextService.ts:
     * buildContextForAI(session, messages)
     * summarizeOldMessages() - pro long sessions
   - controllers/gameController.ts
   - routes/game.routes.ts

2. CHAT INTERFACE:
   - stores/chatStore.ts:
     * messages: Message[]
     * sendMessage()
     * receiveNarratorResponse()
   - components/game/GameChat.vue:
     * Message list s scroll
     * Input field
     * Loading indicator při AI odpovědi
     * Typing indicator
     * Auto-scroll to bottom
   - Stylování: Chat bubbles s rozlišením player/narrator

3. MAIN GAME VIEW:
   - views/GameView.vue:
     * Layout: CharacterSheet (sidebar) + GameChat (main) + Actions (bottom)
     * Responsive grid

4. API INTEGRATION:
   - services/api.service.ts:
     * axios instance s baseURL
     * Error interceptors
     * Loading states

# ==================================================
# KROK 5: Dice Rolling System (1-2 hodiny)
# ==================================================

Claude, vytvoř dice mechaniků:

1. BACKEND:
   - utils/dice.ts:
     * parseDiceNotation("2d6+3")
     * rollDice(notation): { total, rolls[], modifier }
     * advantage/disadvantage logic
   - controllers/diceController.ts
   - routes/dice.routes.ts

2. FRONTEND:
   - composables/useDice.ts:
     * rollDice(notation)
     * History tracking
   - components/game/DiceRoller.vue:
     * Input field pro custom rolls
     * Quick buttons (d20, d12, d10, d8, d6, d4)
     * Animated result display
     * Roll history panel

3. INTEGRATION:
   - Parse [DICE: 1d20+5] z narrator response
   - Auto-trigger dice modal
   - Send result zpátky do game context

# ==================================================
# KROK 6: Save/Load System (2 hodiny)
# ==================================================

Claude, implementuj persistence:

1. BACKEND:
   - services/saveService.ts:
     * saveGame(sessionId): returns sessionToken
     * loadGame(sessionToken): returns full session
     * listSaves(): returns všechny sessions
   - Generuj unique shareable tokens (nanoid)
   - controllers/saveController.ts

2. FRONTEND:
   - views/SavedGamesView.vue:
     * Grid saved games
     * Last played timestamp
     * Delete option
     * Share token copy button
   - components/game/SaveGameModal.vue:
     * Save current game
     * Display session token
   - stores/gameStore.ts:
     * saveCurrentGame()
     * loadGame(tokenOrId)

# ==================================================
# KROK 7: Polish & MVP Finalization (1-2 hodiny)
# ==================================================

Claude, dotáhni MVP k používatelnosti:

1. ERROR HANDLING:
   - Global error boundary ve Vue
   - Toast notifications (vue-toastification)
   - Fallback UI pro API failures

2. LOADING STATES:
   - Skeletons pro loading data
   - Disabled states na buttons
   - Progress indicators

3. STYLING:
   - Dark theme s fantasy aesthetics
   - Custom fonts (Google Fonts - Cinzel pro headers?)
   - Consistent spacing/colors
   - Hover effects
   - Transitions

4. TESTING:
   - Manuální test celého flow:
     * Create character
     * Start game
     * Chat s AI
     * Roll dice
     * Save game
     * Load game
   - Fix critical bugs

5. DOCUMENTATION:
   - Update README s setup instrukcemi
   - API documentation
   - Environment variables docs
```

---

## 🎨 Design System & UI Guidelines

### Color Palette (TailwindCSS Custom Config)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef5ee',
          100: '#fde9d7',
          500: '#f97316', // Fantasy orange
          700: '#c2410c',
          900: '#7c2d12',
        },
        dark: {
          900: '#0a0a0f', // Near black
          800: '#1a1a2e',
          700: '#16213e',
          600: '#1f2937',
        },
        fantasy: {
          gold: '#ffd700',
          ruby: '#e0115f',
          emerald: '#50c878',
          sapphire: '#0f52ba',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'dice-roll': 'diceRoll 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        diceRoll: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(90deg)' },
          '50%': { transform: 'rotate(180deg)' },
          '75%': { transform: 'rotate(270deg)' },
        },
      },
    },
  },
}
```

### Component Structure Examples

```vue
<!-- Button.vue - Base component -->
<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <LoadingSpinner v-if="loading" class="mr-2" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
})

const buttonClasses = computed(() => {
  const base = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center'
  
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
    secondary: 'bg-dark-700 hover:bg-dark-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  
  const disabled = props.disabled || props.loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
  
  return `${base} ${variants[props.variant]} ${sizes[props.size]} ${disabled}`
})
</script>
```

---

## 🔐 Security Best Practices

```typescript
// backend/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const narratorRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  max: 15, // Max 15 requests per minute (Gemini free tier)
  message: 'Příliš mnoho požadavků, zkuste to za chvíli.',
  standardHeaders: true,
  legacyHeaders: false,
});

// backend/src/middleware/validateRequest.ts
import { z } from 'zod';

export const playerActionSchema = z.object({
  sessionId: z.string().uuid(),
  action: z.string().min(1).max(500),
  characterId: z.string().uuid(),
});

export function validateBody(schema: z.ZodSchema) {
  return async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid request data' });
    }
  };
}

// NIKDY neexposuj API keys na frontend!
// Vždy proxy přes backend
```

---

## 🚢 Deployment Strategie

### Development
```bash
docker-compose up
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
# DB: localhost:5432
```

### Production (Varianta 1: VPS)
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    command: npm run build && npm run preview

  backend:
    environment:
      - NODE_ENV=production
    command: npm run build && npm start

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
```

### Production (Varianta 2: Cloud)
- **Frontend**: Vercel / Netlify
- **Backend**: Railway / Render / Fly.io
- **Database**: Supabase / Railway PostgreSQL
- **Docker**: Docker Hub / GitHub Container Registry

---

## 📊 Performance Optimizations

```typescript
// Frontend optimizations:

// 1. Lazy load routes
const routes = [
  {
    path: '/game/:id',
    component: () => import('./views/GameView.vue'), // Code split
  },
]

// 2. Debounce player input
import { useDebounceFn } from '@vueuse/core'

const sendAction = useDebounceFn((action: string) => {
  gameStore.sendPlayerAction(action)
}, 300)

// 3. Virtual scrolling pro dlouhou message history
import { useVirtualList } from '@vueuse/core'

// 4. Memoize expensive computations
const characterModifiers = computed(() => {
  return calculateModifiers(character.value) // Only recalc when character changes
})

// Backend optimizations:

// 1. Database indexing (already in schema)

// 2. Response caching
import NodeCache from 'node-cache'
const cache = new NodeCache({ stdTTL: 300 }) // 5 min

// 3. Compression
import compression from 'compression'
app.use(compression())

// 4. Connection pooling (Prisma má built-in)
```

---

## 🧪 Testing Strategy

```typescript
// Backend tests (Vitest):
describe('DiceService', () => {
  it('should parse dice notation correctly', () => {
    const result = parseDiceNotation('2d6+3')
    expect(result).toEqual({ count: 2, sides: 6, modifier: 3 })
  })
  
  it('should roll within valid range', () => {
    const result = rollDice('1d20')
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.total).toBeLessThanOrEqual(20)
  })
})

// Frontend tests (Vitest + Vue Test Utils):
import { mount } from '@vue/test-utils'
import DiceRoller from './DiceRoller.vue'

describe('DiceRoller', () => {
  it('should emit roll event with result', async () => {
    const wrapper = mount(DiceRoller)
    await wrapper.find('button[data-dice="d20"]').trigger('click')
    expect(wrapper.emitted('roll')).toBeTruthy()
  })
})

// E2E tests (Playwright - volitelné pro MVP):
test('complete game flow', async ({ page }) => {
  await page.goto('/')
  await page.click('text=New Game')
  await page.fill('[name="characterName"]', 'Thorin')
  // ... complete flow
})
```

---

## 📈 Monitoring & Analytics

```typescript
// Pro production, přidej:

// 1. Error tracking (Sentry)
import * as Sentry from '@sentry/vue'

// 2. Analytics (Umami / Plausible - privacy-friendly)
// 3. APM (Application Performance Monitoring)
// 4. Custom metrics:

interface GameMetrics {
  sessionsStarted: number
  averageSessionDuration: number
  popularCharacterClasses: Record<string, number>
  aiResponseTime: number[]
  diceRollsCount: number
}

// Track v database nebo external service
```

---

## 🎯 Success Criteria Checklist

### ✅ MVP Ready When:
- [ ] Docker compose spustí celý stack na první pokus
- [ ] Lze vytvořit postavu s validními D&D stats
- [ ] AI vypravěč generuje konzistentní odpovědi
- [ ] Dice roller funguje pro všechny notace
- [ ] Combat tracking zobrazuje správné HP/AC
- [ ] Hra se dá uložit a nahrát pomocí tokenu
- [ ] Responsive design funguje na mobile
- [ ] Žádné critical bugs v konzoli
- [ ] API rate limits jsou respektovány
- [ ] README obsahuje kompletní setup guide

### 🚀 Phase 2 Ready When:
- [ ] Plně funkční tahový combat systém
- [ ] Inventář s drag & drop
- [ ] Quest tracking s UI
- [ ] World map s clickable lokacemi
- [ ] 5+ různých sound effects
- [ ] 3D dice s animacemi
- [ ] NPC systém s personalities

### 🏆 Phase 3 Ready When:
- [ ] AI generuje character portraits
- [ ] Voice input/output funguje
- [ ] Campaign systém pro multi-session
- [ ] PWA s offline modem
- [ ] Admin dashboard s analytics
- [ ] Production deployment na cloud
- [ ] 10+ aktivních uživatelů (beta test)

---

## 🎬 Final Instructions for Claude Code

```
Claude, implementuj tento projekt postupně podle fází:

STARTOVNÍ PŘÍKAZ:
"Vytvoř fullstack D&D aplikaci dle přiloženého promptu. Začni MVP fází, 
postupuj podle KROK 1-7. Po každém kroku se zeptej na feedback a až potvrdím, 
pokračuj dál. Prioritizuj funkčnost před krásou, ale udržuj čistý kód."

DŮLEŽITÉ PRINCIPY:
1. **Testuj průběžně** - po každé feature spusť a ověř
2. **Commituj často** - malé logické změny
3. **Ptej se** - když něco není jasné
4. **Error handling všude** - nikdy neigonoruj možné chyby
5. **TypeScript types** - vždy typuj správně
6. **Comments pro složitou logiku** - zejména D&D rules

POSTUPUJ TAKTO:
1. Setup projektu (Docker + DB + základní structure)
2. Gemini integrace a test
3. Character system
4. Game loop a chat
5. Dice rolling
6. Save/load
7. Polish MVP
8. → Pak se zeptej jestli pokračovat na Phase 2

EXPECT OBSTACLES:
- Gemini rate limits - implementuj exponential backoff
- WebSocket complexity - začni s polling, pak upgrade
- TypeScript types - buď striktní od začátku
- Docker volumes - hot reload může být tricky

PRO DEBUGOVÁNÍ:
- Vždy loguj API calls
- Použij proper HTTP status codes
- Frontend console.log pro dev
- Prisma Studio pro DB inspection

KDY SE ZASTAVIT A ZEPTAT:
- Nejasná requirement
- Multiple technické možnosti
- Performance trade-off decision
- Security concern
- Breaking change potential

Začni kódit! 🚀
```

---

## 📚 Užitečné Resources

**D&D 5e Rules:**
- https://www.dndbeyond.com/sources/basic-rules
- https://roll20.net/compendium/dnd5e

**Gemini API:**
- https://ai.google.dev/gemini-api/docs
- https://aistudio.google.com

**Vue 3:**
- https://vuejs.org/guide
- https://pinia.vuejs.org

**TypeScript:**
- https://www.typescriptlang.org/docs

**Prisma:**
- https://www.prisma.io/docs

**Docker:**
- https://docs.docker.com

---

**Hodně štěstí! Vytvoř něco epického! 🐉⚔️🎲**