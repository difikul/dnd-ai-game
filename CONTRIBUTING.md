# Contributing to D&D AI Game

Děkujeme za váš zájem přispívat do projektu! Tento guide vám pomůže začít s vývojem a posláním Pull Requestu.

## Table of Contents

- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Code Review Guidelines](#code-review-guidelines)
- [Community Guidelines](#community-guidelines)

---

## Development Setup

### Prerequisites

Než začnete, ujistěte se, že máte nainstalováno:

- **Docker** (v24.0+) a **Docker Compose** (v2.0+)
- **Node.js** v20+ (pro lokální development mimo Docker)
- **Git** v2.30+
- **GitHub account**

### Lokální nastavení

1. **Fork & Clone**

```bash
# Fork repository na GitHubu (klikněte "Fork" vpravo nahoře)

# Clone vašeho forku
git clone https://github.com/YOUR_USERNAME/dnd-ai-game.git
cd dnd-ai-game

# Přidat upstream remote
git remote add upstream https://github.com/difikul/dnd-ai-game.git
```

2. **Environment Setup**

```bash
# Zkopírovat environment template
cp .env.example .env

# Editovat .env a přidat GEMINI_API_KEY
# Získejte API klíč: https://makersuite.google.com/app/apikey
nano .env
```

3. **Spuštění aplikace**

```bash
# Build a spuštění všech služeb
docker-compose up --build

# Počkejte na build (první spuštění ~3-5 minut)
```

4. **Database inicializace**

```bash
# V novém terminálu:
docker exec -it dnd-backend sh
npm run prisma:migrate
npm run prisma:seed  # optional - testovací data
exit
```

5. **Ověření**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Database: localhost:5432

---

## Development Workflow

### 1. Synchronizace s upstream

Před začátkem práce vždy synchronizujte s hlavním repozitářem:

```bash
# Fetch změny z upstream
git fetch upstream

# Switch na develop
git checkout develop
git merge upstream/develop
git push origin develop
```

### 2. Create Feature Branch

```bash
# Vytvořte nový branch z develop
git checkout -b feature/my-new-feature develop

# Naming conventions:
# - feature/KROK-X-name     (pro roadmap implementaci)
# - feature/issue-123       (pro GitHub issues)
# - feature/add-xyz         (obecné features)
# - fix/bug-description     (pro bugfixy)
# - docs/update-readme      (pro dokumentaci)
```

### 3. Make Changes

Upravte kód podle potřeby. Pro hot reload:

```bash
# Backend změny se automaticky reloadují (nodemon)
# Frontend změny se automaticky reloadují (Vite HMR)

# Logy sledujte v terminálu:
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. Test Locally

```bash
# Testujte v Dockeru
docker-compose up

# Testujte lokálně (bez Dockeru)
cd backend
npm install
npm run dev

cd ../frontend
npm install
npm run dev

# Spusťte linter
npm run lint

# TypeScript type check
npm run type-check
```

### 5. Commit Changes

Používejte **Conventional Commits** formát:

```bash
# Přidat změny
git add .

# Commit s conventional message
git commit -m "feat(backend): implement character HP modification endpoint"

# Více info o commit formátu viz níže
```

### 6. Push & Create PR

```bash
# Push do vašeho forku
git push origin feature/my-new-feature

# Na GitHubu:
# 1. Přejděte na váš fork
# 2. Klikněte "Compare & pull request"
# 3. Base branch: "develop" (ne main!)
# 4. Vyplňte PR template
# 5. Submit PR
```

---

## Code Style Guidelines

### TypeScript

```typescript
// ✅ Good
export interface Character {
  id: string;
  name: string;
  level: number;
}

// ❌ Bad
export interface character {
  Id: String;
  NAME: any;
}
```

**Pravidla:**
- Použijte `interface` pro object shapes
- Použijte `type` pro unions/intersections
- Vždy definujte návratové typy funkcí
- Žádné `any` (použijte `unknown` pokud nutné)
- PascalCase pro types/interfaces
- camelCase pro variables/functions

### Vue 3 Components

```vue
<!-- ✅ Good: Composition API -->
<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  characterId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  save: [character: Character];
}>();

const health = ref(100);
const isAlive = computed(() => health.value > 0);
</script>

<template>
  <div class="character-card">
    <h2>{{ props.characterId }}</h2>
    <p>Health: {{ health }}</p>
  </div>
</template>
```

**Pravidla:**
- Vždy používejte `<script setup lang="ts">`
- Composition API (ne Options API)
- Props a emits typované TypeScriptem
- PascalCase pro component jména
- Scoped styles pro component-specific CSS

### Naming Conventions

```typescript
// Components
CharacterSheet.vue
StatBlock.vue

// Types/Interfaces
interface Character {}
type CharacterAction = 'attack' | 'defend';

// Functions
function calculateModifier(score: number): number {}
const handleClick = () => {};

// Constants
const MAX_LEVEL = 20;
const RACES = ['Human', 'Elf', 'Dwarf'];

// API endpoints
POST /api/characters
GET /api/characters/:id
```

### File Structure

```
src/
├── types/          # TypeScript type definitions
├── constants/      # Constant values (races, classes)
├── utils/          # Pure utility functions
├── services/       # API calls, external services
├── stores/         # Pinia state management
├── components/     # Vue components
├── views/          # Page-level components
└── router/         # Vue Router config
```

### ESLint & Prettier

```bash
# Automatické formátování
npm run format

# Kontrola linting
npm run lint

# Fix linting issues
npm run lint:fix
```

**Pravidla:**
- 2 spaces pro indentation
- Single quotes pro strings
- Semicolons required
- Trailing commas
- Max line length: 100 characters

---

## Testing

### Backend Testing (Plánováno)

```bash
cd backend
npm run test              # Spustí unit testy
npm run test:integration  # Spustí integration testy
npm run test:coverage     # Coverage report
```

**Test struktura:**
```typescript
// backend/src/services/__tests__/aiService.test.ts
import { describe, it, expect } from 'vitest';

describe('AIService', () => {
  it('should generate character description', async () => {
    const result = await aiService.generateDescription({...});
    expect(result).toBeDefined();
  });
});
```

### Frontend Testing (Plánováno)

```bash
cd frontend
npm run test              # Spustí component testy
npm run test:e2e          # E2E testy (Playwright)
```

**Component test example:**
```typescript
import { mount } from '@vue/test-utils';
import CharacterSheet from '@/components/CharacterSheet.vue';

describe('CharacterSheet', () => {
  it('renders character name', () => {
    const wrapper = mount(CharacterSheet, {
      props: { character: { name: 'Gandalf' } }
    });
    expect(wrapper.text()).toContain('Gandalf');
  });
});
```

### Manual Testing Checklist

Před odesláním PR:

- [ ] Aplikace se spouští bez erroru
- [ ] Hot reload funguje
- [ ] TypeScript type check prochází
- [ ] ESLint nemá chyby
- [ ] Testováno v Chromu a Firefoxu
- [ ] Testováno na mobilu (responsive)
- [ ] Console nemá errors/warnings
- [ ] Network requests jsou úspěšné

---

## Pull Request Process

### 1. PR Checklist

Před vytvořením PR se ujistěte:

- [ ] Kód je okomentován pro komplexní logiku
- [ ] Dokumentace aktualizována (pokud nutné)
- [ ] Žádné hardcoded API keys nebo credentials
- [ ] Žádné `console.log()` debugging statements
- [ ] TypeScript types správně definované
- [ ] Error handling implementován
- [ ] CI checks procházejí (green)

### 2. PR Template

Vyplňte všechny sekce v PR template:
- Description
- Type of Change
- Related Issues
- Changes Made
- Testing Checklist
- Code Quality Checklist
- Deployment Notes

### 3. Base Branch

- Všechny PR musí targetovat `develop` (ne `main`)
- `main` branch je reserved pro production releases

### 4. CI Checks

Váš PR musí projít:
- ✅ **ci-backend**: TypeScript check, ESLint, build
- ✅ **ci-frontend**: TypeScript check, ESLint, build
- ✅ **ci-docker**: Docker compose build & health check

Pokud CI selže:
```bash
# Pull nejnovější změny
git fetch upstream
git merge upstream/develop

# Fix issues
# ...

# Push opravený kód
git push origin feature/my-branch
```

### 5. Code Review

- Očekávejte feedback od maintainera
- Reagujte na review comments
- Provádějte requested changes
- Re-request review po update

### 6. Merge

Po schválení:
- Maintainer provede **squash merge** do develop
- Váš feature branch bude smazán
- Synchronizujte váš fork

---

## Commit Message Guidelines

### Conventional Commits Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | Nová funkce | `feat(backend): add character HP modification endpoint` |
| `fix` | Oprava bugu | `fix(frontend): resolve race selector layout bug` |
| `docs` | Dokumentace | `docs: update API endpoints in README` |
| `style` | Formátování | `style(frontend): fix linting issues` |
| `refactor` | Refactoring | `refactor(backend): extract game logic to service` |
| `test` | Testy | `test(backend): add unit tests for AI service` |
| `chore` | Maintenance | `chore: update dependencies` |
| `ci` | CI/CD | `ci: add GitHub Actions workflow for tests` |

### Scopes

- `backend` - Backend Node.js/Express/Prisma
- `frontend` - Frontend Vue 3/TypeScript
- `docker` - Docker/docker-compose
- `ci` - GitHub Actions workflows
- `docs` - Dokumentace
- `db` - Database schema/migrations

### Examples

```bash
# Good commits
git commit -m "feat(backend): implement race selection endpoint with validation"
git commit -m "fix(frontend): correct character stats calculation in UI"
git commit -m "docs: add Docker setup instructions to README"
git commit -m "ci: enable PostgreSQL service in backend workflow"
git commit -m "refactor(backend): migrate to Prisma ORM from raw SQL"
git commit -m "test(frontend): add unit tests for CharacterSheet component"
git commit -m "chore(deps): update @google/generative-ai to v0.21.0"

# Breaking change
git commit -m "feat(backend)!: change character creation API response format

BREAKING CHANGE: Response now returns { character: {...} } instead of direct object"

# Bad commits (avoid these!)
git commit -m "fix: stuff"
git commit -m "update files"
git commit -m "WIP"
git commit -m "minor changes"
```

### Breaking Changes

Pro breaking changes přidejte `!` po type/scope:

```bash
git commit -m "feat(backend)!: change API authentication to JWT

BREAKING CHANGE: All endpoints now require Authorization header with Bearer token"
```

---

## Code Review Guidelines

### For Reviewers

Při review PR kontrolujte:

**Code Quality**
- [ ] Kód je čitelný a srozumitelný
- [ ] Pojmenování proměnných je jasné
- [ ] Žádné duplicitní kód
- [ ] Komplexní logika okomentována
- [ ] Error handling přítomen

**Security**
- [ ] Žádné hardcoded credentials
- [ ] Žádné API keys v kódu
- [ ] Input validation implementována
- [ ] SQL injection prevention (Prisma ORM)

**TypeScript**
- [ ] Všechny types správně definované
- [ ] Žádné `any` types
- [ ] Props & emits typované
- [ ] Return types funkcí specifikované

**Testing**
- [ ] Testy přidány/aktualizovány (pokud relevantní)
- [ ] CI checks procházejí
- [ ] Manuálně otestováno

**Git**
- [ ] Commit messages dodržují Conventional Commits
- [ ] PR targetuje správný branch (develop)
- [ ] Žádné merge conflicts

### Providing Feedback

**Constructive comments:**
```
✅ "Consider using a more descriptive variable name here.
   Maybe `characterLevel` instead of `lvl` for clarity?"

✅ "This looks good! Small suggestion: we could extract
   this logic into a utility function for reusability."

❌ "This is wrong."
❌ "Bad code."
```

**Approval process:**
- Request changes if critical issues
- Approve if code is good to merge
- Comment for suggestions (non-blocking)

---

## Community Guidelines

### Be Respectful

- Respektujte názory ostatních
- Buďte vstřícní k začátečníkům
- Žádné osobní útoky nebo toxické chování
- Konstruktivní kritika, ne destruktivní

### Be Constructive

- Poskytujte konkrétní feedback
- Vysvětlete "proč", ne jen "co"
- Navrhněte alternativy
- Oceňte dobrou práci

### Ask Questions

- Není hloupá otázka
- Ptejte se, když něčemu nerozumíte
- Používejte GitHub Discussions pro širší diskuze
- Čtěte dokumentaci před ptaním

### Help Others

- Odpovídejte na issues
- Reviewujte PR od ostatních
- Vylepšujte dokumentaci
- Sdílejte znalosti

### Communication

- **Issues**: Pro bug reports, feature requests
- **Discussions**: Pro obecné otázky, nápady
- **PR Comments**: Pro review feedback
- **Email**: difikul@github pro soukromé záležitosti

---

## Additional Resources

- **Project Documentation**: Viz složka docs/
  - [DEVOPS.md](./DEVOPS.md) - Git flow, CI/CD, deployment
  - [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
  - [ROADMAP.md](./ROADMAP.md) - Feature roadmap

- **External Links**:
  - [Conventional Commits](https://www.conventionalcommits.org/)
  - [Vue 3 Docs](https://vuejs.org/)
  - [TypeScript Handbook](https://www.typescriptlang.org/docs/)
  - [Prisma Docs](https://www.prisma.io/docs)
  - [Docker Docs](https://docs.docker.com/)

---

## Getting Help

Pokud máte problémy nebo otázky:

1. **Dokumentace**: Přečtěte si README.md a související docs
2. **GitHub Issues**: Hledejte existující issues
3. **GitHub Discussions**: Zeptejte se komunity
4. **Stack Overflow**: Tag `dnd-ai-game`

---

## License

Přispíváním do projektu souhlasíte, že váš příspěvek bude licensován pod **MIT License**.

---

**Děkujeme za váš přínos! Happy coding! 🎲⚔️🐉**
