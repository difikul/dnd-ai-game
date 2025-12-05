# E2E Test Results - Inventory System

**Datum:** 2025-11-27
**Testovací prostředí:** Playwright MCP
**Tester:** Claude Code

---

## Testovaná postava

| Atribut | Hodnota |
|---------|---------|
| Jméno | Inventory Tester |
| Rasa | Human |
| Povolání | Fighter |
| Level | 1 |
| HP | 11/11 |
| AC | 12 |
| STR | 15 (+2) |
| DEX | 14 (+2) |
| CON | 13 (+1) |
| INT | 12 (+1) |
| WIS | 10 (+0) |
| CHA | 8 (-1) |

---

## Testovací scénáře

### 1. Prázdný inventář
**Status:** PASS

- Otevření inventáře tlačítkem "Inventář"
- Zobrazení tabů: Vše, Nasazené, Zbraně, Zbroj, Ostatní
- Empty state: "Inventář je prázdný"
- Footer: "Předměty: 0", "Propojené: 0/3"

### 2. Přidání předmětu přes API
**Status:** PASS

**Testovací předměty:**
```json
{
  "name": "Meč Plamenů +2",
  "type": "weapon",
  "rarity": "rare",
  "description": "Starověký meč",
  "damage": "1d8+2",
  "requiresAttunement": true
}

{
  "name": "Prsten Síly +2",
  "type": "accessory",
  "rarity": "rare",
  "description": "Zlatý prsten s rubínem, který zvyšuje sílu nositele.",
  "requiresAttunement": true,
  "statBonuses": {"strength": 2}
}
```

**Výsledky:**
- API endpoint `POST /api/characters/:id/inventory` funguje
- `statBonuses` se správně ukládají do DB
- UI se automaticky aktualizuje po přidání

### 3. Zobrazení předmětu v UI
**Status:** PASS

**Ověřeno:**
- Ikona typu (⚔️ weapon, 💍 accessory)
- Badge rarity ("Vzácný")
- Badge "Vyžaduje propojení"
- Popis předmětu
- Damage/stat bonusy ("SÍL: +2")
- Akční tlačítka (Nasadit, Propojit, 🗑️)
- Množství (x1)

### 4. Nasazení předmětu
**Status:** PASS

**Postup:**
1. Klik na "Nasadit"
2. Předmět označen badge "Nasazeno"
3. Tlačítko změněno na "Sundat"
4. Tab "Nasazené" aktualizován

### 5. Propojení (Attunement)
**Status:** PASS

**Postup:**
1. Klik na "Propojit"
2. Předmět označen badge "Propojeno"
3. Tlačítko změněno na "Odpojit"
4. Footer: "Propojené: 1/3"
5. Sekce bonusů: "Bonusy: SÍL +2"

### 6. Blokace sundání propojeného předmětu
**Status:** PASS

**Chování:**
- Pokus o sundání propojeného předmětu
- Zobrazena chyba: "Předmět musí být nejdříve odpojen (unattune) před sundáním"
- Tlačítko "Zkusit znovu" pro reload

### 7. Odpojení předmětu
**Status:** PASS

**Postup:**
1. Klik na "Odpojit"
2. Badge "Propojeno" odstraněn
3. Tlačítko změněno na "Propojit"
4. Footer: "Propojené: 0/3"

### 8. Sundání předmětu
**Status:** PASS

**Postup:**
1. Klik na "Sundat"
2. Badge "Nasazeno" odstraněn
3. Tlačítko změněno na "Nasadit"
4. Tab "Nasazené" aktualizován

### 9. Smazání předmětu
**Status:** PASS

**Postup:**
1. Klik na 🗑️
2. Confirm dialog: "Opravdu chceš zahodit 'Prsten Síly +2'?"
3. Po potvrzení předmět smazán
4. Počet předmětů aktualizován (3 → 2)

### 10. Bonusy v inventáři footer
**Status:** PASS

- Footer zobrazuje "Bonusy: SÍL +2" po propojení předmětu
- Bonusy se aktualizují při propojení/odpojení

---

## Nalezené bugy

### BUG-001: Stat bonusy se nezobrazují v CharacterSheet

**Priorita:** HIGH
**Status:** OPEN

**Popis:**
Stat bonusy z propojených předmětů se nezobrazují v CharacterSheet sidebaru. Inventář správně zobrazuje aktivní bonusy, ale sidebar ukazuje pouze základní statistiky postavy.

**Očekávané chování:**
- Prsten Síly +2 je propojen (isAttuned: true, statBonuses: {strength: 2})
- Sidebar by měl zobrazovat STR: 17 (+3) místo STR: 15 (+2)

**Aktuální chování:**
- Inventář footer: "Bonusy: SÍL +2" ✅
- CharacterSheet sidebar: STR: 15 (+2) ❌

**Příčina:**
Backend vrací základní statistiky postavy, ne efektivní (základní + bonusy). Frontend CharacterSheet nepřičítá bonusy z inventoryStore.

**Návrh opravy:**
1. Frontend: CharacterSheet by měl používat `inventoryStore.equippedBonuses` a přičítat je k základním statistikám
2. Alternativně: Backend endpoint `/api/characters/:id` by mohl vracet i `effectiveStats`

---

## Souhrn výsledků

| Kategorie | Počet | Status |
|-----------|-------|--------|
| Celkem testů | 10 | - |
| Úspěšných | 9 | PASS |
| Neúspěšných | 1 | FAIL |
| Úspěšnost | 90% | - |

---

## Doporučení

1. **Opravit BUG-001** - Kritická funkčnost pro gameplay
2. **Přidat E2E test pro stat bonusy** - Automatizovaný test ověřující zobrazení bonusů v sidebaru
3. **Zvážit HP/AC bonusy** - Implementovat zobrazení bonusů k HP a AC z předmětů

---

## Testovací příkazy (API)

```bash
# Přidání předmětu
curl -X POST "http://localhost:3000/api/characters/{charId}/inventory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"name": "Test Item", "type": "weapon", "rarity": "common"}'

# Získání inventáře
curl "http://localhost:3000/api/characters/{charId}/inventory" \
  -H "Authorization: Bearer {token}"

# Nasazení předmětu
curl -X PUT "http://localhost:3000/api/characters/{charId}/inventory/{itemId}/equip" \
  -H "Authorization: Bearer {token}"

# Propojení předmětu
curl -X PUT "http://localhost:3000/api/characters/{charId}/inventory/{itemId}/attune" \
  -H "Authorization: Bearer {token}"
```
