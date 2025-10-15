import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean up existing data
  await prisma.message.deleteMany()
  await prisma.item.deleteMany()
  await prisma.gameSession.deleteMany()
  await prisma.character.deleteMany()
  await prisma.worldLocation.deleteMany()

  console.log('🗑️  Cleared existing data')

  // Create test character
  const testCharacter = await prisma.character.create({
    data: {
      name: 'Thorin Oakenshield',
      race: 'Dwarf',
      class: 'Fighter',
      level: 3,
      strength: 16,
      dexterity: 12,
      constitution: 15,
      intelligence: 10,
      wisdom: 12,
      charisma: 10,
      hitPoints: 28,
      maxHitPoints: 28,
      armorClass: 16,
      experience: 900,
      background: 'Bývalý princ Ereboru, hledající ztracené trpasličí království.',
    }
  })

  console.log('✅ Created test character: Thorin Oakenshield')

  // Create test items for the character
  await prisma.item.createMany({
    data: [
      {
        characterId: testCharacter.id,
        name: 'Dlouhý meč',
        type: 'weapon',
        description: 'Trpasličí válečný meč s runami',
        quantity: 1,
        equipped: true,
        damage: '1d8+3',
        properties: { weight: 3, rarity: 'uncommon' }
      },
      {
        characterId: testCharacter.id,
        name: 'Kroužková zbroj',
        type: 'armor',
        description: 'Těžká kroužková zbroj',
        quantity: 1,
        equipped: true,
        armorValue: 16,
        properties: { weight: 40, disadvantageStealth: true }
      },
      {
        characterId: testCharacter.id,
        name: 'Léčivý lektvar',
        type: 'potion',
        description: 'Obnoví 2d4+2 životů',
        quantity: 3,
        equipped: false,
        properties: { weight: 0.5 }
      }
    ]
  })

  console.log('✅ Created test items for character')

  // Create world locations
  const startingTown = await prisma.worldLocation.create({
    data: {
      name: 'Bree',
      type: 'town',
      description: 'Malé městečko na křižovatce obchodních cest. Slavná je místní hospoda "Tancující poník".',
      connectedTo: [],
      discovered: true,
      npcs: [
        { name: 'Butterbur', role: 'hospodský', personality: 'přátelský, starostlivý' },
        { name: 'Strider', role: 'hraničář', personality: 'tajemný, opatrný' }
      ],
      encounters: []
    }
  })

  await prisma.worldLocation.create({
    data: {
      name: 'Mirkwood',
      type: 'wilderness',
      description: 'Temný les plný pavouků a nebezpečných tvorů.',
      connectedTo: [startingTown.id],
      discovered: false,
      npcs: [],
      encounters: [
        { name: 'Obří pavouci', difficulty: 'medium', count: '1d4' },
        { name: 'Orci', difficulty: 'easy', count: '1d6' }
      ]
    }
  })

  console.log('✅ Created world locations')

  // Create a test game session
  const testSession = await prisma.gameSession.create({
    data: {
      sessionToken: nanoid(16),
      characterId: testCharacter.id,
      currentLocation: 'Bree',
      questLog: [
        {
          id: '1',
          title: 'Najdi ztracený meč',
          description: 'Starý hraničář zmiňoval prastarý meč ukrytý v Mirkwood lese.',
          status: 'active',
          objectives: [
            { id: '1-1', text: 'Domluvit se s hraničářem Striderem', completed: false },
            { id: '1-2', text: 'Prozkoumat Mirkwood les', completed: false }
          ]
        }
      ],
      worldState: {
        reputation: { bree: 10 },
        completedEvents: [],
        gameTime: 'day1'
      },
      isActive: true
    }
  })

  console.log('✅ Created test game session')

  // Create initial messages
  await prisma.message.createMany({
    data: [
      {
        sessionId: testSession.id,
        role: 'system',
        content: 'Hra začíná v městečku Bree.',
        metadata: { timestamp: new Date().toISOString() }
      },
      {
        sessionId: testSession.id,
        role: 'narrator',
        content: `📍 Bree - Hospoda "Tancující poník"

👁️ Vstupuješ do útulné hospody plné hluku a zápachu piva. U baru stojí tlouštík hospodský Butterbur, který tě vítá s úsměvem. V rohu sedí tajemný muž v kápi - zdá se, že tě pozoruje.

💬 "Vítej, cizinče!" volá Butterbur. "Co tě přivádí do našeho městečka?"

🎲 Co chceš dělat?
1. Promluvit si s hospodským Butterburem
2. Přiblížit se k tajemnému muži v rohu
3. Objednat si pivo a poslouchat místní řeči
4. Vlastní akce...`,
        metadata: { timestamp: new Date().toISOString() }
      }
    ]
  })

  console.log('✅ Created initial messages')

  console.log('✨ Seed completed successfully!')
  console.log(`   Character: ${testCharacter.name} (${testCharacter.class})`)
  console.log(`   Session Token: ${testSession.sessionToken}`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
