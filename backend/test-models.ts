import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'

const prisma = new PrismaClient()

async function listModels() {
  const user = await prisma.user.findFirst({
    where: { email: 'wizardtest@example.com' }
  })

  if (!user?.geminiApiKey) {
    console.log('❌ Uživatel nebo API klíč nenalezen')
    return
  }

  console.log('🔑 Používám API klíč:', user.geminiApiKey.substring(0, 20) + '...')

  try {
    const genAI = new GoogleGenerativeAI(user.geminiApiKey)

    // Zkus různé modely
    const modelsToTest = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'models/gemini-pro',
      'models/gemini-1.5-pro'
    ]

    console.log('\n📋 Testování modelů:\n')

    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent('Say OK')
        const response = await result.response
        console.log('✅', modelName, '- FUNGUJE')
      } catch (error: any) {
        console.log('❌', modelName, '-', error.status || 'ERROR')
        console.log('   ', error.message)
      }
    }
  } catch (error: any) {
    console.error('❌ Chyba:', error.message)
  }

  await prisma.$disconnect()
}

listModels().catch(console.error)
