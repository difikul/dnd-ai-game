# E2E Tests - Quick Start Guide

Rychlý návod pro spuštění E2E testů AI Dungeon Master aplikace.

---

## 🚀 Rychlý Start (5 minut)

### **Krok 1: Příprava prostředí**

```bash
# 1. Naklonuj repozitář (pokud ještě není)
cd /home/scoreone/dnd

# 2. Nainstaluj dependencies
cd backend
npm install

cd ../frontend
npm install
```

### **Krok 2: Spusť servery**

Otevři **3 terminály**:

**Terminal 1 - Backend:**
```bash
cd /home/scoreone/dnd/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /home/scoreone/dnd/frontend
npm run dev
```

**Terminal 3 - PostgreSQL (pokud není spuštěný):**
```bash
# Start test database
docker-compose up -d postgres-test
# Nebo použij existující PostgreSQL
```

### **Krok 3: Nastavení environment variables**

```bash
cd /home/scoreone/dnd/backend

# Zkopíruj .env.example
cp tests/e2e/.env.example tests/e2e/.env

# Edituj tests/e2e/.env a přidej:
GEMINI_API_KEY=your_actual_api_key
```

### **Krok 4: Spusť E2E testy**

```bash
cd /home/scoreone/dnd/backend

# Headless mode (bez okna)
npm run test:e2e

# Nebo s UI (doporučeno pro první spuštění)
npm run test:e2e:ui
```

---

## ✅ Checklist před spuštěním

- [ ] Backend běží na `http://localhost:5000`
- [ ] Frontend běží na `http://localhost:5173`
- [ ] PostgreSQL databáze je dostupná
- [ ] `GEMINI_API_KEY` je nastavený v `.env`
- [ ] Playwright je nainstalovaný (`@playwright/test` v package.json)

---

## 🎯 Co očekávat

### **Při prvním spuštění:**
1. Playwright stáhne Chromium browser (~500MB)
2. Testy vytvoří nového test usera
3. Vytvoří Level 3 Wizarda s kouzly
4. Spustí 28 testů (trvá ~15-20 minut)

### **Výstup testu:**
```
Running 28 tests using 1 worker

✓ 1. User Registration (8s)
✓ 2. Login & JWT Token (3s)
✓ 3. Gemini API Key Setup (2s)
✓ 4. Create Wizard Level 3 (5s)
✓ 5. Start New Game Session (6s)
...
✓ 28. Valid Action After Rejections (12s)

28 passed (15m 34s)
```

---

## 🐞 Common Issues

### **Issue 1: "Cannot connect to backend"**
```bash
# Zkontroluj že backend běží
curl http://localhost:5000/api/health

# Pokud ne, spusť:
cd /home/scoreone/dnd/backend
npm run dev
```

### **Issue 2: "Cannot connect to frontend"**
```bash
# Zkontroluj že frontend běží
curl http://localhost:5173

# Pokud ne, spusť:
cd /home/scoreone/dnd/frontend
npm run dev
```

### **Issue 3: "Gemini API error"**
```bash
# Zkontroluj že GEMINI_API_KEY je správně nastavený
echo $GEMINI_API_KEY

# Nebo v .env souboru:
cat /home/scoreone/dnd/backend/.env | grep GEMINI_API_KEY
```

### **Issue 4: "Test timeout"**
- Některé testy trvají dlouho kvůli AI response (až 15s)
- To je normální! Playwright čeká na AI odpověď
- Pokud timeout přetrvává, zvýš limit v `playwright.config.ts`:
  ```typescript
  timeout: 180000 // 3 minuty
  ```

---

## 📊 Test Coverage

Po spuštění testů zobrazíš report:

```bash
npm run test:e2e:report
```

Report obsahuje:
- ✅ Které testy prošly/selhaly
- ⏱️  Časy spuštění jednotlivých testů
- 📸 Screenshots selhání (pokud nějaké)
- 🎥 Videa problematických testů
- 📝 Trace files pro debugging

---

## 🎓 Next Steps

### **Pro vývoj nových testů:**
```bash
# Debug mode (step-by-step)
npm run test:e2e:debug

# Headed mode (vidět browser)
npm run test:e2e:headed

# UI mode (interactive)
npm run test:e2e:ui
```

### **Pro code review:**
1. Otevři `/backend/tests/e2e/ai-dungeon-master.spec.ts`
2. Každý test má komentáře co testuje
3. Helper functions jsou na začátku souboru

### **Pro CI/CD:**
```bash
# Přidej do GitHub Actions:
npm run test:e2e
```

---

## 📚 Dokumentace

- **Kompletní README:** `/backend/tests/e2e/README.md`
- **Playwright Config:** `/backend/playwright.config.ts`
- **Test Soubor:** `/backend/tests/e2e/ai-dungeon-master.spec.ts`

---

## 💡 Tips & Tricks

### **Rychlé debugging:**
```typescript
// V testu přidej:
await page.pause() // Zastaví test, můžeš klikat v browseru

// Nebo screenshoty:
await page.screenshot({ path: 'debug.png', fullPage: true })
```

### **Spustit pouze specifický test:**
```bash
npx playwright test --grep "Long Rest"
```

### **Slow motion mode:**
```bash
SLOW_MO=100 npm run test:e2e:headed
```

---

**Happy Testing! 🧙‍♂️✨**

Pokud narazíš na problém, zkontroluj `/backend/tests/e2e/README.md` nebo issues v repository.
