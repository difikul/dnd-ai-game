# D&D AI Game - Production Quick Start (Apache2)

Rychlý průvodce pro nasazení D&D AI Game na VPS server s Apache2 a Docker.

**Pro detailní instrukce viz [DEPLOYMENT-APACHE.md](./DEPLOYMENT-APACHE.md).**

## 📋 Server Info

- **OS:** Ubuntu
- **Docker:** 27.3.1 ✓
- **Docker Compose:** v2.29.7 ✓
- **Webserver:** Apache2 (porty 80/443) ✓
- **Doména:** dnd.scorvan.it
- **SSL:** Existující certifikáty (/etc/ssl/certs/ssl.pem)

## 🏗️ Architektura

```
┌─────────────────────────────────────────────────┐
│           Apache2 (Ports 80/443)                │
│         SSL: /etc/ssl/certs/ssl.pem             │
│                                                  │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │   Frontend       │  │    Backend       │   │
│  │  localhost:8080  │  │  localhost:3100  │   │
│  │  (Vue + Nginx)   │  │  (Node + API)    │   │
│  └──────────────────┘  └──────────────────┘   │
│           │                      │              │
│           └──────────┬───────────┘              │
│                      │                          │
│              ┌───────▼────────┐                │
│              │   PostgreSQL   │                │
│              │ localhost:5433 │                │
│              │  (Docker DB)   │                │
│              └────────────────┘                │
└─────────────────────────────────────────────────┘

Apache Proxy Rules:
  https://dnd.scorvan.it/     → http://localhost:8080/
  https://dnd.scorvan.it/api  → http://localhost:3100/api
```

## Struktura Souborů

```
dnd-ai-game/
│
├── 📁 backend/
│   ├── Dockerfile              # Development
│   ├── Dockerfile.prod         # Production (multi-stage)
│   ├── .dockerignore
│   └── ...
│
├── 📁 frontend/
│   ├── Dockerfile              # Development
│   ├── Dockerfile.prod         # Production (build + nginx)
│   ├── nginx.conf              # Nginx konfigurace pro frontend
│   ├── nginx-default.conf      # Site konfigurace
│   ├── .dockerignore
│   └── ...
│
├── 📁 nginx/
│   ├── nginx.conf              # Hlavní nginx konfigurace
│   └── conf.d/
│       └── dnd-game.conf       # Site konfigurace s SSL
│
├── 📁 scripts/
│   ├── deploy.sh               # Deployment automation
│   ├── backup.sh               # Database backup/restore
│   └── ssl-setup.sh            # SSL certificate setup
│
├── docker-compose.yml          # Development
├── docker-compose.prod.yml     # Production
├── .env.production.example     # Environment template
│
└── 📄 DEPLOYMENT.md            # Detailní deployment guide
```

## Klíčové Komponenty

### 1. Multi-Stage Dockerfiles

**Backend (`backend/Dockerfile.prod`):**
- Stage 1: Build (TypeScript → JavaScript)
- Stage 2: Production (pouze runtime dependencies)
- Non-root user
- Health checks
- Tini pro správné signal handling

**Frontend (`frontend/Dockerfile.prod`):**
- Stage 1: Build (Vue → static files)
- Stage 2: Nginx serving
- Optimalizovaná konfigurace
- Gzip compression
- Static asset caching

### 2. Nginx Reverse Proxy

**Funkce:**
- SSL termination (Let's Encrypt)
- Routing: Frontend (/) + Backend API (/api)
- WebSocket proxy (/socket.io)
- Rate limiting
- Security headers
- Gzip compression

### 3. Docker Compose Production

**Služby:**
- `database` - PostgreSQL 16 Alpine
- `backend` - Node.js backend (production build)
- `frontend` - Static files s nginx
- `nginx` - Reverse proxy
- `certbot` - SSL certificate management

**Features:**
- Health checks pro všechny služby
- Depends_on s condition
- Persistent volumes
- Automatic restart
- Log rotation

### 4. Automation Scripts

**deploy.sh:**
```bash
./scripts/deploy.sh deploy    # Full deployment
./scripts/deploy.sh build     # Build only
./scripts/deploy.sh restart   # Restart services
./scripts/deploy.sh logs      # View logs
```

**backup.sh:**
```bash
./scripts/backup.sh backup            # Create backup
./scripts/backup.sh restore FILE      # Restore backup
./scripts/backup.sh list              # List backups
./scripts/backup.sh auto              # Automated (for cron)
```

**ssl-setup.sh:**
```bash
DOMAIN=example.com EMAIL=admin@example.com ./scripts/ssl-setup.sh
```

## 🚀 Rychlý Start (4 kroky)

### 1. Environment Variables

```bash
cd /home/scoreone/dnd

# Backend env
cp .env.production.example .env.production
nano .env.production
```

**Vyplňte TYTO hodnoty:**

```bash
# Database
DB_PASSWORD=YOUR_SECURE_PASSWORD

# API Keys
GEMINI_API_KEY=your_gemini_key_here
PEXELS_API_KEY=your_pexels_key_here

# Secrets (vygenerujte nové!)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Ostatní je už předvyplněno pro dnd.scorvan.it
```

```bash
# Zabezpečte soubor
chmod 600 .env.production

# Frontend env (už je správně předvyplněn)
cp frontend/.env.production.example frontend/.env.production
```

### 2. Konfigurace Apache2

```bash
# Aktivujte potřebné moduly
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers ssl

# Zkopírujte VirtualHost config
sudo cp apache-dnd.scorvan.it.conf /etc/apache2/sites-available/subdomains/scorvan.it_dnd.conf

# Aktivujte site
sudo a2ensite subdomains/scorvan.it_dnd.conf

# Test konfigurace
sudo apache2ctl configtest

# Reload Apache
sudo systemctl reload apache2
```

### 3. První Nasazení

```bash
cd /home/scoreone/dnd

# Dejte execute práva skriptu
chmod +x scripts/deploy.sh

# Spusťte deployment
./scripts/deploy.sh deploy
```

**Co se stane:**
1. ✓ Kontrola požadavků
2. ✓ Záloha databáze (pokud existuje)
3. ✓ Build Docker images (5-10 minut)
4. ✓ Spuštění kontejnerů
5. ✓ Prisma migrations
6. ✓ Health check

### 4. Ověření

```bash
# Zkontrolujte běžící kontejnery
docker ps | grep dnd

# Měli byste vidět:
# - dnd-frontend-prod  (8080→8080)
# - dnd-backend-prod   (3100→3000)
# - dnd-database-prod  (5433→5432)

# Test endpointů
curl http://localhost:8080/health  # → OK
curl http://localhost:3100/health  # → {"status":"ok"}
curl https://dnd.scorvan.it/health # → OK (přes Apache)

# Otevřete v prohlížeči
https://dnd.scorvan.it
```

## Environment Variables (Klíčové)

```bash
# Database
DB_USER=dnd_user
DB_PASSWORD=SILNÉ_HESLO           # ← VYPLŇTE!
DB_NAME=dnd_game

# API Keys
GEMINI_API_KEY=your_gemini_key     # ← VYPLŇTE!
PEXELS_API_KEY=your_pexels_key     # ← VYPLŇTE!

# URLs (už předvyplněno pro dnd.scorvan.it)
FRONTEND_URL=https://dnd.scorvan.it
CORS_ORIGIN=https://dnd.scorvan.it
VITE_API_URL=https://dnd.scorvan.it/api
VITE_WS_URL=wss://dnd.scorvan.it

# Security (vygenerujte!)
JWT_SECRET=VYGENEROVANÝ_64_BYTE_HEX         # ← VYGENERUJTE!
ENCRYPTION_KEY=VYGENEROVANÝ_32_BYTE_HEX     # ← VYGENERUJTE!
```

## 🔧 Běžné Příkazy

```bash
cd /home/scoreone/dnd

# Restart všeho
./scripts/deploy.sh restart

# Sledování logů
./scripts/deploy.sh logs

# Zastavení služeb
./scripts/deploy.sh stop

# Update aplikace
git pull origin main
./scripts/deploy.sh deploy

# Záloha databáze
./scripts/deploy.sh backup
```

### Docker Compose Příkazy

```bash
# Status kontejnerů
docker compose -f docker-compose.prod.yml ps

# Live logy
docker compose -f docker-compose.prod.yml logs -f --tail=50

# Konkrétní služba
docker compose -f docker-compose.prod.yml logs -f backend

# Resource usage
docker stats
```

### Database Access

```bash
# PostgreSQL konzole
docker compose -f docker-compose.prod.yml exec database psql -U dnd_user -d dnd_game

# Migrace
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

## 🔒 Bezpečnost Checklist

- [ ] `.env.production` má práva 600 ✓
- [ ] DB_PASSWORD vyplněno a silné
- [ ] GEMINI_API_KEY a PEXELS_API_KEY vyplněny
- [ ] JWT_SECRET (64 bytes) vygenerován
- [ ] ENCRYPTION_KEY (32 bytes) vygenerován
- [ ] Apache SSL certifikáty platné
- [ ] Apache proxy moduly aktivní
- [ ] Automatické zálohy nastaveny (cron)

## 🐛 Troubleshooting

### Kontejner se nespustí

```bash
# Zkontrolujte logy
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend

# Zkontrolujte porty
sudo netstat -tlnp | grep -E ":8080|:3100|:5433"
```

### Apache Proxy Error

```bash
# Apache logy
sudo tail -f /var/log/apache2/dnd-error.log

# Test proxy targets
curl http://localhost:8080/
curl http://localhost:3100/health

# Restart Apache
sudo systemctl restart apache2
```

### Database Connection Error

```bash
# Zkontrolujte DATABASE_URL
cat .env.production | grep DATABASE_URL

# Restart database
docker compose -f docker-compose.prod.yml restart database

# Test připojení
docker compose -f docker-compose.prod.yml exec backend sh
npx prisma db pull
```

### Frontend API Errors

```bash
# Zkontrolujte CORS
cat .env.production | grep CORS_ORIGIN
# Mělo by být: https://dnd.scorvan.it

# Rebuild frontend (env vars jsou baked-in!)
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

## 📊 Monitoring

```bash
# Docker logy
docker compose -f docker-compose.prod.yml logs -f --tail=50

# Apache logy
sudo tail -f /var/log/apache2/dnd-access.log
sudo tail -f /var/log/apache2/dnd-error.log

# Resource usage
docker stats

# Health checks
docker compose -f docker-compose.prod.yml ps
```

## 🔄 Automatické Zálohy

```bash
# Přidejte do crontabu
crontab -e

# Denní záloha ve 2:00
0 2 * * * cd /home/scoreone/dnd && ./scripts/backup.sh auto >> /var/log/dnd-backup.log 2>&1

# Ověření
crontab -l
```

## 📚 Detailní Dokumentace

Pro kompletní instrukce viz: **[DEPLOYMENT-APACHE.md](./DEPLOYMENT-APACHE.md)**

Obsahuje:
- Detailní troubleshooting
- Zálohovací strategie
- Monitoring setup
- Bezpečnostní best practices
- Manuální operace

## 🆘 Quick Fixes

### Port Already in Use

```bash
# Zjistěte, co používá port
sudo lsof -i :8080
sudo lsof -i :3100

# Zastavte Docker služby a restart
./scripts/deploy.sh stop
./scripts/deploy.sh start
```

### Out of Memory

```bash
# Vyčištění Docker cache
docker system prune -f
docker volume prune -f

# Resource usage
free -h
docker stats
```

### Migration Failed

```bash
# Status migrací
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate status

# Spusťte migrace
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

---

**🎲 Úspěšný deployment! 🐉**

**Důležité odkazy:**
- Web: https://dnd.scorvan.it
- Backend health: https://dnd.scorvan.it/api/health
- Logy: `./scripts/deploy.sh logs`
- Detailní dokumentace: [DEPLOYMENT-APACHE.md](./DEPLOYMENT-APACHE.md)
