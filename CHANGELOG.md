# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Kompletní testing strategie (Unit, Integration, E2E)
- Playwright E2E testy pro game flow
- Dice Roll integrace s AI systémem
- Long Rest automatické volání při klíčových slovech
- Frontend `data-testid` atributy pro E2E testy
- Dokumentace: `docs/TESTING.md`, `docs/BUG_FIXES.md`, `docs/FRONTEND_DATA_TESTID.md`
- Test database na portu 5433 pro izolované testování
- Vitest unit testy (45 testů)
- Vitest + Supertest integration testy (30 testů)
- Playwright E2E testy (28 testů)

### Fixed
- **CRITICAL**: AI neviděla známá kouzla (chyběly `knownSpells` a `spellSlots` v Prisma include)
- **MEDIUM**: Long Rest automatické volání a obnova HP/spell slotů
- **MEDIUM**: Dice Roll integrace - backend nyní podporuje `diceRollResult` parametr

### Changed
- `gameService.ts`: Přidány `knownSpells: true` a `spellSlots: true` do 3 funkcí
- `api.types.ts`: Přidán `diceRollResult?: number` do `playerActionSchema`
- `gameController.ts`: Předává `diceRollResult` do service layer
- README.md: Aktualizována Testing sekce s odkazy na novou dokumentaci

---

## [1.0.0] - 2025-11-15 - MVP COMPLETED 🎉

### Added
- **Character Creation System**
  - 9 ras (Human, Elf, Dwarf, Halfling, Gnome, Half-Elf, Half-Orc, Tiefling, Dragonborn)
  - 12 tříd (Fighter, Wizard, Rogue, Cleric, Ranger, Paladin, Barbarian, Bard, Druid, Monk, Sorcerer, Warlock)
  - Standard Array a Point Buy metody pro ability scores
  - Automatický výpočet HP, AC, modifiers podle D&D 5e pravidel

- **AI Narrator System**
  - Google Gemini 2.0 Flash model integrace
  - České fantasy příběhy
  - Real-time chat interface
  - Context-aware responses s dlouhodobou pamětí
  - Message history tracking

- **Dice Rolling System**
  - Všechny D&D kostky (d4, d6, d8, d10, d12, d20, d100)
  - Advantage/Disadvantage mechanika
  - Custom notation support (1d20+5, 2d6, atd.)
  - Roll history tracking
  - Critical hit/miss detection

- **Save/Load System**
  - Uložení hry s shareable tokenem
  - Načtení hry odkudkoliv
  - Browse všech uložených her
  - Management saved games
  - Perzistence kompletního game state

- **Authentication & Authorization**
  - User registration/login
  - JWT-based authentication
  - Password hashing (bcrypt)
  - Gemini API key per-user storage

- **Frontend UI/UX**
  - Dark fantasy theme (TailwindCSS)
  - Responsive design
  - Character sheet zobrazení (HP, AC, stats)
  - Game chat interface
  - Dice roller modal
  - Save/Load modal

- **Backend API**
  - RESTful API (Express + TypeScript)
  - Prisma ORM + PostgreSQL 16
  - Zod validation schemas
  - Error handling middleware
  - CORS, Helmet, Rate limiting

- **DevOps & CI/CD**
  - Docker Compose orchestrace
  - GitHub Actions workflows (Backend CI, Frontend CI, Docker CI)
  - Trivy security scanning
  - Git Flow strategy
  - Conventional Commits

### Documentation
- README.md - Quick start guide
- ARCHITECTURE.md - System architecture
- DEVOPS.md - DevOps & deployment
- ROADMAP.md - Development roadmap
- TESTING_CHECKLIST.md - Manual testing checklist

---

## [0.7.0] - 2025-11-12 - KROK 7: Polish & Testing

### Added
- Playwright E2E testing setup
- Manuální testing checklist
- CI/CD workflows (GitHub Actions)
- Docker security scanning (Trivy)
- DEVOPS.md dokumentace

### Fixed
- Frontend build issues
- ESLint warnings
- TypeScript strict mode violations

### Changed
- Optimalizace Docker image sizes
- Production build configurations
- Error handling improvements

---

## [0.6.0] - 2025-11-10 - KROK 6: Save/Load System

### Added
- `POST /api/saves/:sessionId` - Uložení hry
- `GET /api/saves` - Seznam uložených her
- `GET /api/saves/token/:token` - Načtení hry podle tokenu
- `DELETE /api/saves/:sessionId` - Smazání uložené hry
- SavedGame Prisma model
- Save/Load modal v UI
- Token kopírování do clipboardu

### Changed
- GameSession model rozšířen o `savedAt` a `loadToken` fields
- SavedGamesView komponenta

---

## [0.5.0] - 2025-11-08 - KROK 5: Dice Rolling System

### Added
- `POST /api/dice/roll` endpoint
- `GET /api/dice/types` endpoint
- DiceRoller Vue komponenta
- Advantage/Disadvantage mechanika
- Roll history tracking
- Critical hit/miss detection
- Custom dice notation parser

### Changed
- GameView integrace s DiceRoller
- Character sheet zobrazuje modifiers

---

## [0.4.0] - 2025-11-05 - KROK 4: Game Loop & Chat UI

### Added
- `POST /api/game/start` endpoint
- `POST /api/game/session/:id/action` endpoint
- `GET /api/game/session/:id` endpoint
- `POST /api/game/session/:id/end` endpoint
- Google Gemini AI integrace
- GameView komponenta
- GameChat komponenta
- Real-time AI narrator responses
- Message history persistence

### Changed
- GameSession Prisma model rozšířen o `messages` pole
- Character model rozšířen o `currentHitPoints`

---

## [0.3.0] - 2025-11-03 - KROK 3: Character System

### Added
- `POST /api/characters` endpoint
- `GET /api/characters/:id` endpoint
- `PUT /api/characters/:id` endpoint
- `DELETE /api/characters/:id` endpoint
- Character Prisma model
- CharacterCreator Vue komponenta
- CharacterList Vue komponenta
- CharacterSheet Vue komponenta
- RaceSelector a ClassSelector komponenty
- Ability score assignment (Standard Array, Point Buy)
- HP/AC auto-calculation

### Changed
- User model rozšířen o vztah k Characters
- D&D 5e calculations utils

---

## [0.2.0] - 2025-11-01 - KROK 2: Database & Backend Core

### Added
- PostgreSQL 16 database (Docker)
- Prisma ORM setup
- User model (Prisma schema)
- `POST /api/auth/register` endpoint
- `POST /api/auth/login` endpoint
- JWT authentication middleware
- Password hashing (bcrypt)
- Zod validation schemas

### Changed
- Express server setup
- Environment variables (.env.example)
- Error handling middleware

---

## [0.1.0] - 2025-10-30 - KROK 1: Project Setup

### Added
- Project structure (backend, frontend)
- Docker Compose configuration
- Backend: Node.js + Express + TypeScript
- Frontend: Vue 3 + TypeScript + Vite
- TailwindCSS setup
- Vue Router + Pinia
- Basic HomeView, LoginView, RegisterView
- Git Flow strategy
- README.md, .gitignore, .env.example

---

## Legend

- **Added**: Nové features
- **Changed**: Změny existující funkcionality
- **Deprecated**: Features označené k odstranění
- **Removed**: Odstraněné features
- **Fixed**: Bug fixes
- **Security**: Security fixes

---

**Konvence:**
- `[Unreleased]` - Work in progress (develop branch)
- `[X.Y.Z]` - Released versions (main branch)
- `YYYY-MM-DD` - Release date

**Semantic Versioning:**
- `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes (backwards compatible)
