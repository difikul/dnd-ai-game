# D&D AI Game - Deployment Guide (Apache2 + Docker)

Kompletní průvodce nasazením aplikace D&D AI Game na VPS server s Apache2 a existujícími SSL certifikáty.

## Obsah

1. [Přehled Architektury](#přehled-architektury)
2. [Příprava Serveru](#příprava-serveru)
3. [Konfigurace Environment Variables](#konfigurace-environment-variables)
4. [Konfigurace Apache2](#konfigurace-apache2)
5. [První Nasazení](#první-nasazení)
6. [Správa Aplikace](#správa-aplikace)
7. [Troubleshooting](#troubleshooting)
8. [Zálohování](#zálohování)

---

## Přehled Architektury

### Současný Stav Serveru
- **OS:** Ubuntu
- **Docker:** 27.3.1
- **Docker Compose:** v2.29.7
- **Webserver:** Apache2 (porty 80/443)
- **Doména:** dnd.scorvan.it
- **SSL:** Existující certifikáty v /etc/ssl/certs/ssl.pem a /etc/ssl/private/ssl.key
- **PostgreSQL:** System-wide na portu 5432

### Obsazené Porty
- 80, 443 (Apache2)
- 3000, 3001 (jiné služby)
- 5432 (PostgreSQL)
- 3306 (MySQL)
- 6379 (Redis)

### Docker Setup (Nové Porty)
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

---

## Příprava Serveru

### 1. Ověření Instalace Dockeru

```bash
# Ověření Docker
docker --version
# Mělo by zobrazit: Docker version 27.3.1

# Ověření Docker Compose
docker compose version
# Mělo by zobrazit: Docker Compose version v2.29.7

# Test Docker bez sudo (pokud není v docker skupině)
docker ps

# Pokud dostanete permission denied, přidejte uživatele do docker skupiny:
sudo usermod -aG docker $USER
# Pak se odhlaste a znovu přihlaste
```

### 2. Klonování Projektu

```bash
# SSH na server
ssh user@dnd.scorvan.it

# Přejděte do vhodného adresáře
cd /home/scoreone

# Klonování (pokud ještě není)
# git clone https://github.com/your-repo/dnd.git

# Nebo pull latest změn
cd /home/scoreone/dnd
git pull origin main
```

### 3. Struktura Projektu

```
dnd/
├── backend/
│   ├── Dockerfile.prod           # Backend production Dockerfile
│   ├── .dockerignore
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
├── frontend/
│   ├── Dockerfile.prod           # Frontend production Dockerfile
│   ├── nginx.conf                # Nginx config for SPA
│   ├── nginx-default.conf
│   └── .dockerignore
├── scripts/
│   ├── deploy.sh                 # Deployment script
│   └── backup.sh                 # Backup script
├── docker-compose.prod.yml       # Production compose file
├── apache-dnd.scorvan.it.conf    # Apache VirtualHost config
├── .env.production.example       # Backend env example
└── frontend/.env.production.example  # Frontend env example
```

---

## Konfigurace Environment Variables

### 1. Backend Environment (.env.production)

```bash
cd /home/scoreone/dnd

# Zkopírujte example soubor
cp .env.production.example .env.production

# Editujte soubor
nano .env.production
```

**Vyplňte následující hodnoty:**

```bash
# Database Configuration
DB_USER=dnd_user
DB_PASSWORD=VerySecurePassword123!@#  # ZMĚŇTE!
DB_NAME=dnd_game

# API Keys (VYPLŇTE!)
GEMINI_API_KEY=your_actual_gemini_api_key_here
PEXELS_API_KEY=your_actual_pexels_api_key_here

# Application Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://dnd.scorvan.it
CORS_ORIGIN=https://dnd.scorvan.it

# Authentication (VYGENERUJTE NOVÉ!)
JWT_SECRET=GENERATE_THIS_64_BYTE_HEX
ENCRYPTION_KEY=GENERATE_THIS_32_BYTE_HEX
JWT_EXPIRES_IN=7d

# Frontend Build Variables
VITE_API_URL=https://dnd.scorvan.it/api
VITE_WS_URL=wss://dnd.scorvan.it
```

**Generování bezpečnostních klíčů:**

```bash
# JWT_SECRET (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# ENCRYPTION_KEY (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Zabezpečení souboru:**

```bash
chmod 600 .env.production
ls -la .env.production
# Mělo by zobrazit: -rw------- 1 scoreone scoreone
```

### 2. Frontend Environment (.env.production)

```bash
cd /home/scoreone/dnd/frontend

# Zkopírujte example soubor
cp .env.production.example .env.production

# Obsah by měl být:
cat .env.production
```

```bash
VITE_API_URL=https://dnd.scorvan.it/api
VITE_WS_URL=wss://dnd.scorvan.it
```

⚠️ **DŮLEŽITÉ:** Tyto hodnoty jsou zapečeny do buildu při kompilaci. Změna vyžaduje rebuild frontend image!

---

## Konfigurace Apache2

### 1. Aktivace Potřebných Modulů

```bash
# Aktivujte potřebné Apache moduly
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers ssl

# Restart Apache
sudo systemctl restart apache2
```

### 2. Instalace VirtualHost Konfigurace

```bash
cd /home/scoreone/dnd

# Zkopírujte Apache config
sudo cp apache-dnd.scorvan.it.conf /etc/apache2/sites-available/subdomains/scorvan.it_dnd.conf

# Ověřte konfiguraci
cat /etc/apache2/sites-available/subdomains/scorvan.it_dnd.conf | grep ServerName
# Mělo by zobrazit: ServerName dnd.scorvan.it

# Test Apache konfigurace
sudo apache2ctl configtest
# Mělo by zobrazit: Syntax OK

# Aktivujte site (pokud není)
sudo a2ensite subdomains/scorvan.it_dnd.conf

# Reload Apache
sudo systemctl reload apache2
```

### 3. Ověření Apache Konfigurace

```bash
# Zkontrolujte, že Apache běží
sudo systemctl status apache2

# Zkontrolujte porty
sudo netstat -tlnp | grep apache2
# Mělo by zobrazit porty 80 a 443

# Test proxy modulů
apache2ctl -M | grep proxy
# Mělo by zobrazit: proxy_module, proxy_http_module, proxy_wstunnel_module
```

---

## První Nasazení

### 1. Kontrola Před Deploymentem

```bash
cd /home/scoreone/dnd

# ✓ Ověřte, že .env.production existuje a je vyplněn
cat .env.production | grep -E "DB_PASSWORD|GEMINI_API_KEY|JWT_SECRET"
# Ujistěte se, že nejsou placeholdery!

# ✓ Ověřte frontend env
cat frontend/.env.production

# ✓ Ověřte Apache config
sudo apache2ctl configtest

# ✓ Ověřte, že porty 8080 a 3100 jsou volné
sudo netstat -tlnp | grep -E ":8080|:3100"
# Nemělo by nic zobrazit (porty jsou volné)
```

### 2. První Build a Spuštění

```bash
cd /home/scoreone/dnd

# Dejte scriptu execute práva (pokud potřeba)
chmod +x scripts/deploy.sh

# Spusťte deployment
./scripts/deploy.sh deploy
```

**Co se stane:**
1. ✓ Kontrola požadavků (Docker, Docker Compose, .env.production)
2. ✓ Vytvoření zálohy databáze (pokud existuje)
3. ✓ Build Docker images (může trvat 5-10 minut)
4. ✓ Zastavení starých kontejnerů
5. ✓ Spuštění nových kontejnerů
6. ✓ Spuštění Prisma migrations
7. ✓ Health check (čeká až 60 sekund)

### 3. Ověření Nasazení

```bash
# Zkontrolujte běžící kontejnery
docker ps

# Měli byste vidět 3 kontejnery:
# - dnd-frontend-prod   (port 8080->8080)
# - dnd-backend-prod    (port 3100->3000)
# - dnd-database-prod   (port 5433->5432)

# Zkontrolujte health status
docker compose -f docker-compose.prod.yml ps

# Všechny by měly být "healthy" nebo "Up"

# Zkontrolujte logy
docker compose -f docker-compose.prod.yml logs --tail=50

# Test endpointů
curl http://localhost:8080/health
# Mělo by vrátit: OK

curl http://localhost:3100/health
# Mělo by vrátit: {"status":"ok"}
```

### 4. Test v Prohlížeči

Otevřete v prohlížeči: **https://dnd.scorvan.it**

Měli byste vidět:
- ✓ Úvodní stránku aplikace
- ✓ Platný SSL certifikát (zámek v adresním řádku)
- ✓ Bez chyb v konzoli (F12)

**Pokud vidíte chyby:**
- Zkontrolujte Apache logy: `sudo tail -f /var/log/apache2/dnd-error.log`
- Zkontrolujte Docker logy: `docker compose -f docker-compose.prod.yml logs -f`

---

## Správa Aplikace

### Deployment Script Příkazy

```bash
cd /home/scoreone/dnd

# Kompletní deployment (build + restart + migrate)
./scripts/deploy.sh deploy

# Pouze build images (bez restartu)
./scripts/deploy.sh build

# Spustit služby
./scripts/deploy.sh start

# Zastavit služby
./scripts/deploy.sh stop

# Restartovat služby (bez rebuildu)
./scripts/deploy.sh restart

# Zobrazit logy (live stream)
./scripts/deploy.sh logs

# Spustit pouze migrace
./scripts/deploy.sh migrate

# Vytvořit zálohu databáze
./scripts/deploy.sh backup
```

### Docker Compose Příkazy

```bash
cd /home/scoreone/dnd

# Zobrazit status všech kontejnerů
docker compose -f docker-compose.prod.yml ps

# Zobrazit logy (všechny služby)
docker compose -f docker-compose.prod.yml logs -f

# Zobrazit logy konkrétní služby
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f database

# Restartovat konkrétní službu
docker compose -f docker-compose.prod.yml restart backend

# Vstoupit do běžícího kontejneru
docker compose -f docker-compose.prod.yml exec backend sh
docker compose -f docker-compose.prod.yml exec frontend sh

# Rebuild a restart konkrétní služby
docker compose -f docker-compose.prod.yml up -d --build backend
```

### Databázové Operace

```bash
# Přístup do PostgreSQL
docker compose -f docker-compose.prod.yml exec database psql -U dnd_user -d dnd_game

# V PostgreSQL konzoli:
\dt          # Zobrazit tabulky
\q           # Ukončit

# Spuštění migrací
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Prisma Studio (pouze pro debugging!)
docker compose -f docker-compose.prod.yml exec backend npx prisma studio
# Otevře se na http://localhost:5555
```

### Update Aplikace

```bash
cd /home/scoreone/dnd

# 1. Vytvoření zálohy před updatem
./scripts/deploy.sh backup

# 2. Pull nových změn z gitu
git pull origin main

# 3. Rebuild a restart
./scripts/deploy.sh deploy

# 4. Ověření
docker compose -f docker-compose.prod.yml ps
curl https://dnd.scorvan.it/health
```

---

## Troubleshooting

### Kontejner Se Nespustí

```bash
# 1. Zkontrolujte logy
docker compose -f docker-compose.prod.yml logs SERVICE_NAME

# 2. Zkontrolujte, zda kontejner existuje
docker ps -a | grep dnd

# 3. Zkontrolujte port conflicts
sudo netstat -tlnp | grep -E ":8080|:3100|:5433"

# 4. Restart konkrétní služby s logováním
docker compose -f docker-compose.prod.yml up SERVICE_NAME
```

### Database Connection Error

```bash
# 1. Zkontrolujte, zda database běží
docker compose -f docker-compose.prod.yml ps database

# 2. Zkontrolujte database logy
docker compose -f docker-compose.prod.yml logs database | tail -50

# 3. Ověřte DATABASE_URL v .env.production
cat .env.production | grep DATABASE_URL

# 4. Test připojení z backend kontejneru
docker compose -f docker-compose.prod.yml exec backend sh
# V kontejneru:
npx prisma db pull
```

### Frontend Nezobrazuje Data (CORS/API Errors)

```bash
# 1. Zkontrolujte CORS_ORIGIN v backend .env
cat .env.production | grep CORS_ORIGIN
# Mělo by být: https://dnd.scorvan.it

# 2. Zkontrolujte VITE_API_URL při buildu
cat frontend/.env.production | grep VITE_API_URL
# Mělo by být: https://dnd.scorvan.it/api

# 3. Rebuild frontend s novými env vars
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend

# 4. Test API z command line
curl https://dnd.scorvan.it/api/health

# 5. Zkontrolujte browser console (F12) pro chyby
```

### Apache Proxy Issues

```bash
# 1. Zkontrolujte Apache error log
sudo tail -f /var/log/apache2/dnd-error.log

# 2. Zkontrolujte, že proxy moduly jsou aktivní
apache2ctl -M | grep proxy

# 3. Test Apache konfigurace
sudo apache2ctl configtest

# 4. Restart Apache
sudo systemctl restart apache2

# 5. Test proxy targets
curl http://localhost:8080/health
curl http://localhost:3100/health

# 6. Zkontrolujte Apache access log
sudo tail -f /var/log/apache2/dnd-access.log
```

### Port Already in Use

```bash
# 1. Zjistěte, co používá port
sudo lsof -i :8080
sudo lsof -i :3100

# 2. Zastavte konfliktní proces
sudo kill -9 PID

# 3. Nebo změňte porty v docker-compose.prod.yml
nano docker-compose.prod.yml
# Změňte např.: "8081:8080" místo "8080:8080"
```

### Out of Memory / Disk Space

```bash
# 1. Zkontrolujte memory usage
free -h
docker stats

# 2. Zkontrolujte disk space
df -h
du -sh /home/scoreone/dnd

# 3. Vyčištění Docker cache
docker system prune -f
docker volume prune -f

# 4. Vyčištění starých images
docker image prune -a -f

# 5. Zkontrolujte Docker disk usage
docker system df
```

### SSL Certificate Issues

**Poznámka:** V tomto setupu používáte existující certifikáty spravované Apache2.

```bash
# 1. Zkontrolujte platnost certifikátu
openssl x509 -in /etc/ssl/certs/ssl.pem -noout -dates

# 2. Test SSL connection
openssl s_client -connect dnd.scorvan.it:443 -servername dnd.scorvan.it

# 3. Zkontrolujte Apache SSL config
sudo apache2ctl -S | grep dnd

# 4. Pokud certifikát expiroval, obnovte ho podle vaší běžné procedury
```

### Migration Failed

```bash
# 1. Zkontrolujte migration status
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate status

# 2. Zkontrolujte migration history
docker compose -f docker-compose.prod.yml exec database psql -U dnd_user -d dnd_game -c "SELECT * FROM _prisma_migrations;"

# 3. Mark failed migration as rolled back
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate resolve --rolled-back MIGRATION_NAME

# 4. Spusťte migrace znovu
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 5. Pokud nic nepomůže, reset migrations (⚠️ ZTRÁTA DAT!)
# POUZE PRO DEVELOPMENT/PRVNÍ NASAZENÍ
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate reset
```

---

## Zálohování

### Automatická Záloha

```bash
# Manuální záloha
./scripts/backup.sh backup

# Výpis všech záloh
./scripts/backup.sh list

# Odstranění starých záloh (starší než 30 dní)
./scripts/backup.sh cleanup
```

### Nastavení Automatické Zálohy (Cron)

```bash
# Editace crontabu
crontab -e

# Přidejte následující řádek pro denní zálohu ve 2:00
0 2 * * * cd /home/scoreone/dnd && ./scripts/backup.sh auto >> /var/log/dnd-backup.log 2>&1

# Ověření crontabu
crontab -l
```

### Obnova ze Zálohy

```bash
# 1. Zobrazte dostupné zálohy
./scripts/backup.sh list

# 2. Obnovte z konkrétní zálohy
./scripts/backup.sh restore backups/backup-20250105-020000.sql.gz

# ⚠️ VAROVÁNÍ: Obnova přepíše aktuální databázi!
```

### Manuální Záloha/Obnova

```bash
# Manuální záloha
docker exec dnd-database-prod pg_dump -U dnd_user dnd_game > backup.sql
gzip backup.sql

# Manuální obnova
gunzip backup.sql.gz
cat backup.sql | docker exec -i dnd-database-prod psql -U dnd_user -d dnd_game
```

---

## Monitoring a Logs

### Logy Aplikace

```bash
# Všechny logy (live stream)
docker compose -f docker-compose.prod.yml logs -f

# Logy s timestamps
docker compose -f docker-compose.prod.yml logs -f -t

# Logy konkrétní služby
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend

# Posledních 100 řádků
docker compose -f docker-compose.prod.yml logs --tail=100
```

### Apache Logy

```bash
# Access log
sudo tail -f /var/log/apache2/dnd-access.log

# Error log
sudo tail -f /var/log/apache2/dnd-error.log

# Všechny Apache logy
sudo tail -f /var/log/apache2/*.log
```

### Resource Usage

```bash
# CPU a Memory usage pro všechny kontejnery
docker stats

# Disk usage
docker system df
df -h

# Detailní info o kontejneru
docker inspect dnd-backend-prod
```

### Health Checks

```bash
# Docker health checks
docker compose -f docker-compose.prod.yml ps

# Manuální health checks
curl http://localhost:8080/health
curl http://localhost:3100/health
curl https://dnd.scorvan.it/health
curl https://dnd.scorvan.it/api/health
```

---

## Bezpečnostní Checklist

- [ ] `.env.production` má práva 600
- [ ] Silná hesla pro databázi
- [ ] JWT_SECRET a ENCRYPTION_KEY náhodně vygenerované
- [ ] GEMINI_API_KEY a PEXELS_API_KEY vyplnění
- [ ] Apache SSL certifikáty platné
- [ ] Firewall (UFW) aktivní a správně nakonfigurovaný
- [ ] Pravidelné zálohy nastavené (cron)
- [ ] Docker kontejnery běží jako non-root user
- [ ] CORS správně nakonfigurován

---

## Quick Reference

```bash
# Status služeb
docker compose -f docker-compose.prod.yml ps

# Restart všeho
./scripts/deploy.sh restart

# Sledování logů
docker compose -f docker-compose.prod.yml logs -f --tail=50

# Vstup do backend kontejneru
docker compose -f docker-compose.prod.yml exec backend sh

# Database console
docker compose -f docker-compose.prod.yml exec database psql -U dnd_user -d dnd_game

# Vyčištění Docker cache
docker system prune -f

# Kontrola Apache
sudo systemctl status apache2
sudo apache2ctl configtest
```

---

## Užitečné Příkazy při Troubleshootingu

```bash
# Zkontrolujte všechny běžící procesy na portech
sudo netstat -tlnp | grep LISTEN

# Zkontrolujte Docker networks
docker network ls
docker network inspect dnd-network-prod

# Zkontrolujte Docker volumes
docker volume ls
docker volume inspect dnd-postgres-data-prod

# Restart celého systému (když nic jiného nepomůže)
./scripts/deploy.sh stop
docker system prune -f
./scripts/deploy.sh deploy
```

---

**Přeji úspěšný deployment! 🎲🐉**

Pro další pomoc nebo otázky, zkontrolujte logy a použijte sekci Troubleshooting.
