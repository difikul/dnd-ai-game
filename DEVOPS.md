# DevOps Documentation

![CI Backend](https://github.com/difikul/dnd-ai-game/workflows/CI%20Backend/badge.svg)
![CI Frontend](https://github.com/difikul/dnd-ai-game/workflows/CI%20Frontend/badge.svg)
![CI Docker](https://github.com/difikul/dnd-ai-game/workflows/CI%20Docker/badge.svg)

Kompletní DevOps dokumentace pro D&D AI Game projekt zahrnující Git flow, CI/CD pipeline, deployment strategie a best practices.

---

## 1. Git Flow Strategie

### Branch Model

Projekt využívá upravený Git Flow model pro strukturovaný vývoj a release management:

| Branch Type | Naming | Purpose | Lifetime |
|------------|---------|---------|----------|
| `main` | `main` | Production-ready kód, tagged releases | Permanent |
| `develop` | `develop` | Integration branch pro aktuální vývoj | Permanent |
| `feature` | `feature/KROK-X-nazev` nebo `feature/issue-123` | Vývoj nových funkcí | Temporary |
| `hotfix` | `hotfix/critical-bug` | Kritické opravy v produkci | Temporary |
| `release` | `release/v1.0.0` | Příprava nové release verze | Temporary |

### Branch Workflow

```
main (v1.0.0) ───────────────┬─────────> (v1.1.0)
                             │
                      hotfix/critical-bug
                             │
develop ──┬────────┬─────────┴──────────>
          │        │
    feature/A  feature/B
```

### Main Branch
- **Účel**: Stabilní produkční kód
- **Protected**: Vyžaduje PR review a procházející CI checks
- **Tagging**: Každý merge z release/* je otagován verzí (v1.0.0, v1.1.0)
- **Deploy**: Automatický deploy do produkce (pokud je CD nakonfigurováno)

### Develop Branch
- **Účel**: Integrace všech dokončených features
- **Protected**: Vyžaduje procházející status checks
- **Merge Strategy**: Squash merge z feature branches
- **Deploy**: Automatický deploy do staging/dev prostředí

### Feature Branches
- **Vytvoření**: `git checkout -b feature/KROK-X-nazev develop`
- **Naming Conventions**:
  - `feature/KROK-1-character-creation` - pro implementaci kroků z roadmap
  - `feature/issue-45` - pro GitHub issues
  - `feature/add-race-selector` - obecné features
- **Merge Target**: `develop` via Pull Request
- **Delete**: Po úspěšném merge do develop

### Hotfix Branches
- **Vytvoření**: `git checkout -b hotfix/critical-bug main`
- **Účel**: Okamžité opravy kritických bugů v produkci
- **Merge Target**: `main` AND `develop` (dual merge)
- **Versioning**: Patch version increment (v1.0.0 → v1.0.1)

### Release Branches
- **Vytvoření**: `git checkout -b release/v1.0.0 develop`
- **Účel**: Příprava release (finální testy, dokumentace, version bump)
- **Merge Target**: `main` (a zpětně do `develop`)
- **Tagging**: Po merge do main → tag v1.0.0

---

## 2. Branch Protection Rules

### Main Branch Protection

V GitHub Settings > Branches > Add rule pro `main`:

```yaml
Branch name pattern: main

Protection rules:
☑ Require a pull request before merging
  ☑ Require approvals: 1
  ☑ Dismiss stale pull request approvals when new commits are pushed

☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  Required status checks:
    - ci-backend
    - ci-frontend
    - ci-docker

☑ Require conversation resolution before merging

☑ Do not allow bypassing the above settings

☐ Allow force pushes (DISABLED)
☐ Allow deletions (DISABLED)
```

### Develop Branch Protection

```yaml
Branch name pattern: develop

Protection rules:
☑ Require status checks to pass before merging
  Required status checks:
    - ci-backend
    - ci-frontend

☑ Allow squash merging
☐ Allow merge commits
☐ Allow rebase merging
```

---

## 3. Commit Message Guidelines

### Conventional Commits Format

Používáme [Conventional Commits](https://www.conventionalcommits.org/) pro automatizované changelog a semantic versioning:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | Nová funkce | `feat(backend): add character HP modification endpoint` |
| `fix` | Oprava bugu | `fix(frontend): resolve race selector layout bug` |
| `docs` | Dokumentace | `docs: update API endpoints in README` |
| `style` | Formátování (no logic change) | `style(frontend): fix linting issues` |
| `refactor` | Refactoring kódu | `refactor(backend): extract game logic to service layer` |
| `test` | Přidání testů | `test(backend): add unit tests for AI service` |
| `chore` | Maintenance, dependencies | `chore: update dependencies` |
| `ci` | CI/CD změny | `ci: add GitHub Actions workflow for backend tests` |

### Scope

- `(backend)` - Backend Node.js/Express/Prisma
- `(frontend)` - Frontend Vue 3/TypeScript
- `(docker)` - Docker/docker-compose konfigurace
- `(ci)` - GitHub Actions workflows
- `(docs)` - Dokumentace
- `(db)` - Database schema/migrations

### Commit Message Examples

```bash
# Good commits
feat(backend): implement race selection endpoint with validation
fix(frontend): correct character stats calculation in UI
docs: add Docker setup instructions to README
ci: enable PostgreSQL service in backend workflow
refactor(backend): migrate to Prisma ORM from raw SQL
test(frontend): add unit tests for CharacterSheet component
chore(deps): update @google/generative-ai to v0.21.0

# Breaking change
feat(backend)!: change character creation API response format

BREAKING CHANGE: Response now returns { character: {...} } instead of direct object
```

### Bad Commit Examples

```bash
# Avoid these
fix: stuff
update files
WIP
asdfasdf
minor changes
```

---

## 4. Pull Request Process

### PR Template

Vytvořte soubor `.github/pull_request_template.md`:

```markdown
## Description
<!-- Popište změny v tomto PR -->

## Type of Change
- [ ] feat: New feature
- [ ] fix: Bug fix
- [ ] docs: Documentation update
- [ ] refactor: Code refactoring
- [ ] test: Adding tests
- [ ] chore: Maintenance

## Related Issues
<!-- Closes #123 -->

## Changes Made
-
-

## Testing
<!-- Jak jste otestovali změny? -->
- [ ] Tested locally with `npm run dev`
- [ ] Tested in Docker with `docker-compose up`
- [ ] Added/updated tests
- [ ] All tests passing

## Screenshots (if applicable)


## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Environment variables documented (if new)
```

### Review Checklist

**Pro reviewera:**
- [ ] Kód je čitelný a srozumitelný
- [ ] Commit messages dodržují Conventional Commits
- [ ] Žádné hardcoded credentials nebo API keys
- [ ] TypeScript types jsou správně definované
- [ ] Error handling je implementován
- [ ] Změny neporušují existující funkcionalitu
- [ ] CI checks procházejí (zelená)
- [ ] Dokumentace aktualizována (pokud nutné)

### Merge Strategies

| Source Branch | Target Branch | Strategy | Reasoning |
|---------------|---------------|----------|-----------|
| `feature/*` | `develop` | **Squash Merge** | Čistá historie, 1 commit = 1 feature |
| `release/*` | `main` | **Merge Commit** | Zachování release historie |
| `hotfix/*` | `main` | **Merge Commit** | Trackovatelnost hotfixů |
| `main` | `develop` | **Merge Commit** | Synchronizace zpět do develop |

### Post-Merge Actions

1. **Delete feature branch**: `git branch -d feature/my-feature`
2. **Pull latest develop**: `git checkout develop && git pull`
3. **Verify deployment**: Check CI/CD logs pro úspěšný deploy
4. **Close related issues**: GitHub automatically closes via "Closes #123"

---

## 5. CI/CD Pipeline Overview

### GitHub Actions Workflows

Projekt používá 4 oddělené CI workflows pro modularitu:

#### 1. CI Backend (`ci-backend.yml`)

**Trigger**: Push/PR na `develop`, `main`, změny v `backend/**`

```yaml
Workflow steps:
1. Checkout code
2. Setup Node.js 20.x
3. Install dependencies (npm ci)
4. Run TypeScript type check (tsc --noEmit)
5. Run ESLint (npm run lint)
6. Build backend (npm run build)
7. Run tests (npm test) [planned]
```

**Status check**: `ci-backend` (required pro merge)

#### 2. CI Frontend (`ci-frontend.yml`)

**Trigger**: Push/PR na `develop`, `main`, změny v `frontend/**`

```yaml
Workflow steps:
1. Checkout code
2. Setup Node.js 20.x
3. Install dependencies (npm ci)
4. Run TypeScript type check (vue-tsc --noEmit)
5. Run ESLint (npm run lint)
6. Build frontend (npm run build)
7. Run tests (npm test) [planned]
```

**Status check**: `ci-frontend` (required pro merge)

#### 3. CI Docker (`ci-docker.yml`)

**Trigger**: Push/PR na `develop`, `main`, změny v `docker-compose*.yml`, `Dockerfile`

```yaml
Workflow steps:
1. Checkout code
2. Create .env from secrets
3. Docker Compose build (all services)
4. Docker Compose up -d
5. Wait for health checks (PostgreSQL, backend, frontend)
6. Verify service accessibility
7. Run smoke tests (curl endpoints)
8. Docker Compose down
```

**Status check**: `ci-docker` (required pro main branch)

#### 4. CD Deploy (`cd-deploy.yml`)

**Trigger**: Push na `main` tag `v*.*.*`

```yaml
Workflow steps:
1. Checkout code
2. Build production images
3. Push images to registry (Docker Hub/GHCR)
4. SSH to production VPS
5. Pull latest images
6. Run database migrations
7. Docker Compose up -d (production)
8. Health check verification
9. Rollback on failure
```

**Status**: Optional (pro produkční deployment)

### Required Status Checks

Pro merge do `main`:
- `ci-backend` - MUST pass
- `ci-frontend` - MUST pass
- `ci-docker` - MUST pass

Pro merge do `develop`:
- `ci-backend` - MUST pass
- `ci-frontend` - MUST pass

---

## 6. Environment Management

### Environment Variables Structure

#### Development (`.env`)

```env
# Database
DATABASE_URL="postgresql://dnd:dnd123@localhost:5432/dnd_game"

# Backend
PORT=3000
NODE_ENV=development

# AI Service
GEMINI_API_KEY=your_dev_api_key_here

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

#### Production (`.env.production`)

```env
# Database
DATABASE_URL="postgresql://username:password@db:5432/dnd_game"

# Backend
PORT=3000
NODE_ENV=production

# AI Service
GEMINI_API_KEY=${GEMINI_API_KEY}  # From GitHub Secrets or VPS env

# CORS
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info

# Security
SESSION_SECRET=${SESSION_SECRET}
```

### Environment Variables Documentation

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `PORT` | No | `3000` | Backend server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `GEMINI_API_KEY` | Yes | - | Google Gemini API klíč |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origin |
| `LOG_LEVEL` | No | `info` | Logging level (debug/info/warn/error) |
| `SESSION_SECRET` | Production | - | Secret for session signing |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window |

### GitHub Secrets Management

V GitHub Settings > Secrets and variables > Actions:

```yaml
Required secrets:
- GEMINI_API_KEY          # Google Gemini API key
- DATABASE_URL            # Production database URL
- SESSION_SECRET          # Random secret string
- VPS_SSH_KEY            # SSH key pro deployment (optional)
- DOCKER_USERNAME        # Docker Hub username (optional)
- DOCKER_PASSWORD        # Docker Hub token (optional)
```

**Použití v workflows:**

```yaml
- name: Run tests
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: npm test
```

### .env.example Template

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@host:5432/database"

# Backend Server
PORT=3000
NODE_ENV=development

# Google Gemini AI API
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_api_key_here

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug

# Session (Production only)
# SESSION_SECRET=generate_random_secret_here
```

---

## 7. Docker Development Workflow

### Local Development Setup

**Inicializace projektu:**

```bash
# 1. Clone repository
git clone https://github.com/difikul/dnd-ai-game.git
cd dnd-ai-game

# 2. Setup environment
cp .env.example .env
# Upravte .env a přidejte GEMINI_API_KEY

# 3. Spusťte Docker services
docker-compose up -d

# 4. Inicializace databáze
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed

# 5. Ověření běhu
curl http://localhost:3000/health
curl http://localhost:5173
```

### Hot Reload Configuration

**Backend Hot Reload:**

```yaml
# docker-compose.yml
backend:
  volumes:
    - ./backend:/app
    - /app/node_modules  # Prevent overwrite
  command: npm run dev  # Uses nodemon or tsx --watch
```

**Frontend Hot Reload:**

```yaml
frontend:
  volumes:
    - ./frontend:/app
    - /app/node_modules
  environment:
    - VITE_HMR_HOST=localhost  # Enable HMR
  command: npm run dev -- --host 0.0.0.0
```

### Volume Mounting Strategy

| Path | Type | Purpose |
|------|------|---------|
| `./backend:/app` | Bind Mount | Source code synchronization |
| `/app/node_modules` | Anonymous Volume | Prevent host overwrite |
| `postgres-data:/var/lib/postgresql/data` | Named Volume | Database persistence |
| `./nginx/nginx.conf:/etc/nginx/nginx.conf` | Bind Mount | Nginx config |

### Database Persistence

**Named Volume pro PostgreSQL:**

```yaml
volumes:
  postgres-data:
    driver: local
```

**Backup databáze:**

```bash
# Export database
docker-compose exec db pg_dump -U dnd dnd_game > backup.sql

# Import database
docker-compose exec -T db psql -U dnd dnd_game < backup.sql

# Inspect volume
docker volume inspect dnd_postgres-data
```

### Container Debugging Tips

```bash
# Logs sledování (všechny služby)
docker-compose logs -f

# Logs konkrétní služby
docker-compose logs -f backend

# Vstup do containeru
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec db psql -U dnd -d dnd_game

# Restart služby
docker-compose restart backend

# Rebuild bez cache
docker-compose build --no-cache backend

# Ověření network connectivity
docker-compose exec backend ping db
docker-compose exec frontend ping backend

# Kontrola environment variables
docker-compose exec backend env | grep GEMINI

# Statistiky resource usage
docker stats

# Inspect container details
docker-compose exec backend sh -c "node --version && npm --version"
```

---

## 8. Deployment Strategies

### Development Deployment

**Docker Compose (Local/Dev Server):**

```bash
# Development mode
docker-compose up -d

# Build with latest changes
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (reset DB)
docker-compose down -v
```

### Production VPS Deployment

**Prerequisites:**
- VPS s Docker & Docker Compose nainstalovaným
- Doménové jméno (optional, může být IP)
- SSL certifikát (Let's Encrypt)

**Deployment steps:**

```bash
# 1. Připojení na VPS
ssh user@your-vps-ip

# 2. Clone repository
git clone https://github.com/difikul/dnd-ai-game.git
cd dnd-ai-game

# 3. Setup production environment
cp .env.example .env.production
nano .env.production  # Nastavte produkční hodnoty

# 4. Build a spusťte production stack
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Inicializace databáze
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate

# 6. Ověření
curl http://localhost:3000/health

# 7. Setup Nginx reverse proxy (na VPS hostu)
# nebo použijte Traefik/Caddy pro automatický SSL
```

**Production docker-compose.prod.yml specifika:**

```yaml
services:
  backend:
    restart: unless-stopped
    environment:
      NODE_ENV: production
    # Žádné volume mounts (immutable container)

  frontend:
    restart: unless-stopped
    # Pouze built assets v nginx

  db:
    restart: unless-stopped
    volumes:
      - postgres-data:/var/lib/postgresql/data
    # Pravidelné backupy!
```

### Cloud Deployment Options

#### Railway.app

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add PostgreSQL service
railway add postgresql

# 5. Set environment variables
railway variables set GEMINI_API_KEY=your_key

# 6. Deploy
railway up
```

**Railway config (`railway.json`):**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.prod"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### Render.com

1. Connect GitHub repository
2. Create Web Service (backend) - `backend/Dockerfile`
3. Create Static Site (frontend) - Build command: `npm run build`
4. Create PostgreSQL database
5. Set environment variables
6. Deploy

#### Fly.io

```bash
# 1. Install flyctl
curl -L https://fly.io/install.sh | sh

# 2. Login
flyctl auth login

# 3. Launch app
flyctl launch --dockerfile backend/Dockerfile

# 4. Create PostgreSQL
flyctl postgres create

# 5. Attach database
flyctl postgres attach <postgres-app>

# 6. Set secrets
flyctl secrets set GEMINI_API_KEY=your_key

# 7. Deploy
flyctl deploy
```

### Database Migration Strategy

**Development migrations:**

```bash
# Create new migration
docker-compose exec backend npx prisma migrate dev --name add_character_inventory

# Apply migrations
docker-compose exec backend npx prisma migrate deploy
```

**Production migrations:**

```bash
# PŘED deployment nové verze:
# 1. Backup databáze
docker-compose exec db pg_dump -U dnd dnd_game > backup_$(date +%Y%m%d).sql

# 2. Test migrace lokálně
docker-compose exec backend npx prisma migrate deploy --preview

# 3. Apply v produkci
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 4. Verify
docker-compose -f docker-compose.prod.yml exec backend npx prisma db pull
```

**Rollback strategie:**

```bash
# Restore z backup
docker-compose exec -T db psql -U dnd dnd_game < backup_20250114.sql

# Nebo použijte Prisma migration history
docker-compose exec backend npx prisma migrate resolve --rolled-back <migration_name>
```

---

## 9. Monitoring & Logging

### Application Logging

**Backend (Morgan + Console):**

```typescript
// backend/src/index.ts
import morgan from 'morgan';

// HTTP request logging
app.use(morgan('combined'));

// Custom error logging
app.use((err, req, res, next) => {
  console.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  next(err);
});
```

**Docker logs:**

```bash
# Real-time logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Logs od specifického času
docker-compose logs --since="2025-01-14T10:00:00"

# Export logs do souboru
docker-compose logs backend > backend_logs.txt
```

### Error Tracking (Sentry Integration)

**Setup Sentry:**

```bash
# Install Sentry SDK
npm install @sentry/node @sentry/tracing
```

```typescript
// backend/src/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app })
  ]
});

// Error handler middleware
app.use(Sentry.Handlers.errorHandler());
```

**Environment variable:**

```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Performance Monitoring

**Backend Response Time:**

```typescript
// Middleware pro měření response time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[PERF] ${req.method} ${req.url} - ${duration}ms`);
  });
  next();
});
```

**Database Query Logging:**

```typescript
// prisma/client.ts
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
  ],
});

prisma.$on('query', (e) => {
  console.log(`[DB Query] ${e.query} - ${e.duration}ms`);
});
```

### Health Check Endpoints

**Backend health check:**

```typescript
// backend/src/routes/health.ts
app.get('/health', async (req, res) => {
  try {
    // Database connectivity check
    await prisma.$queryRaw`SELECT 1`;

    // Gemini API check (optional)
    const geminiOk = !!process.env.GEMINI_API_KEY;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        gemini: geminiOk ? 'configured' : 'missing'
      },
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

**Monitoring v produkci:**

```bash
# Uptime monitoring - používejte služby jako:
# - UptimeRobot (free)
# - Pingdom
# - Better Uptime

# Nastavte monitoring na:
GET https://yourdomain.com/health
Interval: 5 minut
Alert při: Status != 200 po 2 po sobě jdoucích checks
```

---

## 10. Security Best Practices

### API Key Management

**NIKDY necommitujte API keys:**

```bash
# .gitignore
.env
.env.local
.env.production
*.key
*.pem
secrets/
```

**Použití environment variables:**

```typescript
// backend/src/config.ts
const config = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set in production');
    }
    return 'dev-secret-unsafe';
  })()
};

if (!config.geminiApiKey) {
  throw new Error('GEMINI_API_KEY is required');
}

export default config;
```

### Rate Limiting

**Gemini API Rate Limit (15 req/min):**

```typescript
// backend/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

// Global API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: 'Too many requests, please try again later'
});

// Gemini endpoint specific limiter
export const geminiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15, // 15 requests per minute (Gemini limit)
  message: 'AI request limit exceeded, please wait',
  skipSuccessfulRequests: false
});

// Usage
app.use('/api', apiLimiter);
app.use('/api/game/action', geminiLimiter);
```

**In-memory request tracking:**

```typescript
// Pro distribuované systémy použijte Redis
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL);

export const geminiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:gemini:'
  }),
  windowMs: 60 * 1000,
  max: 15
});
```

### CORS Configuration

```typescript
// backend/src/index.ts
import cors from 'cors';

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

// Production: strict origin
if (process.env.NODE_ENV === 'production') {
  corsOptions.origin = process.env.CORS_ORIGIN; // Must be set
  if (!corsOptions.origin) {
    throw new Error('CORS_ORIGIN must be set in production');
  }
}

app.use(cors(corsOptions));
```

### Helmet Security Headers

```typescript
// backend/src/index.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Dependency Security

**Dependabot Configuration (`.github/dependabot.yml`):**

```yaml
version: 2
updates:
  # Backend dependencies
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "backend"
    # Auto-merge patch updates
    reviewers:
      - "difikul"

  # Frontend dependencies
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "frontend"

  # Docker base images
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "monthly"
```

**Manual security audit:**

```bash
# Backend audit
cd backend
npm audit
npm audit fix

# Frontend audit
cd frontend
npm audit
npm audit fix

# Check for outdated packages
npm outdated

# Update specific package
npm update <package-name>
```

### Environment-Specific Security

**Development:**
- Debug logs enabled
- CORS: wildcard allowed
- Session secret: can be weak

**Production:**
- Debug logs disabled (LOG_LEVEL=info/warn)
- CORS: strict origin whitelist
- Session secret: strong random string (32+ chars)
- HTTPS only
- Rate limiting enabled
- Helmet security headers
- Input validation & sanitization

**Security checklist před production deployment:**

- [ ] `NODE_ENV=production` nastaveno
- [ ] Všechny secrets v GitHub Secrets / VPS environment
- [ ] CORS restricted na produkční doménu
- [ ] Rate limiting aktivní
- [ ] Helmet middleware enabled
- [ ] Database credentials silné a unikátní
- [ ] SSL/TLS certifikát aktivní
- [ ] Firewall pravidla nastavená (pouze 80/443 otevřené)
- [ ] Regular backupy databáze nastavené
- [ ] Monitoring a alerting aktivní

---

## 11. Testing Strategy

### Backend Testing (Vitest)

**Plánovaná struktura:**

```
backend/
├── src/
│   ├── services/
│   │   ├── aiService.ts
│   │   └── __tests__/
│   │       └── aiService.test.ts
│   ├── routes/
│   │   └── __tests__/
│   │       └── character.test.ts
│   └── utils/
│       └── __tests__/
└── vitest.config.ts
```

**Setup Vitest:**

```bash
cd backend
npm install -D vitest @vitest/ui
```

```typescript
// backend/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/']
    }
  }
});
```

**Example Unit Test:**

```typescript
// backend/src/services/__tests__/aiService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '../aiService';

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
  });

  it('should generate character description', async () => {
    const character = {
      name: 'Thorin',
      race: 'Dwarf',
      class: 'Warrior'
    };

    const description = await aiService.generateCharacterDescription(character);

    expect(description).toBeDefined();
    expect(description).toContain('Thorin');
    expect(description.length).toBeGreaterThan(50);
  });

  it('should handle API errors gracefully', async () => {
    // Mock Gemini API failure
    vi.spyOn(aiService, 'callGeminiAPI').mockRejectedValue(
      new Error('API Error')
    );

    await expect(
      aiService.generateCharacterDescription({ name: 'Test' })
    ).rejects.toThrow('AI service unavailable');
  });
});
```

**Integration Tests:**

```typescript
// backend/src/routes/__tests__/character.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Character API', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$executeRaw`TRUNCATE TABLE "Character" CASCADE`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/characters - creates new character', async () => {
    const response = await request(app)
      .post('/api/characters')
      .send({
        name: 'Aragorn',
        race: 'Human',
        class: 'Ranger'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Aragorn');
  });
});
```

### Frontend Testing (Vue Test Utils + Vitest)

**Setup:**

```bash
cd frontend
npm install -D @vue/test-utils vitest jsdom
```

```typescript
// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts'
  }
});
```

**Component Test Example:**

```typescript
// frontend/src/components/__tests__/CharacterSheet.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CharacterSheet from '../CharacterSheet.vue';

describe('CharacterSheet.vue', () => {
  it('renders character name', () => {
    const wrapper = mount(CharacterSheet, {
      props: {
        character: {
          id: '1',
          name: 'Gandalf',
          class: 'Wizard',
          level: 20
        }
      }
    });

    expect(wrapper.text()).toContain('Gandalf');
    expect(wrapper.find('.character-level').text()).toBe('20');
  });

  it('emits level-up event on button click', async () => {
    const wrapper = mount(CharacterSheet, {
      props: { character: { /* ... */ } }
    });

    await wrapper.find('.level-up-btn').trigger('click');

    expect(wrapper.emitted('level-up')).toBeTruthy();
  });
});
```

### E2E Testing (Playwright)

**Setup:**

```bash
npm init playwright@latest
```

```typescript
// e2e/character-creation.spec.ts
import { test, expect } from '@playwright/test';

test('complete character creation flow', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Step 1: Choose race
  await page.click('text=Human');
  await page.click('text=Next');

  // Step 2: Choose class
  await page.click('text=Warrior');
  await page.click('text=Next');

  // Step 3: Enter name
  await page.fill('input[name="characterName"]', 'Conan');
  await page.click('text=Start Adventure');

  // Verify character created
  await expect(page.locator('.character-name')).toHaveText('Conan');
  await expect(page.locator('.character-class')).toHaveText('Warrior');
});
```

### Integration Tests in Docker

**Test workflow in CI:**

```yaml
# .github/workflows/ci-integration.yml
name: Integration Tests

on:
  pull_request:
    branches: [develop, main]

jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Create .env
        run: |
          echo "DATABASE_URL=postgresql://test:test@db:5432/test_db" > .env
          echo "GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}" >> .env

      - name: Build containers
        run: docker-compose -f docker-compose.test.yml build

      - name: Run integration tests
        run: |
          docker-compose -f docker-compose.test.yml up -d
          docker-compose -f docker-compose.test.yml exec -T backend npm run test:integration
          docker-compose -f docker-compose.test.yml down
```

**Test coverage goals:**

- Unit tests: 70%+ coverage
- Integration tests: Critical user flows
- E2E tests: Main game scenarios (character creation, combat, inventory)

---

## Další Kroky

### Okamžité Akce
1. [ ] Vytvořte `.github/dependabot.yml` pro automatické dependency updates
2. [ ] Nastavte branch protection rules na `main` a `develop`
3. [ ] Vytvořte PR template (`.github/pull_request_template.md`)
4. [ ] Přidejte GitHub Secrets pro CI/CD workflows

### Krátkodobé (1-2 týdny)
1. [ ] Implementujte unit testy pro backend AI service
2. [ ] Nastavte Sentry error tracking
3. [ ] Vytvořte production `docker-compose.prod.yml`
4. [ ] Dokumentujte deployment process v Wiki

### Střednědobé (1 měsíc)
1. [ ] Implementujte Redis pro rate limiting v produkci
2. [ ] Nastavte automatické database backupy
3. [ ] Vytvořte CD pipeline pro automatický deployment
4. [ ] Přidejte E2E testy s Playwright

---

## Užitečné Odkazy

- **GitHub Repository**: https://github.com/difikul/dnd-ai-game
- **Conventional Commits**: https://www.conventionalcommits.org/
- **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/
- **Prisma Deployment**: https://www.prisma.io/docs/guides/deployment
- **Gemini API Docs**: https://ai.google.dev/docs
- **GitHub Actions**: https://docs.github.com/en/actions

---

**Verze dokumentace**: 1.0.0
**Poslední aktualizace**: 2025-01-14
**Autor**: AI DevOps Assistant
