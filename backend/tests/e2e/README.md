# E2E Tests - AI Dungeon Master

Kompletní end-to-end testy pro D&D AI aplikaci pomocí Playwright.

## Testy

### 1. `ai-dungeon-master.spec.ts`
Komplexní testovací suite s 28 testy pokrývajícími všechny aspekty aplikace:
- Setup & Auth (3 testy)
- Character Management (1 test)
- Game Session (3 testy)
- Basic Interaction (4 testy)
- Spell Casting (5 testů)
- Combat & HP (5 testů)
- Long Rest (3 testy)
- Edge Cases (4 testy)

**Čas běhu:** ~30-40 minut

### 2. `game-flow-simple.spec.ts` ⭐ RYCHLÝ TEST
Zjednodušený test kompletního herního flow v jednom testu:
- Login s existujícím účtem
- Vytvoření Wizard Level 3 postavy
- Start hry
- 15 herních akcí s ověřením mechanik

**Čas běhu:** ~12-15 minut

**Testované mechaniky:**
- ✅ Exploration a dialog
- ✅ Edge cases (moderní technologie, absurdní requesty)
- ✅ Combat a HP management
- ✅ Spell casting (cantrips vs leveled spells)
- ✅ Spell slot consumption
- ✅ Healing
- ✅ Long Rest (obnovení HP + spell slots)

## Požadavky

1. **Backend běží na** `http://localhost:3000`
2. **Frontend běží na** `http://localhost:5173`
3. **PostgreSQL databáze** je dostupná
4. **Gemini API key** je konfigurován (pro AI odpovědi)

## Spuštění testů

### Spustit všechny E2E testy
```bash
cd backend
npm run test:e2e
```

### Spustit pouze rychlý test (game-flow-simple)
```bash
cd backend
npx playwright test game-flow-simple
```

### Spustit všechny E2E testy v UI mode (debugging)
```bash
cd backend
npx playwright test --ui
```

### Spustit konkrétní test suite
```bash
cd backend
npx playwright test ai-dungeon-master
```

### Spustit s slow motion (debugging)
```bash
cd backend
SLOW_MO=1 npx playwright test game-flow-simple
```

## Výstupy

### Screenshots
Screenshots při selhání nebo na konci testu jsou uloženy v:
```
backend/tests/e2e/screenshots/
```

### HTML Report
Po dokončení testů je vygenerován HTML report:
```bash
npx playwright show-report
```

### Video záznamy
Videa z testů (pouze při selhání) jsou v:
```
backend/test-results/
```

## Testovací účet

Pro `game-flow-simple.spec.ts` se používá existující testovací účet:

```
Email: aitest2@dnd.test
Password: testpass123
```

Pokud účet neexistuje, test ho automaticky vytvoří.

## Debugging

### Konzolové logy
Test vypisuje detailní progress do konzole:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 Complete Game Flow Test - AI DM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 PHASE 1: Login
━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Login successful
  ✅ User ID: xxx-xxx-xxx

🧙 PHASE 2: Create Character (Wizard Level 3)
━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Character created: Test Wizard 1234567890
  ✅ Class: Wizard, Level: 3
  ...
```

### Browser Console
Errory z browser console jsou automaticky logované:
```javascript
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.log('Browser Console Error:', msg.text());
  }
});
```

### Headed Mode
Pro debugging spusťte test s viditelným browserem:
```bash
npx playwright test game-flow-simple --headed
```

### Pause and Inspect
Pro pozastavení testu přidejte do testu:
```typescript
await page.pause()
```

## Timeout nastavení

Testy mají nastaveny následující timeouty:

| Komponenta | Timeout | Důvod |
|------------|---------|-------|
| Test | 15 minut | Kompletní game flow s AI |
| Action Response | 20 sekund | AI generování odpovědi |
| Page Load | 10 sekund | Navigace mezi stránkami |

## Troubleshooting

### Test fails s "Timeout waiting for narrator response"
- Zkontrolujte, že Gemini API key je správně nakonfigurován
- Zkontrolujte backend logy pro AI chyby
- Zvyšte timeout v `waitForNarratorResponse()`

### Test fails na login
- Ujistěte se, že backend běží na `http://localhost:3000`
- Zkontrolujte databázové připojení
- Ověřte, že `/api/auth/login` endpoint funguje

### Screenshots se neuloží
- Ujistěte se, že existuje adresář `backend/tests/e2e/screenshots/`
- Zkontrolujte oprávnění k zápisu

### HP nebo Spell Slots se neaktualizují
- API endpointy `/api/characters/:id/hp` a `/api/characters/:id/spell-slots` musí fungovat
- Zkontrolujte backend logy pro chyby

## CI/CD

V production prostředí jsou testy konfigurovány s:
- 2 retry při selhání
- 1 worker (sequential execution)
- Automatické screenshot při selhání
- Video záznam při selhání

Pro spuštění v CI režimu:
```bash
CI=true npx playwright test
```

## Další informace

- [Playwright Documentation](https://playwright.dev/)
- [D&D 5e API Documentation](./../../docs/api.md)
- [Bug Reports](./../../docs/bugs.md)
