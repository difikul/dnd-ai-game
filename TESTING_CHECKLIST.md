# Manual Testing Checklist

Před deploymentem projdi tento checklist. Každý checkbox představuje jednu testovanou funkcionalitu.

## Setup & Environment
- [ ] Docker kontejnery se spouští bez erroru (`docker-compose up`)
- [ ] Backend API je dostupný na http://localhost:3000
- [ ] Frontend je dostupný na http://localhost:5173
- [ ] Database je připojená (zkontroluj backend logy)
- [ ] Gemini API key je validní (ověř v `.env`)

## Character Creation
- [ ] Homepage zobrazuje "Nová Hra" a "Načíst Hru" buttony
- [ ] Kliknutí na "Nová Hra" naviguje na `/create-character`
- [ ] Character creator zobrazí všechny sekce (Race, Class, Abilities)

### Race Selection
- [ ] Zobrazuje se 9 ras (Human, Elf, Dwarf, Halfling, Gnome, Half-Elf, Half-Orc, Tiefling, Dragonborn)
- [ ] Každá rasa má popis
- [ ] Výběr rasy ji označí jako aktivní
- [ ] Lze změnit výběr

### Class Selection
- [ ] Zobrazuje se 12 tříd (Fighter, Wizard, Rogue, Cleric, Ranger, Paladin, Barbarian, Bard, Druid, Monk, Sorcerer, Warlock)
- [ ] Každá třída má popis
- [ ] Výběr třídy ji označí jako aktivní
- [ ] Lze změnit výběr

### Ability Scores
- [ ] Standard Array zobrazí 6 hodnot (15, 14, 13, 12, 10, 8)
- [ ] Každou hodnotu lze přiřadit k ability (STR, DEX, CON, INT, WIS, CHA)
- [ ] Použité hodnoty zmizí ze seznamu
- [ ] Lze změnit přiřazení
- [ ] Point Buy tlačítko přepíná režim (pokud implementováno)

### Character Stats
- [ ] HP se správně počítá (class base + CON modifier)
- [ ] AC se správně počítá (10 + DEX modifier)
- [ ] Modifiers se správně zobrazují (+2, -1, atd.)

### Vytvoření postavy
- [ ] "Vytvořit postavu" button je disabled dokud není vše vyplněné
- [ ] Po vyplnění je button enabled
- [ ] Kliknutí vytvoří postavu a naviguje na `/game/:id`
- [ ] Loading stav je viditelný během vytváření

## Game Play - Initial Load
- [ ] Game view se načte se správným character ID
- [ ] Character sheet je viditelný v sidebaru
- [ ] Character sheet zobrazuje správné stats (jméno, rasa, třída, level, HP, AC)
- [ ] Chat interface je viditelný
- [ ] Top bar zobrazuje character jméno
- [ ] Dice button (🎲) je viditelný
- [ ] Save button (💾) je viditelný

### AI Narrator
- [ ] Po načtení stránky AI pošle uvítací zprávu (15-20s)
- [ ] Uvítací zpráva se zobrazí v chatu
- [ ] Zpráva je v češtině
- [ ] Zpráva představuje fantasy scénu

### Chat Interface
- [ ] Chat input je viditelný a editovatelný
- [ ] Placeholder text je viditelný
- [ ] Lze napsat text
- [ ] Enter key odešle zprávu
- [ ] Button "Odeslat" odešle zprávu
- [ ] Po odeslání se zpráva zobrazí v chatu jako "Ty"
- [ ] Loading indicator se zobrazí během čekání na AI
- [ ] AI odpověď se zobrazí po 15-20s
- [ ] AI odpověď je označená jako "Vypravěč"
- [ ] Auto-scroll funguje (chat scrolluje dolů při nových zprávách)

### Conversation Flow
- [ ] Lze poslat více zpráv za sebou
- [ ] AI odpovídá kontextově (pamatuje si předchozí zprávy)
- [ ] Zprávy se zobrazují v chronologickém pořadí
- [ ] Můžeš poslat dlouhou zprávu (100+ chars) bez problémů
- [ ] Speciální znaky (čeština, emoji) fungují

## Dice Rolling System

### Opening Modal
- [ ] Kliknutí na 🎲 button otevře modal
- [ ] Modal je centrovaný na obrazovce
- [ ] Modal má dark fantasy styling
- [ ] Lze zavřít kliknutím na "Close" button
- [ ] Lze zavřít kliknutím mimo modal (backdrop)
- [ ] Lze zavřít ESC klávesou

### Quick Roll Buttons
- [ ] d4 button hodí d4 (výsledek 1-4)
- [ ] d6 button hodí d6 (výsledek 1-6)
- [ ] d8 button hodí d8 (výsledek 1-8)
- [ ] d10 button hodí d10 (výsledek 1-10)
- [ ] d12 button hodí d12 (výsledek 1-12)
- [ ] d20 button hodí d20 (výsledek 1-20)
- [ ] d100 button hodí d100 (výsledek 1-100)

### Custom Notation
- [ ] Input pole je viditelné
- [ ] Lze zadat custom notation (např. "1d20+5")
- [ ] "Roll" button hodí custom notation
- [ ] Podporuje format: `XdY+Z` (např. 2d6+3)
- [ ] Podporuje format: `XdY-Z` (např. 1d20-2)
- [ ] Podporuje format: `XdY` (bez modifieru)
- [ ] Nevalidní input zobrazí error message

### Advantage/Disadvantage
- [ ] Advantage checkbox je viditelný
- [ ] Disadvantage checkbox je viditelný
- [ ] Advantage a Disadvantage jsou mutuálně exkluzivní
- [ ] Advantage hodí 2d20 a vezme vyšší
- [ ] Disadvantage hodí 2d20 a vezme nižší
- [ ] Advantage/Disadvantage se zobrazí v roll history

### Roll History
- [ ] Roll history zobrazuje poslední hody
- [ ] Každý hod má: notation, výsledek, timestamp
- [ ] d20 === 20 je označen jako "Critical Hit" (zlatě)
- [ ] d20 === 1 je označen jako "Critical Miss" (červeně)
- [ ] Historie se scrolluje pokud je moc hodů
- [ ] "Clear History" button smaže všechny hody
- [ ] Po clear je historie prázdná

## Save/Load System

### Saving Game
- [ ] Kliknutí na 💾 button otevře save modal
- [ ] Modal zobrazí "Saving..." během ukládání
- [ ] Po uložení zobrazí "Game Saved!" success message
- [ ] Token je viditelný v modalu
- [ ] Token je ve formátu: `xxxx-xxxx-xxxx` (3 části oddělené pomlčkami)
- [ ] "Copy Token" button zkopíruje token do clipboardu
- [ ] Po kopírování se zobrazí potvrzení
- [ ] Lze zavřít modal pomocí "Close" button

### Loading Game - Token Input
- [ ] Na homepage je input pro token
- [ ] Input má placeholder "Zadej token (např. abc1-def2-ghi3)"
- [ ] Lze vložit token
- [ ] "Načíst" button je disabled když je input prázdný
- [ ] "Načíst" button je enabled když je token zadán
- [ ] Validní token načte hru a naviguje na `/game/:id`
- [ ] Nevalidní token zobrazí error "Uložená hra nenalezena"
- [ ] Prázdný token zobrazí validační zprávu

### Loading Game - Browse Saved Games
- [ ] Kliknutí na "Načíst Hru" naviguje na `/saved-games`
- [ ] Saved games view zobrazuje seznam her
- [ ] Každá hra má: character jméno, level, rasu, třídu, datum uložení
- [ ] "Načíst" button u každé hry funguje
- [ ] Načtení hry naviguje na `/game/:id`
- [ ] Hra pokračuje tam, kde byla uložena (character, chat history)

### Saved Games Management
- [ ] "Smazat" button je u každé hry
- [ ] Kliknutí na "Smazat" zobrazí confirm dialog
- [ ] Potvrzení smaže hru
- [ ] Seznam se aktualizuje po smazání
- [ ] Empty state se zobrazí když žádné hry nejsou
- [ ] Empty state má text "Žádné uložené hry" + button "Nová Hra"

## Responsive Design

### Mobile (375px)
- [ ] Character sheet je collapsible nebo scrollable
- [ ] Chat interface je použitelný (input, zprávy)
- [ ] Dice modal se vejde na obrazovku
- [ ] Buttony jsou dostatečně velké (min 44x44px)
- [ ] Text je čitelný (min 14px)
- [ ] Vše je použitelné jednou rukou

### Tablet (768px)
- [ ] Layout se přizpůsobí (možná 2 sloupce)
- [ ] Character creation grid má 2 sloupce
- [ ] Saved games grid má 2 sloupce
- [ ] Vše je čitelné a použitelné

### Desktop (1920px)
- [ ] Layout využívá prostor efektivně
- [ ] Character creation grid má 3 sloupce
- [ ] Saved games grid má 3 sloupce
- [ ] Chat není příliš široký (max-width)
- [ ] Character sheet má fixní šířku

## Error Handling

### Network Errors
- [ ] Timeout (30s+) zobrazí error message
- [ ] "Network error" zobrazí user-friendly zprávu
- [ ] Server down (500) zobrazí "Server error" zprávu
- [ ] Lze zkusit znovu (retry button nebo reload)

### Validation Errors
- [ ] Prázdný character name zobrazí validaci
- [ ] Nevalidní ability scores zobrazí validaci
- [ ] Prázdná zpráva v chatu nejde odeslat
- [ ] Nevalidní dice notation zobrazí error

### Game State Errors
- [ ] Neexistující character ID redirectuje na homepage
- [ ] Neexistující game session zobrazí error
- [ ] Corrupted game state zobrazí error a umožní restart

## Browser Compatibility

### Chrome/Edge (Chromium)
- [ ] Vše funguje bez bugů
- [ ] Styling je konzistentní
- [ ] Console nemá critical errors

### Firefox
- [ ] Vše funguje bez bugů
- [ ] Styling je konzistentní
- [ ] Console nemá critical errors

### Safari (if available)
- [ ] Vše funguje bez bugů
- [ ] Styling je konzistentní
- [ ] Console nemá critical errors

## Performance

### Load Times
- [ ] Homepage se načte do 2s
- [ ] Character creation se načte do 2s
- [ ] Game view se načte do 3s
- [ ] AI odpověď do 20s (závisí na Gemini API)

### Interactions
- [ ] Button clicks jsou responsivní (<100ms feedback)
- [ ] Modal otevření/zavření je plynulé
- [ ] Chat scroll je plynulý
- [ ] Dice roll animation je plynulá (pokud implementováno)

## Accessibility

### Keyboard Navigation
- [ ] Lze navigovat TAB klávesou
- [ ] Focus states jsou viditelné
- [ ] Enter key submituje formuláře
- [ ] ESC key zavírá modaly

### Screen Reader (optional)
- [ ] Důležité elementy mají aria-labels
- [ ] Buttony mají popisné texty
- [ ] Error messages jsou announce

## Security

### Input Sanitization
- [ ] XSS útok v chat inputu je blokován (např. `<script>alert('xss')</script>`)
- [ ] SQL injection v character name je blokován
- [ ] Speciální znaky jsou správně escapovány

### API Security
- [ ] API routes vyžadují validní data
- [ ] Rate limiting funguje (zkus poslat 100 requestů rychle)
- [ ] CORS je správně nastavený

## Final Checks

- [ ] Žádné console errors v browser console
- [ ] Žádné console warnings (nebo jen minor)
- [ ] Žádné React/Vue warnings
- [ ] Všechny images se načítají
- [ ] Favicon je nastaven
- [ ] Page titles jsou správné
- [ ] Loading states jsou viditelné během async operací
- [ ] Error boundaries jsou implementované (pokud je error, app nehavaruje)

---

## Test Results

**Datum testování:** _________________

**Tester:** _________________

**Browser:** _________________

**Celkový počet passed checků:** _____ / 150+

**Critical Issues Found:**
1.
2.
3.

**Minor Issues Found:**
1.
2.
3.

**Poznámky:**




---

**Status:** [ ] PASS / [ ] FAIL

**Ready for Production:** [ ] YES / [ ] NO
