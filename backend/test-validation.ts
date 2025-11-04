/**
 * Direct Validation Testing Script
 * Tests the validation service without requiring AI/Gemini API
 */

import { PrismaClient } from '@prisma/client'
import * as validationService from './src/services/validationService'

const prisma = new PrismaClient()

const CHARACTER_ID = 'c6a36b0d-c46c-4305-b827-5006a7f84ec4' // Gandalf Testovací

interface TestCase {
  name: string
  action: string
  expectedValid: boolean
  expectedReason?: string
}

const testCases: TestCase[] = [
  // TEST 1: Unknown spell (Fireball - not in wizard's L3 spell list)
  {
    name: '❌ Pokus seslat Fireball (postava nezná)',
    action: 'Sešlu Fireball na nepřátele',
    expectedValid: false,
    expectedReason: 'Fireball'
  },

  // TEST 2: Known spell in Czech
  {
    name: '✅ Pokus seslat Magic Missile (postava zná)',
    action: 'Použiju magickou střelu na goblina',
    expectedValid: true
  },

  // TEST 3: Cantrip (unlimited use)
  {
    name: '✅ Pokus seslat Fire Bolt cantrip',
    action: 'Vrhnu ohnivou střelu Fire Bolt',
    expectedValid: true
  },

  // TEST 4: Modern technology
  {
    name: '❌ Pokus vytvořit počítač',
    action: 'Sestrojím počítač a naprogramuji AI',
    expectedValid: false,
    expectedReason: 'Počítače'
  },

  // TEST 5: Modern history reference
  {
    name: '❌ Pokus zabít Hitlera',
    action: 'Cestuju časem a zabiju Hitlera',
    expectedValid: false,
    expectedReason: 'moderní historii'
  },

  // TEST 6: Modern vehicle
  {
    name: '❌ Pokus přivolat auto',
    action: 'Vyčaruji auto abych ujel',
    expectedValid: false,
    expectedReason: 'dopravní prostředky'
  },

  // TEST 7: Normal non-magic action
  {
    name: '✅ Normální akce - útok mečem',
    action: 'Útočím mečem na goblina',
    expectedValid: true
  },

  // TEST 8: Known spell - Shield
  {
    name: '✅ Pokus seslat Shield (známé kouzlo)',
    action: 'Vyvolám magický štít pro ochranu',
    expectedValid: true
  }
]

async function runTests() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('🧪 TESTOVÁNÍ VALIDAČNÍHO SYSTÉMU')
  console.log('═══════════════════════════════════════════════\n')

  console.log(`📋 Testovací postava: ${CHARACTER_ID}`)
  console.log(`📝 Počet testů: ${testCases.length}\n`)

  let passedTests = 0
  let failedTests = 0

  for (const testCase of testCases) {
    console.log(`\n${testCase.name}`)
    console.log(`   Akce: "${testCase.action}"`)

    try {
      const result = await validationService.validatePlayerAction(
        CHARACTER_ID,
        testCase.action
      )

      const passed = result.valid === testCase.expectedValid

      if (passed) {
        console.log(`   ✅ PASSED - Valid: ${result.valid}`)
        if (result.detectedSpell) {
          console.log(`      Detekované kouzlo: ${result.detectedSpell.name} (L${result.detectedSpell.level})`)
        }
        if (result.reason) {
          console.log(`      Důvod: ${result.reason}`)
        }
        passedTests++
      } else {
        console.log(`   ❌ FAILED`)
        console.log(`      Očekáváno valid=${testCase.expectedValid}, získáno valid=${result.valid}`)
        if (result.reason) {
          console.log(`      Důvod: ${result.reason}`)
        }
        failedTests++
      }
    } catch (error: any) {
      console.log(`   ⚠️  ERROR: ${error.message}`)
      failedTests++
    }
  }

  console.log('\n═══════════════════════════════════════════════')
  console.log('📊 VÝSLEDKY TESTŮ')
  console.log('═══════════════════════════════════════════════')
  console.log(`✅ Úspěšné: ${passedTests}/${testCases.length}`)
  console.log(`❌ Neúspěšné: ${failedTests}/${testCases.length}`)
  console.log(`📈 Úspěšnost: ${Math.round((passedTests / testCases.length) * 100)}%`)
  console.log('═══════════════════════════════════════════════\n')
}

// Run tests and close connection
runTests()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
