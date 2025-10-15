import { config } from 'dotenv'

// Load environment variables
config()

async function listAvailableModels() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment')
    process.exit(1)
  }

  console.log('🔍 Listing available Gemini models via REST API...\n')
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}\n`)

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: any = await response.json()

    if (!data.models || data.models.length === 0) {
      console.log('⚠️ No models found!')
      return
    }

    console.log(`✅ Found ${data.models.length} models:\n`)

    data.models.forEach((model: any, index: number) => {
      console.log(`${index + 1}. ${model.name}`)
      console.log(`   Display Name: ${model.displayName || 'N/A'}`)
      console.log(`   Description: ${model.description || 'N/A'}`)
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`)
      console.log(`   Input Token Limit: ${model.inputTokenLimit || 'N/A'}`)
      console.log(`   Output Token Limit: ${model.outputTokenLimit || 'N/A'}`)
      console.log('')
    })

    // Find models that support generateContent
    const contentGenerationModels = data.models.filter(
      (model: any) => model.supportedGenerationMethods?.includes('generateContent')
    )

    console.log(`\n🎯 Models supporting generateContent (${contentGenerationModels.length}):`)
    contentGenerationModels.forEach((model: any) => {
      // Extract just the model name without the 'models/' prefix
      const modelName = model.name.replace('models/', '')
      console.log(`   ✓ ${modelName}`)
    })

    console.log('\n💡 Use one of these model names in config/gemini.ts')

  } catch (error: any) {
    console.error('❌ Error listing models:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

listAvailableModels()
