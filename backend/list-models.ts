import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = 'AIzaSyBHznnVEmlHBjBk4v_JWXIs6jEO75dghck'

async function listAvailableModels() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)

    console.log('🔍 Načítám dostupné modely...\n')

    // List models using REST API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    )

    const data = await response.json()

    if (data.models) {
      console.log(`✅ Nalezeno ${data.models.length} modelů:\n`)

      data.models.forEach((model: any) => {
        const supportedMethods = model.supportedGenerationMethods || []
        if (supportedMethods.includes('generateContent')) {
          console.log(`✅ ${model.name}`)
          console.log(`   Display: ${model.displayName}`)
          console.log(`   Methods: ${supportedMethods.join(', ')}`)
          console.log('')
        }
      })
    } else {
      console.log('❌ Chyba:', data)
    }
  } catch (error: any) {
    console.error('❌ Chyba při načítání modelů:', error.message)
  }
}

listAvailableModels()
