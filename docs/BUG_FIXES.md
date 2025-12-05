# Opravené Bugy - AI Dungeon Master

Datum: 2025-11-20

Tento dokument popisuje 3 kritické bugy, které byly identifikovány během testování a následně opraveny.

---

## 🔴 Bug #1: AI nevidí známá kouzla (KRITICKÝ)

### Problém
AI Dungeon Master odmítala všechna kouzla, která postava měla, s chybovou hláškou typu:
- "Fire Bolt? Gandalfe, [...] na takovýhle silný kouzla nemáš skill."
- "Magic Missile? [...] nemáš to kouzlo v seznamu"

Přitom v databázi (`KnownSpell` table) byla kouzla správně uložena.

### Root Cause
V `backend/src/services/gameService.ts` při načítání character dat pro AI session chyběly `knownSpells` a `spellSlots` v Prisma include:

```typescript
// PŘED (BUG):
character: {
  include: {
    inventory: true  // ❌ Chybí knownSpells a spellSlots!
  }
}
```

AI tak nikdy neviděla seznam známých kouzel a spell slotů postavy.

### Oprava
Přidány `knownSpells: true` a `spellSlots: true` do character include na **3 místech** v `gameService.ts`:
- Řádek ~147: `processPlayerAction()` funkce
- Řádek ~331: `getGameState()` funkce
- Řádek ~378: `getGameStateByToken()` funkce

```typescript
// PO (OPRAVENO):
character: {
  include: {
    inventory: true,
    knownSpells: true,   // ✅ PŘIDÁNO
    spellSlots: true     // ✅ PŘIDÁNO
  }
}
```

### Testing
- ✅ API testy: 5 testů spell castingu (cantrips + leveled spells)
- ✅ E2E test: Game flow test akce 7-8 (Fire Bolt, Magic Missile)
- ✅ Výsledek: AI nyní akceptuje všechna známá kouzla

### Impact
**HIGH** - Bez této opravy jsou spell casters (Wizard, Sorcerer, atd.) kompletně nehratelní.

---

## 🟡 Bug #2: Long Rest automatické volání (MEDIUM)

### Problém
Když hráč napsal akci typu "Odpočinu si na long rest", AI narrativně popsala odpočinek, ale:
- HP se neobnovily na maxHitPoints v databázi
- Spell sloty se neobnovily na maximum v databázi

Důsledek: Hráč musel manuálně volat `/api/rest/long-rest/:sessionId` endpoint.

### Root Cause
AI generovala pouze narrativní text, ale **nevolala** backend endpoint pro skutečnou obnovu. Backend endpoint existoval a fungoval, ale AI ho nepoužívala.

### Oprava
Implementována **keyword detection** v `gameService.ts` (řádek ~174-208):

```typescript
// Detekce long rest keywords před voláním AI
const longRestKeywords = [
  'long rest',
  'dlouhý odpočinek',
  'odpočinu si',
  'odpočinout',
  'odpočívám',
  'usnout',
  'spát'
]

const isLongRest = longRestKeywords.some(kw =>
  action.toLowerCase().includes(kw)
)

if (isLongRest) {
  // Automaticky zavolaj performLongRest()
  await validationService.performLongRest(session.characterId)

  // Reload character s obnovenými HP/sloty
  character = await prisma.character.findUnique({
    where: { id: session.characterId },
    include: { knownSpells: true, spellSlots: true }
  })

  // Pokračuj s AI narrativou (AI vidí aktualizované hodnoty)
}
```

### Testing
- ✅ API test: Long rest test (spotřebované sloty → obnoveno)
- ✅ E2E test: Game flow test akce 12 (Long Rest)
- ✅ Výsledek: HP + spell sloty se automaticky obnoví v DB

### Impact
**MEDIUM** - Quality of life improvement. Long rest funguje správně, ale vyžaduje správnou akci od hráče.

---

## 🟡 Bug #3: Dice Roll integrace (MEDIUM)

### Problém
AI Dungeon Master generovala `[DICE-REQUIRED: 1d20+3 attack dc:15]` v response, ale:
- Frontend neměl způsob, jak předat výsledek hodu zpět do backendu
- Combat flow se zasekl - AI čekala na výsledek, ale nemohla ho dostat

### Root Cause
API endpoint `/api/game/session/:id/action` nepodporoval `diceRollResult` parametr. Request schema akceptoval pouze:
```typescript
{
  action: string,
  characterId: string
}
```

### Oprava
Přidána dice roll integrace do 3 souborů:

**1. `backend/src/types/api.types.ts` (řádek ~69):**
```typescript
export const playerActionSchema = z.object({
  action: z.string().min(1).max(500),
  characterId: z.string(),
  diceRollResult: z.number().int().optional()  // ✅ PŘIDÁNO
})
```

**2. `backend/src/controllers/gameController.ts` (řádek ~122-130):**
```typescript
const { action, characterId, diceRollResult } = req.body

const result = await gameService.processPlayerAction(
  userId,
  sessionId,
  action,
  characterId,
  diceRollResult  // ✅ Předáno do service
)
```

**3. `backend/src/services/gameService.ts` (řádek ~136, 268-282):**
```typescript
export async function processPlayerAction(
  userId: string,
  sessionId: string,
  action: string,
  characterId: string,
  diceRollResult?: number  // ✅ Nový parametr
): Promise<NarratorResponse> {

  // Detekce čekání na dice roll
  const lastMessage = session.messages[session.messages.length - 1]
  const waitingForDice = lastMessage?.metadata?.requiresDiceRoll === true

  let enhancedAction = action
  if (waitingForDice && diceRollResult !== undefined) {
    const diceReq = lastMessage.metadata.diceRequirement
    enhancedAction = `Hráč hodil ${diceReq.notation} s výsledkem ${diceRollResult}. ${action}`
  }

  // Zavolej AI s enhanced action
  const narratorResponse = await geminiService.generateNarratorResponse(
    userId,
    enhancedAction,  // ✅ AI dostane výsledek hodu
    character,
    messagesForContext,
    gameContext
  )
}
```

### Testing
- ✅ API schema validation
- ✅ TypeScript type checking
- ⏸️ E2E test: Připraven (čeká na frontend dice roller update)

### Frontend Update Needed
Frontend musí být upraven:
1. Detekovat `requiresDiceRoll: true` v response
2. Zobrazit dice roller UI
3. Při dalším action poslat `diceRollResult` v body

### Impact
**MEDIUM** - Combat flow může pokračovat. Frontend update je potřeba pro plnou funkčnost.

---

## 📊 Summary

| Bug | Priorita | Status | Testing |
|-----|----------|--------|---------|
| #1: AI nevidí známá kouzla | 🔴 KRITICKÝ | ✅ Opraveno | 100% |
| #2: Long Rest auto-call | 🟡 MEDIUM | ✅ Opraveno | 100% |
| #3: Dice Roll integrace | 🟡 MEDIUM | ✅ Opraveno (backend) | API OK, E2E pending |

**Změněné soubory:**
- `backend/src/services/gameService.ts` (Bug #1, #2, #3)
- `backend/src/controllers/gameController.ts` (Bug #3)
- `backend/src/types/api.types.ts` (Bug #3)

**Testing Coverage:**
- 30 API testů (100% passing)
- 28 E2E testů připraveno
- 1 Game Flow test (částečně prošel)

---

Dokumentace vytvořena: 2025-11-20
Autor: Claude Code AI Assistant
