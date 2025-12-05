/**
 * Character Controller - HTTP request handlers pro Character API
 */

import { Request, Response } from 'express'
import { characterService } from '../services/characterService'
import { geminiService } from '../services/geminiService'
import { CreateCharacterRequest, UpdateCharacterRequest, GenerateBackstoryRequest } from '../types/api.types'

/**
 * POST /api/characters
 * Vytvoří novou postavu
 */
export async function createCharacter(req: Request, res: Response): Promise<void> {
  try {
    const data: CreateCharacterRequest = req.body

    const character = await characterService.createCharacter(req.user!.userId, data)

    res.status(201).json({
      success: true,
      data: character,
      message: 'Postava byla úspěšně vytvořena'
    })
  } catch (error) {
    console.error('Error v createCharacter controller:', error)

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se vytvořit postavu',
      message: error instanceof Error ? error.message : 'Neznámá chyba'
    })
  }
}

/**
 * GET /api/characters
 * Načte všechny postavy
 */
export async function getAllCharacters(req: Request, res: Response): Promise<void> {
  try {
    const characters = await characterService.getAllCharacters(req.user!.userId)

    res.status(200).json({
      success: true,
      data: characters,
      count: characters.length
    })
  } catch (error) {
    console.error('Error v getAllCharacters controller:', error)

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se načíst postavy',
      message: error instanceof Error ? error.message : 'Neznámá chyba'
    })
  }
}

/**
 * GET /api/characters/:id
 * Načte jednu postavu podle ID
 */
export async function getCharacterById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    const character = await characterService.getCharacter(req.user!.userId, id)

    if (!character) {
      res.status(404).json({
        success: false,
        error: 'Postava nenalezena',
        message: `Postava s ID ${id} neexistuje`
      })
      return
    }

    res.status(200).json({
      success: true,
      data: character
    })
  } catch (error) {
    console.error('Error v getCharacterById controller:', error)

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se načíst postavu',
      message: error instanceof Error ? error.message : 'Neznámá chyba'
    })
  }
}

/**
 * PUT /api/characters/:id
 * Aktualizuje postavu
 */
export async function updateCharacter(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const data: UpdateCharacterRequest = req.body

    // Zkontroluj, jestli postava existuje
    const existingCharacter = await characterService.getCharacter(req.user!.userId, id)
    if (!existingCharacter) {
      res.status(404).json({
        success: false,
        error: 'Postava nenalezena',
        message: `Postava s ID ${id} neexistuje`
      })
      return
    }

    const character = await characterService.updateCharacter(req.user!.userId, id, data)

    res.status(200).json({
      success: true,
      data: character,
      message: 'Postava byla úspěšně aktualizována'
    })
  } catch (error) {
    console.error('Error v updateCharacter controller:', error)

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se aktualizovat postavu',
      message: error instanceof Error ? error.message : 'Neznámá chyba'
    })
  }
}

/**
 * DELETE /api/characters/:id
 * Smaže postavu
 */
export async function deleteCharacter(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    // Zkontroluj, jestli postava existuje
    const existingCharacter = await characterService.getCharacter(req.user!.userId, id)
    if (!existingCharacter) {
      res.status(404).json({
        success: false,
        error: 'Postava nenalezena',
        message: `Postava s ID ${id} neexistuje`
      })
      return
    }

    await characterService.deleteCharacter(req.user!.userId, id)

    res.status(200).json({
      success: true,
      message: 'Postava byla úspěšně smazána'
    })
  } catch (error) {
    console.error('Error v deleteCharacter controller:', error)

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se smazat postavu',
      message: error instanceof Error ? error.message : 'Neznámá chyba'
    })
  }
}

/**
 * POST /api/characters/:id/hp
 * Upraví HP postavy (healing nebo damage)
 * Body: { amount: number } - kladné = heal, záporné = damage
 */
export async function modifyHP(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { amount } = req.body

    if (typeof amount !== 'number') {
      res.status(400).json({
        success: false,
        error: 'Neplatná hodnota',
        message: 'amount musí být číslo'
      })
      return
    }

    const character = await characterService.modifyHP(req.user!.userId, id, amount)

    res.status(200).json({
      success: true,
      data: character,
      message: amount > 0
        ? `Postava se uzdravila o ${amount} HP`
        : `Postava utrpěla ${Math.abs(amount)} HP damage`
    })
  } catch (error) {
    console.error('Error v modifyHP controller:', error)

    if (error instanceof Error && error.message === 'Postava nenalezena') {
      res.status(404).json({
        success: false,
        error: 'Postava nenalezena',
        message: error.message
      })
      return
    }

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se upravit HP',
      message: error instanceof Error ? error.message : 'Neznámá chyba'
    })
  }
}

/**
 * POST /api/characters/:id/experience
 * Přidá experience postavě
 * Body: { amount: number }
 */
export async function addExperience(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { amount } = req.body

    if (typeof amount !== 'number' || amount < 0) {
      res.status(400).json({
        success: false,
        error: 'Neplatná hodnota',
        message: 'amount musí být kladné číslo'
      })
      return
    }

    const character = await characterService.addExperience(req.user!.userId, id, amount)

    res.status(200).json({
      success: true,
      data: character,
      message: `Postava získala ${amount} XP`
    })
  } catch (error) {
    console.error('Error v addExperience controller:', error)

    if (error instanceof Error && error.message === 'Postava nenalezena') {
      res.status(404).json({
        success: false,
        error: 'Postava nenalezena',
        message: error.message
      })
      return
    }

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se přidat experience',
      message: error instanceof Error ? error.message : 'Neznámá chyba'
    })
  }
}

/**
 * POST /api/characters/:id/ability-score-improvement
 * Aplikuje Ability Score Improvement (ASI)
 * Body: { improvements: { strength: 1, dexterity: 1 } } nebo { improvements: { intelligence: 2 } }
 */
export async function applyAbilityScoreImprovement(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { improvements } = req.body

    if (!improvements || typeof improvements !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Neplatná data',
        message: 'improvements musí být objekt s hodnotami statistik'
      })
      return
    }

    const character = await characterService.applyAbilityScoreImprovement(
      req.user!.userId,
      id,
      improvements
    )

    res.status(200).json({
      success: true,
      data: character,
      message: 'Ability Score Improvement byl úspěšně aplikován'
    })
  } catch (error) {
    console.error('Error v applyAbilityScoreImprovement controller:', error)

    if (error instanceof Error) {
      // Handle specific errors
      if (error.message === 'Postava nenalezena') {
        res.status(404).json({
          success: false,
          error: 'Postava nenalezena',
          message: error.message
        })
        return
      }

      if (error.message.includes('nemá nevyužité ASI') ||
          error.message.includes('Součet změn') ||
          error.message.includes('překročí maximum')) {
        res.status(400).json({
          success: false,
          error: 'Neplatný ASI request',
          message: error.message
        })
        return
      }
    }

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se aplikovat ASI',
      message: error instanceof Error ? error.message : 'Neznámá chyba'
    })
  }
}

/**
 * POST /api/characters/generate-backstory
 * Vygeneruje AI backstory pro postavu pomocí Gemini
 * Body: { name: string, race: string, class: string }
 */
export async function generateBackstory(req: Request, res: Response): Promise<void> {
  try {
    const { name, race, class: characterClass }: GenerateBackstoryRequest = req.body

    console.log(`✨ Generuji backstory pro ${name} (${race} ${characterClass})...`)

    // Zavolej Gemini AI
    const backstory = await geminiService.generateCharacterBackstory(
      req.user!.userId,
      name,
      race,
      characterClass
    )

    console.log(`✅ Backstory vygenerován (${backstory.length} znaků)`)

    res.status(200).json({
      success: true,
      data: { backstory },
      message: 'Backstory byl úspěšně vygenerován'
    })
  } catch (error: any) {
    console.error('Error v generateBackstory controller:', error)

    // Handle Gemini API quota exceeded (429)
    if (
      error.status === 429 ||
      error.message?.includes('quota') ||
      error.message?.includes('RESOURCE_EXHAUSTED') ||
      error.message?.includes('exceeded your current quota')
    ) {
      res.status(429).json({
        success: false,
        error: 'Quota Exceeded',
        message: 'Gemini API kvóta byla vyčerpána. Přidejte si vlastní API klíč v nastavení profilu nebo zkuste znovu později.',
        retryAfter: 60,
        helpUrl: '/profile'
      })
      return
    }

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se vygenerovat backstory',
      message: error instanceof Error ? error.message : 'Gemini API není dostupné'
    })
  }
}
