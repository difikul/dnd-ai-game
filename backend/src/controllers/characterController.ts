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

    const character = await characterService.createCharacter(data)

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
    const characters = await characterService.getAllCharacters()

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

    const character = await characterService.getCharacter(id)

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
    const existingCharacter = await characterService.getCharacter(id)
    if (!existingCharacter) {
      res.status(404).json({
        success: false,
        error: 'Postava nenalezena',
        message: `Postava s ID ${id} neexistuje`
      })
      return
    }

    const character = await characterService.updateCharacter(id, data)

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
    const existingCharacter = await characterService.getCharacter(id)
    if (!existingCharacter) {
      res.status(404).json({
        success: false,
        error: 'Postava nenalezena',
        message: `Postava s ID ${id} neexistuje`
      })
      return
    }

    await characterService.deleteCharacter(id)

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

    const character = await characterService.modifyHP(id, amount)

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

    const character = await characterService.addExperience(id, amount)

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
  } catch (error) {
    console.error('Error v generateBackstory controller:', error)

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se vygenerovat backstory',
      message: error instanceof Error ? error.message : 'Gemini API není dostupné'
    })
  }
}
