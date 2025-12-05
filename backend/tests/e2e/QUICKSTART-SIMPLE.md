# Rychlý Start: Game Flow Simple Test

Nejrychlejší způsob jak otestovat kompletní herní flow.

## 1. Spustit služby

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 2. Spustit test

```bash
cd backend
npx playwright test game-flow-simple
```

## 3. Výsledek

Test provede:
- ✅ Login (s účtem aitest2@dnd.test)
- ✅ Vytvoření Wizard Level 3 postavy
- ✅ Start hry
- ✅ 15 herních akcí:
  1. Exploration (rozhlédnutí)
  2. Dialog (s hostinským)
  3. Edge case (smartphone - odmítnuto)
  4. Recovery (normální akce po edge case)
  5. Combat (útok na goblina)
  6. HP Damage (-8 HP)
  7. Cantrip (Fire Bolt - bez slotu)
  8. Leveled Spell (Magic Missile - slot spotřebován)
  9. Healing (Cure Wounds + slot)
  10. Unknown Spell (Meteor Swarm - odmítnuto)
  11. Absurd Request (přesvědčit draka)
  12. Long Rest (obnovení HP + slots)
  13. Continue Journey
  14. Search Secret Door
  15. Search Treasure

**Čas běhu:** ~12-15 minut

## Debugging

### Headed Mode (viditelný browser)
```bash
npx playwright test game-flow-simple --headed
```

### UI Mode (interaktivní)
```bash
npx playwright test game-flow-simple --ui
```

### Slow Motion
```bash
SLOW_MO=1 npx playwright test game-flow-simple --headed
```

## Výstup

Konzole ukáže detailní progress:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 Complete Game Flow Test - AI DM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 PHASE 1: Login
  ✅ Login successful

🧙 PHASE 2: Create Character (Wizard Level 3)
  ✅ Character created

🎮 PHASE 3: Start Game
  ✅ Game started
  ✅ Initial HP: 18/18
  ✅ Initial Spell Slots L1: 4/4

🎲 PHASE 4: Game Actions (15 Actions)

1/15 - Exploration
  → Action: "Rozhlížím se kolem sebe"
  ✅ Narrator response received
  ✅ Exploration successful

2/15 - Dialog
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ COMPLETE GAME FLOW TEST - RESULT
RESULT: 15/15 actions ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Screenshot: `backend/tests/e2e/screenshots/game-flow-complete.png`

## Problém?

### Test selhává na login
- Zkontroluj: Backend běží na http://localhost:3000?
- Zkontroluj: Databáze je připojena?

### Timeout čekání na AI
- Zkontroluj: Gemini API key je nastaven?
- Zkontroluj: Backend logy pro AI chyby

### Port error
- Backend MUSÍ běžet na 3000
- Frontend MUSÍ běžet na 5173

## Alternativa: Pouze specifická část

Pokud chceš spustit jen část testu, otevři test v UI mode:

```bash
npx playwright test game-flow-simple --ui
```

A klikni na konkrétní test step (Action 1, Action 2, atd.)
