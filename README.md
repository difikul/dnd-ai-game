# 🐉 D&D AI Game - Fullstack Webová Hra s AI Vypravěčem

[![CI Backend](https://github.com/difikul/dnd-ai-game/workflows/Backend%20CI/badge.svg)](https://github.com/difikul/dnd-ai-game/actions/workflows/ci-backend.yml)
[![CI Frontend](https://github.com/difikul/dnd-ai-game/workflows/Frontend%20CI/badge.svg)](https://github.com/difikul/dnd-ai-game/actions/workflows/ci-frontend.yml)
[![CI Docker](https://github.com/difikul/dnd-ai-game/workflows/Docker%20Build%20CI/badge.svg)](https://github.com/difikul/dnd-ai-game/actions/workflows/ci-docker.yml)

Profesionální fullstack webová aplikace pro Dungeons & Dragons s AI vypravěčem poháněným Google Gemini.

## 🎯 Tech Stack

- **Frontend**: Vue 3 (Composition API) + TypeScript + Pinia + TailwindCSS + Vite
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL 16
- **AI**: Google Gemini API
- **Deployment**: Docker + Docker Compose

## 📋 Předpoklady

- Docker a Docker Compose nainstalované
- Git
- Port 3000 (backend), 5173 (frontend), 5432 (database) volné

## 🚀 Quick Start

### 1. Klonování projektu

```bash
git clone <repository-url>
cd dnd
```

### 2. Nastavení environment variables

Soubor `.env` je již vytvořen s funkčním API klíčem. Pokud potřebujete změnit nastavení, editujte `.env`:

```bash
# Viz .env.example pro template
```

### 3. Spuštění aplikace

```bash
# Spustí všechny services (database, backend, frontend)
docker-compose up --build
```

Při prvním spuštění může build trvat několik minut.

### 4. Přístup k aplikaci

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432

## 🗄️ Database Setup

Po prvním spuštění je potřeba vytvořit databázové schéma:

```bash
# Vejít do backend kontejneru
docker exec -it dnd-backend sh

# Spustit Prisma migrations
npm run prisma:migrate

# (Volitelně) Naplnit testovacími daty
npm run prisma:seed
```

## 📁 Struktura Projektu

```
dnd/
├── docker-compose.yml      # Docker orchestrace
├── .env                    # Environment variables (gitignored)
├── .env.example           # Template pro .env
├── README.md              # Tento soubor
│
├── backend/               # Node.js + Express + Prisma
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── server.ts
│       ├── app.ts
│       ├── controllers/
│       ├── services/
│       ├── routes/
│       └── ...
│
└── frontend/              # Vue 3 + TypeScript + Vite
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.ts
        ├── App.vue
        ├── components/
        ├── views/
        ├── stores/
        └── ...
```

## 🛠️ Development

### Hot Reload

Obě aplikace (frontend i backend) mají nastaven hot reload:

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

## 📚 API Dokumentace

API běží na `http://localhost:3000/api`

### Endpoints (MVP)

- `POST /api/characters` - Vytvoření postavy
- `GET /api/characters/:id` - Detail postavy
- `PUT /api/characters/:id` - Update postavy
- `POST /api/game/start` - Start nové hry
- `POST /api/game/session/:id/action` - Odeslání akce
- `GET /api/game/session/:id` - Získání stavu hry
- `POST /api/narrator/generate` - AI odpověď
- `POST /api/dice/roll` - Hod kostkou
- `GET /api/saves` - Seznam uložených her
- `POST /api/saves` - Uložení hry
- `GET /api/saves/:token` - Načtení hry

## 🎮 Features

### MVP (Fáze 1)
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
```

### Hot reload nefunguje
```bash
# Rebuild kontejnerů
docker-compose down
docker-compose up --build
```

## 🚀 DevOps & Development Workflow

### CI/CD Pipeline

Projekt používá GitHub Actions pro automatické testování a deployment:

- **Backend CI**: TypeScript type check, ESLint linting, build verification, Prisma schema validation
- **Frontend CI**: Vue-tsc type check, ESLint linting, Vite build
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

### Contributing

Chcete přispět? Skvělé! Přečtěte si [CONTRIBUTING.md](CONTRIBUTING.md) pro detaily o development workflow, code style a PR procesu.

### Documentation

- **[DEVOPS.md](DEVOPS.md)** - Kompletní DevOps dokumentace (Git Flow, CI/CD, Deployment, Security)
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architektura aplikace
- **[ROADMAP.md](ROADMAP.md)** - Development roadmap
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contributing guide

## 📝 License

MIT

## 👨‍💻 Author

Created with Claude Code

---

**Hodně štěstí při hraní! 🎲⚔️🐉**
