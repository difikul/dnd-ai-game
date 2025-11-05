# D&D AI Game - Production Deployment Guide

Kompletní průvodce nasazením aplikace D&D AI Game na VPS server s vlastní doménou.

## Obsah

1. [Požadavky](#požadavky)
2. [Příprava VPS Serveru](#příprava-vps-serveru)
3. [Konfigurace DNS](#konfigurace-dns)
4. [Instalace Aplikace](#instalace-aplikace)
5. [Konfigurace Environment Variables](#konfigurace-environment-variables)
6. [SSL Certifikáty (Let's Encrypt)](#ssl-certifikáty-lets-encrypt)
7. [První Nasazení](#první-nasazení)
8. [Správa Aplikace](#správa-aplikace)
9. [Zálohování a Obnova](#zálohování-a-obnova)
10. [Monitoring a Logs](#monitoring-a-logs)
11. [Troubleshooting](#troubleshooting)
12. [Bezpečnost](#bezpečnost)

---

## Požadavky

### VPS Server
- **OS:** Ubuntu 22.04 LTS (nebo novější)
- **RAM:** Minimálně 2 GB (doporučeno 4 GB)
- **Storage:** Minimálně 20 GB SSD
- **CPU:** 2 cores (doporučeno)
- **Bandwidth:** Neomezený nebo alespoň 1 TB/měsíc

### Software
- Docker Engine 24.0+
- Docker Compose 2.20+
- Git
- Nginx (volitelně, pokud používáte host nginx místo Docker nginx)

### Doména
- Vlastní doména s možností upravovat DNS záznamy
- Email pro Let's Encrypt notifikace

### API Klíče
- Google Gemini API klíč
- Pexels API klíč

---

## Příprava VPS Serveru

### 1. Aktualizace Systému

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalace Dockeru

```bash
# Instalace předpokladů
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Přidání Docker GPG klíče
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Přidání Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalace Dockeru
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Přidání uživatele do docker skupiny
sudo usermod -aG docker $USER

# Aktivace změn (nebo se odhlaste a znovu přihlaste)
newgrp docker
```

### 3. Instalace Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Nastavení práv
sudo chmod +x /usr/local/bin/docker-compose

# Ověření instalace
docker-compose --version
```

### 4. Instalace Gitu

```bash
sudo apt install -y git
```

### 5. Konfigurace Firewallu

```bash
# Instalace UFW (pokud není nainstalován)
sudo apt install -y ufw

# Povolit SSH (DŮLEŽITÉ - nepřijdete o přístup!)
sudo ufw allow 22/tcp

# Povolit HTTP a HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Aktivovat firewall
sudo ufw enable

# Kontrola stavu
sudo ufw status
```

---

## Konfigurace DNS

Před nasazením aplikace nastavte DNS záznamy pro vaši doménu:

### A Records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `VPS_IP_ADRESA` | 3600 |
| A | www | `VPS_IP_ADRESA` | 3600 |

### Ověření DNS

Po nastavení DNS počkejte 5-30 minut na propagaci a ověřte:

```bash
# Ověření DNS záznamu
dig example.com +short
dig www.example.com +short

# Nebo pomocí nslookup
nslookup example.com
nslookup www.example.com
```

Obě doména a www subdoména by měly vracet IP adresu vašeho VPS.

---

## Instalace Aplikace

### 1. Klonování Repositáře

```bash
# Přejděte do domovského adresáře
cd ~

# Klonujte repositář
git clone https://github.com/your-username/dnd-ai-game.git

# Přejděte do adresáře projektu
cd dnd-ai-game
```

### 2. Struktura Projektu

Po klonování by struktura měla vypadat takto:

```
dnd-ai-game/
├── backend/
│   ├── Dockerfile.prod
│   ├── .dockerignore
│   └── ...
├── frontend/
│   ├── Dockerfile.prod
│   ├── nginx.conf
│   ├── nginx-default.conf
│   ├── .dockerignore
│   └── ...
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       └── dnd-game.conf
├── scripts/
│   ├── deploy.sh
│   ├── backup.sh
│   └── ssl-setup.sh
├── docker-compose.prod.yml
└── .env.production.example
```

---

## Konfigurace Environment Variables

### 1. Vytvoření .env.production Souboru

```bash
# Zkopírujte example soubor
cp .env.production.example .env.production

# Editujte soubor
nano .env.production
```

### 2. Vyplnění Hodnot

**⚠️ DŮLEŽITÉ:** Nahraďte všechny placeholder hodnoty reálnými daty!

```bash
# Database Configuration
DB_USER=dnd_user
DB_PASSWORD=VerySecurePassword123!@#
DB_NAME=dnd_game

# API Keys
GEMINI_API_KEY=your_actual_gemini_api_key_here
PEXELS_API_KEY=your_actual_pexels_api_key_here

# App Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://example.com  # Vaše doména!
CORS_ORIGIN=https://example.com   # Vaše doména!

# Authentication (vygenerujte nové klíče!)
JWT_SECRET=VYGENEROVANÝ_64_BYTE_HEX_STRING
ENCRYPTION_KEY=VYGENEROVANÝ_32_BYTE_HEX_STRING
JWT_EXPIRES_IN=7d

# Frontend Build Variables
VITE_API_URL=https://example.com/api    # Vaše doména!
VITE_WS_URL=wss://example.com           # Vaše doména!
```

### 3. Generování Bezpečnostních Klíčů

```bash
# Generování JWT_SECRET (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generování ENCRYPTION_KEY (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Zkopírujte vygenerované hodnoty do `.env.production`.

### 4. Zabezpečení .env Souboru

```bash
# Nastavení přísných práv (pouze vlastník může číst/psát)
chmod 600 .env.production

# Ověření
ls -la .env.production
# Mělo by zobrazit: -rw------- 1 user user ...
```

---

## SSL Certifikáty (Let's Encrypt)

### Metoda 1: Automatický Setup (Doporučeno)

```bash
# Spusťte SSL setup script
DOMAIN=example.com EMAIL=admin@example.com ./scripts/ssl-setup.sh
```

Script automaticky:
- Vytvoří potřebné adresáře
- Aktualizuje nginx konfiguraci s vaší doménou
- Získá SSL certifikáty od Let's Encrypt
- Nastaví automatické obnovování certifikátů

### Metoda 2: Manuální Setup

#### Krok 1: Aktualizace Nginx Konfigurace

```bash
# Editujte nginx konfiguraci
nano nginx/conf.d/dnd-game.conf

# Nahraďte všechny výskyty 'example.com' vaší doménou
:%s/example.com/vase-domena.cz/g
```

#### Krok 2: Vytvoření Adresářů

```bash
mkdir -p certbot/conf certbot/www certbot/logs
```

#### Krok 3: Získání Certifikátů

```bash
# Spusťte pouze nginx a database kontejnery
docker-compose -f docker-compose.prod.yml up -d database

# Získání certifikátu
docker run -it --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  --email admin@vase-domena.cz \
  --agree-tos \
  --no-eff-email \
  -d vase-domena.cz \
  -d www.vase-domena.cz
```

#### Krok 4: Automatické Obnovování

```bash
# Přidejte cron job pro obnovování certifikátů
crontab -e

# Přidejte následující řádek:
0 0,12 * * * cd /home/your-user/dnd-ai-game && docker-compose -f docker-compose.prod.yml run --rm certbot renew --quiet && docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## První Nasazení

### 1. Kontrola Konfigurace

```bash
# Ověřte, že .env.production existuje a obsahuje správné hodnoty
cat .env.production

# Ověřte nginx konfiguraci
cat nginx/conf.d/dnd-game.conf | grep server_name
```

### 2. Build a Spuštění

```bash
# Použijte deployment script
./scripts/deploy.sh deploy
```

Tento příkaz provede:
1. Kontrolu požadavků
2. Vytvoření zálohy databáze (pokud existuje)
3. Build Docker images
4. Zastavení starých kontejnerů
5. Spuštění nových kontejnerů
6. Spuštění databázových migrací
7. Health check

### 3. Ověření Nasazení

```bash
# Zkontrolujte běžící kontejnery
docker ps

# Měli byste vidět:
# - dnd-database-prod
# - dnd-backend-prod
# - dnd-frontend-prod
# - dnd-nginx-prod
# - dnd-certbot

# Zkontrolujte logy
docker-compose -f docker-compose.prod.yml logs -f

# Zkontrolujte health status
docker-compose -f docker-compose.prod.yml ps
```

### 4. Test v Prohlížeči

Otevřete v prohlížeči: `https://vase-domena.cz`

Měli byste vidět úvodní stránku aplikace s platným SSL certifikátem.

---

## Správa Aplikace

### Deployment Script Příkazy

```bash
# Kompletní deployment (build + restart + migrate)
./scripts/deploy.sh deploy

# Pouze build images
./scripts/deploy.sh build

# Spustit služby
./scripts/deploy.sh start

# Zastavit služby
./scripts/deploy.sh stop

# Restartovat služby
./scripts/deploy.sh restart

# Zobrazit logy
./scripts/deploy.sh logs

# Spustit migrace
./scripts/deploy.sh migrate

# Vytvořit zálohu
./scripts/deploy.sh backup
```

### Docker Compose Příkazy

```bash
# Zobrazit status kontejnerů
docker-compose -f docker-compose.prod.yml ps

# Zobrazit logy (všechny služby)
docker-compose -f docker-compose.prod.yml logs -f

# Zobrazit logy konkrétní služby
docker-compose -f docker-compose.prod.yml logs -f backend

# Restartovat konkrétní službu
docker-compose -f docker-compose.prod.yml restart backend

# Spustit příkaz v běžícím kontejneru
docker-compose -f docker-compose.prod.yml exec backend sh

# Rebuild a restart konkrétní služby
docker-compose -f docker-compose.prod.yml up -d --build backend
```

### Databázové Operace

```bash
# Přístup do PostgreSQL
docker-compose -f docker-compose.prod.yml exec database psql -U dnd_user -d dnd_game

# Spuštění migrací
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Prisma Studio (pouze pro development!)
docker-compose -f docker-compose.prod.yml exec backend npx prisma studio
```

---

## Zálohování a Obnova

### Automatické Zálohování

#### 1. Manuální Záloha

```bash
# Vytvoření zálohy
./scripts/backup.sh backup

# Výpis všech záloh
./scripts/backup.sh list

# Odstranění starých záloh (starší než 30 dní)
./scripts/backup.sh cleanup
```

#### 2. Automatická Záloha (Cron)

```bash
# Editace crontabu
crontab -e

# Přidejte následující řádek pro denní zálohu ve 2:00
0 2 * * * cd /home/your-user/dnd-ai-game && ./scripts/backup.sh auto >> /var/log/dnd-backup.log 2>&1
```

### Obnova ze Zálohy

```bash
# 1. Zobrazte dostupné zálohy
./scripts/backup.sh list

# 2. Obnovte z konkrétní zálohy
./scripts/backup.sh restore backups/dnd-backup-20240101-120000.sql.gz
```

**⚠️ VAROVÁNÍ:** Obnova přepíše aktuální databázi!

### Manuální Záloha/Obnova

```bash
# Manuální záloha
docker exec dnd-database-prod pg_dump -U dnd_user -d dnd_game > backup.sql

# Manuální obnova
cat backup.sql | docker exec -i dnd-database-prod psql -U dnd_user -d dnd_game
```

---

## Monitoring a Logs

### Logy Aplikace

```bash
# Všechny logy (live stream)
docker-compose -f docker-compose.prod.yml logs -f

# Logy z posledních 100 řádků
docker-compose -f docker-compose.prod.yml logs --tail=100

# Logy konkrétní služby
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx

# Logy s timestamps
docker-compose -f docker-compose.prod.yml logs -f -t
```

### Nginx Logy

```bash
# Access log
tail -f logs/nginx/access.log

# Error log
tail -f logs/nginx/error.log

# Specifické pro D&D game
tail -f logs/nginx/dnd-game-access.log
tail -f logs/nginx/dnd-game-error.log
```

### Resource Usage

```bash
# CPU a Memory usage pro všechny kontejnery
docker stats

# Disk usage
docker system df

# Podrobné info o kontejneru
docker inspect dnd-backend-prod
```

### Health Checks

```bash
# Zkontrolujte health status
docker-compose -f docker-compose.prod.yml ps

# Manuální health check
curl http://localhost/api/health
```

---

## Troubleshooting

### Kontejner Se Nespustí

```bash
# 1. Zkontrolujte logy
docker-compose -f docker-compose.prod.yml logs SERVICE_NAME

# 2. Zkontrolujte, zda kontejner běžel
docker ps -a

# 3. Pokuste se spustit manuálně pro debugging
docker-compose -f docker-compose.prod.yml up SERVICE_NAME
```

### Database Connection Error

```bash
# 1. Zkontrolujte, zda database běží
docker-compose -f docker-compose.prod.yml ps database

# 2. Zkontrolujte database logy
docker-compose -f docker-compose.prod.yml logs database

# 3. Ověřte DATABASE_URL v .env.production

# 4. Test připojení
docker-compose -f docker-compose.prod.yml exec backend sh
# V kontejneru:
npx prisma db pull
```

### Frontend Nezobrazuje Data

```bash
# 1. Zkontrolujte VITE_API_URL v .env.production
cat .env.production | grep VITE_API_URL

# 2. Rebuild frontend s novými environment variables
docker-compose -f docker-compose.prod.yml build --no-cache frontend
docker-compose -f docker-compose.prod.yml up -d frontend

# 3. Zkontrolujte browser console pro chyby
```

### SSL Certificate Issues

```bash
# 1. Ověřte, že DNS je správně nastaveno
dig example.com +short

# 2. Zkontrolujte certbot logy
cat certbot/logs/letsencrypt.log

# 3. Manuálně obnovte certifikát
docker-compose -f docker-compose.prod.yml run --rm certbot renew --force-renewal

# 4. Restartujte nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Port Already in Use

```bash
# 1. Zjistěte, co používá port
sudo lsof -i :80
sudo lsof -i :443

# 2. Zastavte konfliktní službu
sudo systemctl stop apache2  # nebo jiná služba
sudo systemctl disable apache2

# 3. Nebo změňte porty v docker-compose.prod.yml
```

### Out of Memory

```bash
# 1. Zkontrolujte memory usage
free -h
docker stats

# 2. Zvětšete swap (pokud nemáte)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 3. Přidejte do /etc/fstab pro persistence
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Prisma Migration Failed

```bash
# 1. Zkontrolujte migration status
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate status

# 2. Reset migrations (ZTRÁTA DAT!)
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate reset

# 3. Nebo resolve conflicts
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate resolve --applied MIGRATION_NAME
```

---

## Bezpečnost

### Základní Security Checklist

- [ ] SSH klíče místo hesel pro přístup na VPS
- [ ] Změněné výchozí SSH port (22 → 2222)
- [ ] Firewall (UFW) aktivní
- [ ] Fail2ban nainstalován a konfigurován
- [ ] `.env.production` má práva 600
- [ ] Silná hesla pro databázi
- [ ] JWT_SECRET a ENCRYPTION_KEY náhodně vygenerované
- [ ] SSL certifikáty platné a auto-renew funkční
- [ ] Pravidelné zálohy nastavené
- [ ] Docker kontejnery běží jako non-root user
- [ ] Rate limiting aktivní v nginx

### Dodatečná Bezpečnostní Opatření

#### 1. Změna SSH Portu

```bash
sudo nano /etc/ssh/sshd_config
# Změňte: Port 22 → Port 2222
sudo systemctl restart sshd

# Nezapomeňte povolit nový port v firewallu!
sudo ufw allow 2222/tcp
sudo ufw delete allow 22/tcp
```

#### 2. Instalace Fail2ban

```bash
sudo apt install -y fail2ban

# Vytvoření lokální konfigurace
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Editace konfigurace
sudo nano /etc/fail2ban/jail.local
# Aktivujte: [sshd], [nginx-http-auth], [nginx-limit-req]

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

#### 3. Automatické Security Updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

#### 4. Docker Socket Security

```bash
# Nikdy nevystavujte Docker socket na internetu!
# Pokud používáte Docker API, používejte TLS

# Ověřte, že Docker socket není exponován
docker ps | grep "0.0.0.0:2375"
# Pokud najdete výsledky, OKAMŽITĚ to zakažte!
```

### Monitoring Bezpečnosti

```bash
# Zkontrolujte failed login attempts
sudo tail -f /var/log/auth.log

# Zkontrolujte fail2ban status
sudo fail2ban-client status

# Zkontrolujte otevřené porty
sudo netstat -tulpn | grep LISTEN

# Zkontrolujte běžící procesy
ps aux | grep -E 'docker|nginx'
```

---

## Update Aplikace

### Zero-Downtime Update

```bash
# 1. Vytvoření zálohy
./scripts/backup.sh backup

# 2. Pull nových změn z gitu
git pull origin main

# 3. Rebuild a restart
./scripts/deploy.sh deploy

# 4. Ověření
docker-compose -f docker-compose.prod.yml ps
```

### Rollback

```bash
# 1. Vraťte git do předchozí verze
git log --oneline  # Najděte commit hash
git checkout COMMIT_HASH

# 2. Rebuild a restart
./scripts/deploy.sh deploy

# 3. Případně obnovte databázi
./scripts/backup.sh list
./scripts/backup.sh restore backups/BACKUP_FILE.sql.gz
```

---

## Užitečné Příkazy

### Rychlá Reference

```bash
# Status všech služeb
docker-compose -f docker-compose.prod.yml ps

# Restart všeho
docker-compose -f docker-compose.prod.yml restart

# Sledování logů
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# Vstup do backend kontejneru
docker-compose -f docker-compose.prod.yml exec backend sh

# Databázová konzole
docker-compose -f docker-compose.prod.yml exec database psql -U dnd_user -d dnd_game

# Disk usage
docker system df
du -sh *

# Vyčištění nepoužívaných Docker resources
docker system prune -a --volumes  # POZOR: Smaže vše nepoužívané!
```

---

## Podpora

### Kontakty
- **GitHub Issues:** [github.com/your-username/dnd-ai-game/issues](https://github.com/your-username/dnd-ai-game/issues)
- **Email:** admin@example.com

### Užitečné Odkazy
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

## Changelog

### Version 1.0.0 (2024-01-15)
- První produkční release
- Multi-stage Docker builds
- Nginx reverse proxy
- Let's Encrypt SSL
- Automatické zálohy
- Health checks
- Logging infrastructure

---

**Přeji úspěšný deployment! 🎲🐉**
