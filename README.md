# 🐉 D&D AI Game - Dungeons & Dragons s AI Vypravěčem

> Interaktivní D&D hra s AI Dungeon Masterem poháněným Google Gemini

[![CI Backend](https://github.com/difikul/dnd-ai-game/workflows/Backend%20CI/badge.svg)](https://github.com/difikul/dnd-ai-game/actions/workflows/ci-backend.yml)
[![CI Frontend](https://github.com/difikul/dnd-ai-game/workflows/Frontend%20CI/badge.svg)](https://github.com/difikul/dnd-ai-game/actions/workflows/ci-frontend.yml)
[![CI Docker](https://github.com/difikul/dnd-ai-game/workflows/Docker%20Build%20CI/badge.svg)](https://github.com/difikul/dnd-ai-game/actions/workflows/ci-docker.yml)

## ✨ Features

**Kompletní Character Creation:**
- 9 ras (Human, Elf, Dwarf, Halfling, Gnome, Half-Elf, Half-Orc, Tiefling, Dragonborn)
- 12 tříd (Fighter, Wizard, Rogue, Cleric, Ranger, Paladin, Barbarian, Bard, Druid, Monk, Sorcerer, Warlock)
- D&D 5e mechaniky (ability scores, HP, AC, modifiers)
- Standard Array a Point Buy metody

**AI Narrator:**
- Google Gemini 2.0 Flash model
- České fantasy příběhy
- Real-time chat interface
- Context-aware responses
- Dlouhodobá paměť konverzace

**Dice Rolling System:**
- Všechny D&D kostky (d4, d6, d8, d10, d12, d20, d100)
- Advantage/Disadvantage mechanika
- Custom notation (1d20+5, 2d6, atd.)
- Roll history tracking
- Critical hit/miss detection

**Save/Load System:**
- Uložení hry s shareable tokenem
- Načtení hry odkudkoliv
- Browse všech uložených her
- Management saved games
- Perzistence kompletního game state

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git
- Port 3000 (backend), 5173 (frontend), 5432 (database) volné
- Google Gemini API key ([získat zde](https://aistudio.google.com))

### Setup

1. **Clone repository:**
```bash
git clone <repository-url>
cd dnd
```

2. **Environment setup:**
```bash
cp .env.example .env
# Edituj .env a přidej svůj GEMINI_API_KEY
```

Příklad `.env`:
```bash
# Database
DATABASE_URL=postgresql://dnd_user:dnd_password@database:5432/dnd_game?schema=public

# Backend
PORT=3000
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3000/api

# Google Gemini API
GEMINI_API_KEY=your_api_key_here
```

3. **Start aplikace:**
```bash
docker-compose up --build
```

Při prvním spuštění může build trvat několik minut.

4. **Database setup:**
```bash
# Vejít do backend kontejneru
docker exec -it dnd-backend sh

# Spustit Prisma migrations
npm run prisma:migrate

# (Volitelně) Naplnit testovacími daty
npm run prisma:seed
```

5. **Open browser:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Database: localhost:5432

## 🎮 Jak hrát

1. **Vytvoř postavu:**
   - Klikni "Nová Hra" na homepage
   - Vyber rasu (9 možností)
   - Vyber třídu (12 možností)
   - Přiřaď ability scores (Standard Array nebo Point Buy)
   - HP a AC se automaticky počítají
   - Klikni "Vytvořit postavu"

2. **Začni dobrodružství:**
   - AI vypravěč tě uvítá a představí úvodní scénu
   - Piš své akce do chat inputu
   - AI reaguje na tvé rozhodnutí (15-20s response time)

3. **Házej kostkami:**
   - Klikni 🎲 Dice button
   - Vyber quick button (d4-d100) nebo zadej custom notation
   - Použij Advantage/Disadvantage pro combat
   - Historie hodů je uložena v modalu

4. **Ulož hru:**
   - Klikni 💾 Save button
   - Zkopíruj token (automatické kopírování do clipboardu)
   - Sdílej token s přáteli nebo si ho ulož

5. **Načti hru:**
   - Na homepage vlož token
   - Nebo klikni "Načíst Hru" a vyber ze seznamu
   - Hra pokračuje přesně tam, kde jsi skončil

## 📁 Project Structure

```
dnd-ai-game/
├── docker-compose.yml       # Docker orchestrace
├── .env                     # Environment variables (gitignored)
├── .env.example            # Template pro .env
├── README.md               # Tento soubor
├── TESTING_CHECKLIST.md    # Manuální testing checklist
├── ARCHITECTURE.md         # Architektura aplikace
├── ROADMAP.md             # Development roadmap
├── DEVOPS.md              # DevOps dokumentace
│
├── backend/               # Node.js + Express + Prisma
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Seed data
│   └── src/
│       ├── server.ts       # Express server
│       ├── app.ts          # App configuration
│       ├── controllers/    # Route handlers
│       ├── services/       # Business logic
│       ├── routes/         # API routes
│       ├── config/         # Configuration
│       └── middleware/     # Express middleware
│
└── frontend/              # Vue 3 + TypeScript + Vite
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── playwright.config.ts
    └── src/
        ├── main.ts         # App entry point
        ├── App.vue         # Root component
        ├── components/     # Vue components
        ├── views/          # Page views
        ├── stores/         # Pinia stores
        ├── services/       # API services
        ├── composables/    # Composable functions
        └── router/         # Vue Router
```

## 🛠️ Tech Stack

**Frontend:**
- Vue 3 (Composition API)
- TypeScript
- Pinia (state management)
- TailwindCSS (dark fantasy theme)
- Vite
- Playwright (E2E testing)

**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL 16
- Google Gemini API
- Zod (validation)

**DevOps:**
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Trivy (security scanning)

## 📊 MVP Status

- ✅ KROK 1: Project Setup
- ✅ KROK 2: Database & Backend Core
- ✅ KROK 3: Character System
- ✅ KROK 4: Game Loop & Chat UI
- ✅ KROK 5: Dice Rolling System
- ✅ KROK 6: Save/Load System
- ✅ KROK 7: Polish & Testing

**MVP COMPLETED** 🎉

## 🧪 Testing

### Backend API Tests
```bash
cd backend/tests
./api-save-load-simple.sh
```

### Frontend E2E Tests
```bash
cd frontend

# Run all tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Show test report
npm run test:e2e:report

# Specific test suites
npm run test:e2e -- tests/e2e/game-flow.spec.ts
npm run test:e2e -- tests/e2e/dice-roller.spec.ts
npm run test:e2e -- tests/e2e/save-load.spec.ts
```

### Manual Testing
Viz [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) pro kompletní manuální testing checklist.

## 📝 API Documentation

**Base URL:** `http://localhost:3000/api`

### Character Endpoints
- `POST /api/characters` - Create character
  ```json
  {
    "name": "Gandalf",
    "race": "Human",
    "class": "Wizard",
    "level": 1,
    "abilityScores": {
      "strength": 8,
      "dexterity": 10,
      "constitution": 12,
      "intelligence": 15,
      "wisdom": 13,
      "charisma": 14
    }
  }
  ```
- `GET /api/characters/:id` - Get character
- `PUT /api/characters/:id` - Update character
- `DELETE /api/characters/:id` - Delete character

### Game Endpoints
- `POST /api/game/start` - Start new game
  ```json
  {
    "characterId": "abc123"
  }
  ```
- `POST /api/game/session/:id/action` - Send player action
  ```json
  {
    "action": "Vstoupím do temné místnosti s mečem v ruce"
  }
  ```
- `GET /api/game/session/:id` - Get game state
- `POST /api/game/session/:id/end` - End session

### Dice Endpoints
- `POST /api/dice/roll` - Roll dice
  ```json
  {
    "notation": "1d20+5",
    "advantage": false,
    "disadvantage": false
  }
  ```
- `GET /api/dice/types` - List supported dice types

### Save Endpoints
- `GET /api/saves` - List all saved games
- `POST /api/saves/:sessionId` - Save game
- `GET /api/saves/token/:token` - Load game by token
- `DELETE /api/saves/:sessionId` - Delete saved game

## 🛠️ Development

### Hot Reload

Obě aplikace mají nastaven hot reload:
- Změny v `./backend/src/` se automaticky projeví
- Změny v `./frontend/src/` se automaticky projeví

### Příkazy

```bash
# Spustit aplikaci
docker-compose up

# Spustit na pozadí
docker-compose up -d

# Zobrazit logy
docker-compose logs -f

# Zastavit aplikaci
docker-compose down

# Zastavit a smazat volumes (včetně DB)
docker-compose down -v

# Rebuild kontejnerů
docker-compose up --build

# Restart jednotlivého service
docker-compose restart backend
docker-compose restart frontend
docker-compose restart database
```

### Přístup do kontejnerů

```bash
# Backend
docker exec -it dnd-backend sh

# Frontend
docker exec -it dnd-frontend sh

# Database
docker exec -it dnd-database psql -U dnd_user -d dnd_game
```

### Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Seed database
npm run prisma:seed
```

## 🐛 Troubleshooting

### Port už používán
```bash
# Zjistit, co běží na portu
sudo lsof -i :3000
sudo lsof -i :5173
sudo lsof -i :5432

# Zastavit docker kontejnery
docker-compose down
```

### Database connection failed
```bash
# Restart database kontejneru
docker-compose restart database

# Zkontrolovat logs
docker-compose logs database

# Smazat volumes a restart
docker-compose down -v
docker-compose up --build
```

### Hot reload nefunguje
```bash
# Rebuild kontejnerů
docker-compose down
docker-compose up --build
```

### Gemini API errors
- Zkontroluj že máš validní API key v `.env`
- Zkontroluj rate limits na [Google AI Studio](https://aistudio.google.com)
- Free tier má limit 15 requests/minute

### Docker build fails
```bash
# Vyčistit Docker cache
docker system prune -a
docker volume prune

# Rebuild from scratch
docker-compose build --no-cache
```

## 🚀 DevOps & Development Workflow

### CI/CD Pipeline

Projekt používá GitHub Actions pro automatické testování:

- **Backend CI**: TypeScript type check, ESLint linting, build verification, Prisma schema validation
- **Frontend CI**: Vue-tsc type check, ESLint linting, Vite build, Playwright E2E tests
- **Docker CI**: Docker Compose build test, Trivy security scan

Všechny workflows běží automaticky při push/PR na `develop` a `main` branches.

### Git Flow

Projekt používá Git Flow strategii:

- `main` - Production-ready kód (protected, tagged releases)
- `develop` - Integration branch pro development
- `feature/*` - Feature branches (merge do develop)
- `hotfix/*` - Critical bug fixes (merge do main i develop)

**Branch naming:**
```bash
feature/KROK-X-nazev
feature/issue-123
hotfix/critical-bug
```

**Commit messages:** Používáme [Conventional Commits](https://www.conventionalcommits.org/)
```bash
feat(backend): add character HP modification endpoint
fix(frontend): resolve race selector layout bug
docs: update API endpoints in README
ci: add GitHub Actions workflow for backend tests
```

### Documentation

- **[DEVOPS.md](DEVOPS.md)** - Kompletní DevOps dokumentace (Git Flow, CI/CD, Deployment, Security)
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architektura aplikace
- **[ROADMAP.md](ROADMAP.md)** - Development roadmap
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - Manuální testing checklist

## 🗺️ Roadmap

### MVP (Fáze 1) - ✅ COMPLETED
- ✅ Vytváření D&D postav
- ✅ Konverzace s AI vypravěčem (Gemini)
- ✅ Systém házení kostkami
- ✅ Ukládání a načítání her

### Intermediate (Fáze 2) - Plánováno
- Tahový combat systém
- Inventář a equipment
- Quest tracking
- Interaktivní mapa světa
- Animace a zvuky
- NPC systém

### Full Product (Fáze 3) - Plánováno
- AI generování obrázků
- Voice integrace
- 3D fyzika kostek
- Campaign systém
- Mobile PWA

## 🤝 Contributing

Contributions welcome! Prosím přečti [CONTRIBUTING.md](CONTRIBUTING.md) pro detaily o development workflow, code style a PR procesu.

## 📄 License

MIT License - see LICENSE file for details

## 👤 Author

**difikul**
- GitHub: [@difikul](https://github.com/difikul)
- Project: [dnd-ai-game](https://github.com/difikul/dnd-ai-game)

## 🙏 Acknowledgments

- D&D 5e rules by Wizards of the Coast
- Google Gemini AI
- Vue.js & TypeScript communities
- Claude Code

---

**Hodně štěstí při hraní! 🎲⚔️🐉**
