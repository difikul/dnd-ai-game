import { Request, Response } from 'express'
import {
  createBugReportSchema,
  updateBugReportSchema,
  listBugReportsQuerySchema
} from '../types/bugReport.types'
import * as bugReportService from '../services/bugReportService'

// ═══════════════════════════════════════════════
// PUBLIC ENDPOINTS (authenticated users)
// ═══════════════════════════════════════════════

/**
 * POST /api/bug-reports
 * Vytvoří nový bug report
 */
const createBugReport = async (req: Request, res: Response) => {
  try {
    // Validace inputu
    const validatedInput = createBugReportSchema.parse(req.body)

    // User ID z JWT tokenu (nastaveno authenticateToken middleware)
    const userId = (req as any).user.userId

    // User agent z headeru
    const userAgent = req.get('user-agent')

    const bugReport = await bugReportService.createBugReport(
      userId,
      validatedInput,
      userAgent
    )

    res.status(201).json({
      success: true,
      data: bugReport,
      message: 'Bug report byl úspěšně vytvořen'
    })
  } catch (error: any) {
    console.error('Chyba při vytváření bug reportu:', error)

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Neplatná data',
        details: error.errors
      })
    }

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se vytvořit bug report'
    })
  }
}

/**
 * POST /api/bug-reports/:id/screenshot
 * Přidá screenshot k bug reportu
 */
const addScreenshot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).user.userId

    // Zkontrolujeme, zda byl soubor nahrán
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Screenshot nebyl nahrán'
      })
    }

    // Získáme relativní cestu k souboru (pouze název souboru)
    const screenshotPath = req.file.filename

    const updatedReport = await bugReportService.addScreenshotToBugReport(
      id,
      userId,
      screenshotPath
    )

    res.status(200).json({
      success: true,
      data: updatedReport,
      message: 'Screenshot byl úspěšně přidán'
    })
  } catch (error: any) {
    console.error('Chyba při přidávání screenshotu:', error)

    if (error.message === 'Bug report nenalezen') {
      return res.status(404).json({
        success: false,
        error: error.message
      })
    }

    if (error.message === 'Nemáte oprávnění upravovat tento bug report') {
      return res.status(403).json({
        success: false,
        error: error.message
      })
    }

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se přidat screenshot'
    })
  }
}

/**
 * GET /api/bug-reports/my
 * Získá bug reporty aktuálního uživatele
 */
const getMyBugReports = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId

    const reports = await bugReportService.getMyBugReports(userId)

    res.status(200).json({
      success: true,
      data: reports
    })
  } catch (error: any) {
    console.error('Chyba při načítání mých bug reportů:', error)

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se načíst bug reporty'
    })
  }
}

// ═══════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════

/**
 * GET /api/admin/bug-reports
 * Získá seznam všech bug reportů s filtrováním (admin only)
 */
const listBugReports = async (req: Request, res: Response) => {
  try {
    // Validace query parametrů
    const query = listBugReportsQuerySchema.parse(req.query)

    const result = await bugReportService.listBugReports(query)

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Chyba při načítání bug reportů:', error)

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Neplatné query parametry',
        details: error.errors
      })
    }

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se načíst bug reporty'
    })
  }
}

/**
 * GET /api/admin/bug-reports/:id
 * Získá detail bug reportu (admin only)
 */
const getBugReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const report = await bugReportService.getBugReportById(id)

    res.status(200).json({
      success: true,
      data: report
    })
  } catch (error: any) {
    console.error('Chyba při načítání bug reportu:', error)

    if (error.message === 'Bug report nenalezen') {
      return res.status(404).json({
        success: false,
        error: error.message
      })
    }

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se načíst bug report'
    })
  }
}

/**
 * PATCH /api/admin/bug-reports/:id
 * Aktualizuje bug report (admin only)
 */
const updateBugReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const adminId = (req as any).user.userId

    // Validace inputu
    const validatedInput = updateBugReportSchema.parse(req.body)

    const updatedReport = await bugReportService.updateBugReport(
      id,
      adminId,
      validatedInput
    )

    res.status(200).json({
      success: true,
      data: updatedReport,
      message: 'Bug report byl úspěšně aktualizován'
    })
  } catch (error: any) {
    console.error('Chyba při aktualizaci bug reportu:', error)

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Neplatná data',
        details: error.errors
      })
    }

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se aktualizovat bug report'
    })
  }
}

/**
 * DELETE /api/admin/bug-reports/:id
 * Smaže bug report (admin only)
 */
const deleteBugReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await bugReportService.deleteBugReport(id)

    res.status(200).json({
      success: true,
      message: 'Bug report byl úspěšně smazán'
    })
  } catch (error: any) {
    console.error('Chyba při mazání bug reportu:', error)

    if (error.message === 'Bug report nenalezen') {
      return res.status(404).json({
        success: false,
        error: error.message
      })
    }

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se smazat bug report'
    })
  }
}

/**
 * GET /api/admin/bug-reports/stats
 * Získá statistiky bug reportů (admin only)
 */
const getBugReportStats = async (req: Request, res: Response) => {
  try {
    const stats = await bugReportService.getBugReportStats()

    res.status(200).json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('Chyba při načítání statistik bug reportů:', error)

    res.status(500).json({
      success: false,
      error: 'Nepodařilo se načíst statistiky'
    })
  }
}

// Export controller functions
export default {
  // Public
  createBugReport,
  addScreenshot,
  getMyBugReports,

  // Admin
  listBugReports,
  getBugReportById,
  updateBugReport,
  deleteBugReport,
  getBugReportStats
}
