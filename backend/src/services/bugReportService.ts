import { PrismaClient } from '@prisma/client'
import {
  CreateBugReportInput,
  UpdateBugReportInput,
  ListBugReportsQuery,
  BugReportDTO
} from '../types/bugReport.types'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

// ═══════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════

/**
 * Mapuje Prisma BugReport na BugReportDTO
 */
function mapBugReportToDTO(report: any): BugReportDTO {
  return {
    id: report.id,
    userId: report.userId,
    userEmail: report.user?.email,
    title: report.title,
    description: report.description,
    category: report.category,
    severity: report.severity,
    url: report.url,
    userAgent: report.userAgent,
    screenshots: Array.isArray(report.screenshots) ? report.screenshots : [],
    status: report.status,
    priority: report.priority,
    assignedTo: report.assignedTo,
    assignedAdminEmail: report.assignedAdmin?.email,
    adminNotes: report.adminNotes,
    resolvedAt: report.resolvedAt,
    resolvedBy: report.resolvedBy,
    resolverEmail: report.resolver?.email,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  }
}

// ═══════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════

/**
 * Vytvoří nový bug report
 */
export async function createBugReport(
  userId: string,
  input: CreateBugReportInput,
  userAgent?: string
): Promise<BugReportDTO> {
  const report = await prisma.bugReport.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      category: input.category,
      severity: input.severity,
      url: input.url || null,
      userAgent: userAgent || null,
      screenshots: []
    },
    include: {
      user: {
        select: { email: true }
      }
    }
  })

  return mapBugReportToDTO(report)
}

/**
 * Přidá screenshot k existujícímu bug reportu
 */
export async function addScreenshotToBugReport(
  bugReportId: string,
  userId: string,
  screenshotPath: string
): Promise<BugReportDTO> {
  // Ověříme, že bug report patří uživateli
  const report = await prisma.bugReport.findUnique({
    where: { id: bugReportId }
  })

  if (!report) {
    throw new Error('Bug report nenalezen')
  }

  if (report.userId !== userId) {
    throw new Error('Nemáte oprávnění upravovat tento bug report')
  }

  // Přidáme screenshot do pole
  const currentScreenshots = Array.isArray(report.screenshots)
    ? report.screenshots
    : []

  const updatedReport = await prisma.bugReport.update({
    where: { id: bugReportId },
    data: {
      screenshots: [...currentScreenshots, screenshotPath]
    },
    include: {
      user: {
        select: { email: true }
      }
    }
  })

  return mapBugReportToDTO(updatedReport)
}

/**
 * Získá seznam bug reportů s filtrováním a paginací (admin)
 */
export async function listBugReports(query: ListBugReportsQuery) {
  const { page, limit, status, category, severity, assignedTo, sortBy, sortOrder } = query

  // Build WHERE clause
  const where: any = {}
  if (status) where.status = status
  if (category) where.category = category
  if (severity) where.severity = severity
  if (assignedTo) where.assignedTo = assignedTo

  // Count total
  const total = await prisma.bugReport.count({ where })

  // Fetch reports
  const reports = await prisma.bugReport.findMany({
    where,
    include: {
      user: {
        select: { email: true }
      },
      assignedAdmin: {
        select: { email: true }
      },
      resolver: {
        select: { email: true }
      }
    },
    orderBy: {
      [sortBy]: sortOrder
    },
    skip: (page - 1) * limit,
    take: limit
  })

  return {
    reports: reports.map(mapBugReportToDTO),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

/**
 * Získá detail bug reportu
 */
export async function getBugReportById(
  bugReportId: string
): Promise<BugReportDTO> {
  const report = await prisma.bugReport.findUnique({
    where: { id: bugReportId },
    include: {
      user: {
        select: { email: true }
      },
      assignedAdmin: {
        select: { email: true }
      },
      resolver: {
        select: { email: true }
      }
    }
  })

  if (!report) {
    throw new Error('Bug report nenalezen')
  }

  return mapBugReportToDTO(report)
}

/**
 * Získá bug reporty aktuálního uživatele
 */
export async function getMyBugReports(userId: string): Promise<BugReportDTO[]> {
  const reports = await prisma.bugReport.findMany({
    where: { userId },
    include: {
      user: {
        select: { email: true }
      },
      assignedAdmin: {
        select: { email: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return reports.map(mapBugReportToDTO)
}

/**
 * Aktualizuje bug report (admin only)
 */
export async function updateBugReport(
  bugReportId: string,
  adminId: string,
  input: UpdateBugReportInput
): Promise<BugReportDTO> {
  const updateData: any = {}

  if (input.status !== undefined) {
    updateData.status = input.status

    // Pokud je status RESOLVED, nastavíme resolvedAt a resolvedBy
    if (input.status === 'resolved') {
      updateData.resolvedAt = new Date()
      updateData.resolvedBy = adminId
    }
  }

  if (input.priority !== undefined) updateData.priority = input.priority
  if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo
  if (input.adminNotes !== undefined) updateData.adminNotes = input.adminNotes

  const updatedReport = await prisma.bugReport.update({
    where: { id: bugReportId },
    data: updateData,
    include: {
      user: {
        select: { email: true }
      },
      assignedAdmin: {
        select: { email: true }
      },
      resolver: {
        select: { email: true }
      }
    }
  })

  return mapBugReportToDTO(updatedReport)
}

/**
 * Smaže bug report (admin only)
 */
export async function deleteBugReport(bugReportId: string): Promise<void> {
  // Nejdřív získáme report abychom mohli smazat screenshoty
  const report = await prisma.bugReport.findUnique({
    where: { id: bugReportId }
  })

  if (!report) {
    throw new Error('Bug report nenalezen')
  }

  // Smažeme screenshoty z disku
  const screenshots = Array.isArray(report.screenshots) ? report.screenshots : []
  for (const screenshot of screenshots) {
    try {
      const fullPath = path.join(__dirname, '../../uploads/screenshots', screenshot)
      await fs.unlink(fullPath)
    } catch (error) {
      console.error(`Nepodařilo se smazat screenshot ${screenshot}:`, error)
      // Pokračujeme dál i když se nepodaří smazat soubor
    }
  }

  // Smažeme bug report z databáze
  await prisma.bugReport.delete({
    where: { id: bugReportId }
  })
}

/**
 * Získá statistiky bug reportů (pro admin dashboard)
 */
export async function getBugReportStats() {
  const [total, open, inProgress, resolved] = await Promise.all([
    prisma.bugReport.count(),
    prisma.bugReport.count({ where: { status: 'open' } }),
    prisma.bugReport.count({ where: { status: 'in_progress' } }),
    prisma.bugReport.count({ where: { status: 'resolved' } })
  ])

  return {
    total,
    open,
    inProgress,
    resolved
  }
}
