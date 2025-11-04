import { z } from 'zod'

// ═══════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════

export const BugReportCategory = {
  BUG: 'bug',
  ENHANCEMENT: 'enhancement',
  OTHER: 'other'
} as const

export const BugReportSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const

export const BugReportStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  WONT_FIX: 'wont_fix'
} as const

// ═══════════════════════════════════════════════
// ZOD SCHEMAS PRO VALIDACI
// ═══════════════════════════════════════════════

// Schema pro vytvoření bug reportu
export const createBugReportSchema = z.object({
  title: z
    .string()
    .min(3, 'Název musí mít alespoň 3 znaky')
    .max(200, 'Název může mít maximálně 200 znaků'),
  description: z
    .string()
    .min(10, 'Popis musí mít alespoň 10 znaků')
    .max(5000, 'Popis může mít maximálně 5000 znaků'),
  category: z.enum([
    BugReportCategory.BUG,
    BugReportCategory.ENHANCEMENT,
    BugReportCategory.OTHER
  ]),
  severity: z.enum([
    BugReportSeverity.LOW,
    BugReportSeverity.MEDIUM,
    BugReportSeverity.HIGH,
    BugReportSeverity.CRITICAL
  ]),
  url: z.string().url().optional().or(z.literal('')),
  includeCurrentPage: z.boolean().optional()
})

// Schema pro update bug reportu (admin)
export const updateBugReportSchema = z.object({
  status: z
    .enum([
      BugReportStatus.OPEN,
      BugReportStatus.IN_PROGRESS,
      BugReportStatus.RESOLVED,
      BugReportStatus.CLOSED,
      BugReportStatus.WONT_FIX
    ])
    .optional(),
  priority: z.number().min(0).max(4).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  adminNotes: z.string().max(5000).optional()
})

// Schema pro query parametry při listingu
export const listBugReportsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z
    .enum([
      BugReportStatus.OPEN,
      BugReportStatus.IN_PROGRESS,
      BugReportStatus.RESOLVED,
      BugReportStatus.CLOSED,
      BugReportStatus.WONT_FIX
    ])
    .optional(),
  category: z
    .enum([
      BugReportCategory.BUG,
      BugReportCategory.ENHANCEMENT,
      BugReportCategory.OTHER
    ])
    .optional(),
  severity: z
    .enum([
      BugReportSeverity.LOW,
      BugReportSeverity.MEDIUM,
      BugReportSeverity.HIGH,
      BugReportSeverity.CRITICAL
    ])
    .optional(),
  assignedTo: z.string().uuid().optional(),
  sortBy: z
    .enum(['createdAt', 'severity', 'priority', 'updatedAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// ═══════════════════════════════════════════════
// TYPESCRIPT TYPES
// ═══════════════════════════════════════════════

export type CreateBugReportInput = z.infer<typeof createBugReportSchema>
export type UpdateBugReportInput = z.infer<typeof updateBugReportSchema>
export type ListBugReportsQuery = z.infer<typeof listBugReportsQuerySchema>

export interface BugReportDTO {
  id: string
  userId: string | null
  userEmail?: string
  title: string
  description: string
  category: string
  severity: string
  url: string | null
  userAgent: string | null
  screenshots: string[]
  status: string
  priority: number
  assignedTo: string | null
  assignedAdminEmail?: string
  adminNotes: string | null
  resolvedAt: Date | null
  resolvedBy: string | null
  resolverEmail?: string
  createdAt: Date
  updatedAt: Date
}

export interface BugReportListResponse {
  success: boolean
  data: {
    reports: BugReportDTO[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface BugReportDetailResponse {
  success: boolean
  data: BugReportDTO
}
