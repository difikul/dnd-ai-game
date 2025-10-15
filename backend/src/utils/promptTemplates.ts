import { Character } from '@prisma/client'

/**
 * System prompt pro Gemini AI - Dungeon Master osobnost
 */
export const SYSTEM_PROMPT = `Jsi zkušený Dungeon Master pro Dungeons & Dragons 5. edice.

TVOJE ROLE:
- Vyprávíš fantasy příběhy v češtině
- Reaguješ na akce hráče kreativně a konzistentně
- Dodržuješ pravidla D&D 5e
- Vytváříš zajímavé výzvy a dilema
- Udržuješ atmosféru dobrodružství a napětí

PRAVIDLA ODPOVĚDÍ:
1. Popisuj prostředí pomocí smyslů (zrak, sluch, čich, dotek)
2. Dialog NPC piš v uvozovkách a používej charakteristický způsob mluvy
3. Když hráč potřebuje házet kostkou, napiš: [DICE: 1d20+X typ_hodu]
   Například: [DICE: 1d20+3 perception] nebo [DICE: 1d20+5 attack]
4. Nabídni 2-4 možnosti akcí, ale vždy umožni vlastní rozhodnutí
5. Udržuj tempo hry - ani moc rychle, ani pomalu
6. Reaguj na předchozí akce hráče a udržuj kontinuitu příběhu
7. Používej emocivní a atmosferické popisy

FORMAT ODPOVĚDI:
📍 [Název lokace]

👁️ [Detailní popis situace a prostředí]

💬 [Dialog NPC nebo narativní text, důležité informace]

⚔️ [Combat informace - pouze pokud je hráč v souboji]

🎲 Co chceš dělat?
[Seznam 2-4 návrhů akcí]
`;

/**
 * Vytvoří kontext postavy pro AI
 */
export function buildCharacterContext(character: Character): string {
  return `
KONTEXT POSTAVY:
Jméno: ${character.name}
Rasa: ${character.race}
Povolání: ${character.class}
Level: ${character.level}
HP: ${character.hitPoints}/${character.maxHitPoints}
AC: ${character.armorClass}
Síla: ${character.strength}
Obratnost: ${character.dexterity}
Odolnost: ${character.constitution}
Inteligence: ${character.intelligence}
Moudrost: ${character.wisdom}
Charisma: ${character.charisma}
${character.background ? `Pozadí: ${character.background}` : ''}
`;
}

/**
 * Vytvoří úvodní prompt pro novou hru
 */
export function buildGameStartPrompt(character: Character, startingLocation: string): string {
  return `${SYSTEM_PROMPT}

${buildCharacterContext(character)}

Hra začíná v lokaci: ${startingLocation}

Vytvoř epický úvod do hry. Popiš počáteční situaci, ve které se postava nachází. Nabídni několik možností, jak může začít své dobrodružství. Buď kreativní a zapoj hráče přímo do děje!`;
}

/**
 * Vytvoří prompt pro reakci na akci hráče
 */
export function buildActionPrompt(
  character: Character,
  playerAction: string,
  currentLocation: string,
  gameContext?: string
): string {
  let prompt = `${SYSTEM_PROMPT}

${buildCharacterContext(character)}

Aktuální lokace: ${currentLocation}

${gameContext ? `Kontext hry:\n${gameContext}\n` : ''}

Hráč provedl následující akci:
"${playerAction}"

Reaguj na tuto akci jako DM. Popiš výsledek akce, reakce prostředí a NPC. Pokud je potřeba hodit kostkou, označ to pomocí [DICE: ...]. Udržuj tempo příběhu a nabídni další možnosti.`;

  return prompt
}

/**
 * Vytvoří prompt pro combat situaci
 */
export function buildCombatPrompt(
  character: Character,
  combatState: any,
  playerAction: string
): string {
  return `${SYSTEM_PROMPT}

${buildCharacterContext(character)}

COMBAT SITUACE:
${JSON.stringify(combatState, null, 2)}

Hráč provedl akci v boji:
"${playerAction}"

Jako DM vyhodnoť tuto akci v kontextu souboje. Popiš výsledek, reakci nepřátel a další vývoj boje. Používej D&D 5e pravidla pro combat.`;
}

/**
 * Vytvoří summarizační prompt pro dlouhé konverzace
 */
export function buildSummaryPrompt(messages: string[]): string {
  return `Následující zprávy představují část D&D herní session. Shrň klíčové události, důležité informace a aktuální stav příběhu do 2-3 vět:

${messages.join('\n\n')}

Shrnutí:`;
}
