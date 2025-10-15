# GitHub Actions Workflows - D&D AI Game

Tento adresář obsahuje GitHub Actions workflows pro CI/CD pipeline projektu D&D AI Game.

## Přehled Workflows

### 1. Backend CI (`ci-backend.yml`)

**Účel:** Automatická validace backend kódu při každém push/PR

**Spouští se při:**
- Push do `main` nebo `develop` větve (pouze při změnách v `backend/`)
- Pull Request do `main` nebo `develop` (pouze při změnách v `backend/`)

**Jobs:**
- **type-check:** Kontrola TypeScript typů (`tsc --noEmit`)
- **lint:** ESLint kontrola kvality kódu
- **build:** Kompilace TypeScript do JavaScript
- **prisma-validate:** Validace Prisma schématu

**Technologie:**
- Node.js 20.x
- npm ci (cache optimalizovaný)
- Prisma Client generation

---

### 2. Frontend CI (`ci-frontend.yml`)

**Účel:** Automatická validace frontend kódu při každém push/PR

**Spouští se při:**
- Push do `main` nebo `develop` větve (pouze při změnách v `frontend/`)
- Pull Request do `main` nebo `develop` (pouze při změnách v `frontend/`)

**Jobs:**
- **type-check:** Kontrola Vue + TypeScript typů (`vue-tsc --noEmit`)
- **lint:** ESLint kontrola kvality kódu
- **build:** Vite production build s optimalizacemi

**Technologie:**
- Node.js 20.x
- npm ci (cache optimalizovaný)
- Vite build system
- Upload build artifacts (7 dní retention)

---

### 3. Docker Build CI (`ci-docker.yml`)

**Účel:** Testování Docker builds a ověření konfigurace

**Spouští se při:**
- Push do `main` nebo `develop` (změny v `backend/`, `frontend/`, `docker-compose.yml`)
- Pull Request do `main` nebo `develop` (stejné podmínky)

**Jobs:**

#### docker-build
- Build backend Docker image
- Build frontend Docker image
- Docker Compose build test
- Ověření velikosti images

#### docker-security-scan
- Trivy security scan pro backend image
- Trivy security scan pro frontend image
- Detekce CRITICAL a HIGH vulnerabilities

**Poznámky:**
- Používá dummy `.env` hodnoty pro build test
- Health check job je zakomentován (vyžaduje platný `GEMINI_API_KEY`)
- Pro plný integrační test přidej `GEMINI_API_KEY` do GitHub Secrets

---

### 4. Deploy to Production (`cd-deploy.yml`)

**Účel:** Automatický deployment do produkce (připravený template)

**Spouští se při:**
- Push do `main` větve
- Manuální trigger (`workflow_dispatch`)

**Jobs:**

#### build-and-push
- Build Docker images s multi-stage optimalizací
- Push do GitHub Container Registry (`ghcr.io`)
- Semantic versioning tags (branch, SHA, semver, latest)
- Docker cache optimization

#### deploy (zakomentováno - template)
- SSH připojení na VPS
- Pull latest images
- Spuštění Prisma migrations
- Zero-downtime restart services
- Health check verification
- Automatický rollback při selhání

**Potřebné GitHub Secrets:**

```bash
# Automaticky dostupné
GITHUB_TOKEN

# Pro frontend build
VITE_API_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com

# Pro VPS deployment (zakomentováno)
VPS_HOST=your-vps-ip-or-domain
VPS_USER=deploy-user
VPS_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...

# Volitelně pro Docker Hub (místo GitHub Container Registry)
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-token
```

---

## Konfigurace Secrets

### Jak přidat secrets do GitHub repository:

1. Otevři repository na GitHub
2. Klikni na **Settings** → **Secrets and variables** → **Actions**
3. Klikni **New repository secret**
4. Přidej následující secrets:

```
VITE_API_URL = https://api.your-domain.com
VITE_WS_URL = wss://api.your-domain.com
GEMINI_API_KEY = your-gemini-api-key (pro health check test)
```

Pro deployment přidej také:
```
VPS_HOST = 123.45.67.89
VPS_USER = deploy
VPS_SSH_KEY = <private SSH key>
```

---

## Aktivace Deployment

Pro aktivaci automatického deploymentu:

### 1. Příprava VPS

```bash
# SSH na VPS
ssh your-user@your-vps

# Instalace Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalace Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Přidání uživatele do docker group
sudo usermod -aG docker $USER

# Vytvoření adresáře pro aplikaci
mkdir -p ~/dnd-ai
cd ~/dnd-ai

# Vytvoření .env souboru
cat > .env << EOF
DB_USER=production_user
DB_PASSWORD=strong_production_password
DB_NAME=dnd_production
GEMINI_API_KEY=your-real-gemini-api-key
NODE_ENV=production
EOF

# Nastavení oprávnění
chmod 600 .env
```

### 2. SSH klíče

```bash
# Na lokálním počítači - generování SSH klíče
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/dnd-deploy

# Zkopírování public key na VPS
ssh-copy-id -i ~/.ssh/dnd-deploy.pub your-user@your-vps

# Přidání private key do GitHub Secrets
cat ~/.ssh/dnd-deploy
# Zkopíruj celý obsah (včetně BEGIN/END řádků) do VPS_SSH_KEY secret
```

### 3. Aktivace v cd-deploy.yml

Odkomentuj deploy job v souboru `.github/workflows/cd-deploy.yml`:

```yaml
deploy:
  name: Deploy to VPS
  runs-on: ubuntu-latest
  needs: build-and-push
  # ... zbytek konfigurace
```

### 4. GitHub Environment Protection

1. Jdi do **Settings** → **Environments**
2. Vytvoř environment "production"
3. Nastav protection rules:
   - Required reviewers (doporučeno)
   - Wait timer (volitelné)
   - Deployment branches: main only

---

## Monitorování Workflows

### Zobrazení workflow runs

```bash
# Pomocí GitHub CLI (gh)
gh workflow list
gh workflow view "Backend CI"
gh run list --workflow="Backend CI"
gh run watch
```

### Lokální testování workflows

```bash
# Instalace act (lokální GitHub Actions runner)
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Spuštění workflow lokálně
act -W .github/workflows/ci-backend.yml

# Spuštění s secrets
act -W .github/workflows/ci-backend.yml -s GEMINI_API_KEY=your-key
```

---

## Best Practices

### 1. Závislosti mezi workflows
- Backend CI běží nezávisle
- Frontend CI běží nezávisle
- Docker CI čeká na úspěšné backend/frontend changes
- Deploy čeká na všechny CI checks

### 2. Caching strategie
- npm dependencies jsou cachovány pomocí `actions/cache`
- Docker layer cache pro rychlejší builds
- Artifacts jsou uchovávány 7 dní

### 3. Error handling
- Každý job má jasně definované failure podmínky
- Docker deployment má automatický rollback
- Health checks před potvrzením deploymentu

### 4. Security
- Sensitive data pouze v GitHub Secrets
- Docker security scanning pomocí Trivy
- SSH keys s omezenými oprávněními
- Environment protection rules

---

## Troubleshooting

### Backend CI selhává na type-check

```bash
# Lokálně otestuj
cd backend
npm run type-check

# Zkontroluj Prisma generaci
npx prisma generate
```

### Frontend build fails

```bash
# Zkontroluj environment variables
cd frontend
npm run build

# Zkontroluj node_modules
rm -rf node_modules package-lock.json
npm install
```

### Docker build fails

```bash
# Lokálně otestuj Docker build
docker build -t test-backend backend/
docker build -t test-frontend frontend/

# Zkontroluj .dockerignore
cat backend/.dockerignore
cat frontend/.dockerignore
```

### Deployment SSH connection fails

```bash
# Test SSH connection
ssh -i ~/.ssh/dnd-deploy your-user@your-vps

# Zkontroluj known_hosts
ssh-keyscan -H your-vps-ip >> ~/.ssh/known_hosts
```

---

## Další Kroky

1. **Přidání testů:**
   - Unit testy (Jest/Vitest)
   - E2E testy (Playwright/Cypress)
   - API integration testy

2. **Code coverage:**
   - Integrace Codecov
   - Coverage reports v PR comments

3. **Performance monitoring:**
   - Lighthouse CI pro frontend
   - Bundle size tracking

4. **Notification:**
   - Slack/Discord notifikace
   - Email alerts při selhání deploymentu

---

## Status Badges

Přidej do hlavního README.md:

```markdown
![Backend CI](https://github.com/your-username/dnd-ai-game/workflows/Backend%20CI/badge.svg)
![Frontend CI](https://github.com/your-username/dnd-ai-game/workflows/Frontend%20CI/badge.svg)
![Docker Build CI](https://github.com/your-username/dnd-ai-game/workflows/Docker%20Build%20CI/badge.svg)
```

---

## Kontakt a Podpora

Pro otázky a problémy otevři issue v repository nebo kontaktuj tým DevOps.
