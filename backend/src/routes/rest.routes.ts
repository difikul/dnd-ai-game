/**
 * REST Routes
 * Endpointy pro long rest a short rest mechaniku
 */

import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import * as validationService from '../services/validationService'
import { prisma } from '../config/database'

const router = Router()

/**
 * POST /api/rest/long-rest/:sessionId
 * Provede long rest - obnoví všechny spell sloty, HP a class feature uses
 */
router.post('/long-rest/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId = req.user!.id

    console.log(`💤 Long Rest request pro session ${sessionId}`)

    // Načti session s character + validace ownership
    const session = await prisma.gameSession.findFirst({
      where: {
        id: sessionId,
        userId // Kontrola ownership
      },
      include: {
        character: {
          include: {
            spellSlots: true,
            classFeatures: true
          }
        }
      }
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Herní session nenalezena nebo nemáte oprávnění'
      })
    }

    // Perform long rest
    await validationService.performLongRest(session.characterId)

    // Obnov class feature uses
    const classFeatures = session.character.classFeatures
    for (const feature of classFeatures) {
      if (feature.usesPerRest !== null && feature.currentUses !== null) {
        await prisma.classFeature.update({
          where: { id: feature.id },
          data: { currentUses: feature.usesPerRest }
        })
      }
    }

    console.log(`✅ Long Rest dokončen pro ${session.character.name}`)

    // Vytvoř system message
    await prisma.message.create({
      data: {
        sessionId,
        role: 'system',
        content: `💤 **Long Rest dokončen!**

✅ **Obnoveno:**
- ❤️  HP na maximum (${session.character.maxHitPoints})
- ⚡ Všechny spell sloty
- 🎭 Všechny class feature uses

Tvá postava je odpočinutá a připravená na další dobrodružství!`
      }
    })

    // Update session timestamp
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { lastPlayedAt: new Date() }
    })

    res.json({
      success: true,
      message: 'Long rest completed',
      data: {
        hp: session.character.maxHitPoints,
        spellSlotsRestored: session.character.spellSlots.length
      }
    })
  } catch (error: any) {
    console.error('❌ Chyba při Long Rest:', error)
    res.status(500).json({
      success: false,
      message: 'Nepodařilo se provést long rest',
      error: error.message
    })
  }
})

/**
 * POST /api/rest/short-rest/:sessionId
 * Provede short rest - obnoví některé class features (Fighter: Second Wind, atd.)
 * Warlock obnovuje spell sloty i při short rest
 */
router.post('/short-rest/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId = req.user!.id

    console.log(`☕ Short Rest request pro session ${sessionId}`)

    // Načti session s character + validace ownership
    const session = await prisma.gameSession.findFirst({
      where: {
        id: sessionId,
        userId
      },
      include: {
        character: {
          include: {
            spellSlots: true,
            classFeatures: true
          }
        }
      }
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Herní session nenalezena nebo nemáte oprávnění'
      })
    }

    // Perform short rest
    await validationService.performShortRest(session.characterId)

    let restoredInfo = []

    // Warlock obnovuje spell sloty i při short rest
    if (session.character.class === 'Warlock') {
      restoredInfo.push('⚡ Všechny spell sloty (Warlock pact magic)')
    }

    // TODO: Obnov class feature uses které se obnovují při short rest
    // Fighter: Second Wind, Action Surge
    // Monk: Ki points
    // atd.

    console.log(`✅ Short Rest dokončen pro ${session.character.name}`)

    // Vytvoř system message
    await prisma.message.create({
      data: {
        sessionId,
        role: 'system',
        content: `☕ **Short Rest dokončen!**

Odpočinul sis hodinu a získal jsi zpět síly.

${restoredInfo.length > 0 ? `✅ **Obnoveno:**\n${restoredInfo.join('\n')}` : 'ℹ️  Žádné zdroje k obnovení při short rest.'}

Tip: Pro plné obnovení HP a spell slotů použij **Long Rest** (8 hodin).`
      }
    })

    // Update session timestamp
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { lastPlayedAt: new Date() }
    })

    res.json({
      success: true,
      message: 'Short rest completed',
      data: {
        restoredFeatures: restoredInfo
      }
    })
  } catch (error: any) {
    console.error('❌ Chyba při Short Rest:', error)
    res.status(500).json({
      success: false,
      message: 'Nepodařilo se provést short rest',
      error: error.message
    })
  }
})

export default router
