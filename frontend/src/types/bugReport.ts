// ═══════════════════════════════════════════════
// BUG REPORT TYPES
// ═══════════════════════════════════════════════

export type BugReportCategory = 'bug' | 'enhancement' | 'other'
export type BugReportSeverity = 'low' | 'medium' | 'high' | 'critical'
export type BugReportStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'wont_fix'

export interface BugReport {
  id: string
  userId: string | null
  userEmail?: string
  title: string
  description: string
  category: BugReportCategory
  severity: BugReportSeverity
  url: string | null
  userAgent: string | null
  screenshots: string[]
  status: BugReportStatus
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

export interface CreateBugReportInput {
  title: string
  description: string
  category: BugReportCategory
  severity: BugReportSeverity
  url?: string
  includeCurrentPage?: boolean
}

export interface UpdateBugReportInput {
  status?: BugReportStatus
  priority?: number
  assignedTo?: string | null
  adminNotes?: string
}

export interface ListBugReportsQuery {
  page?: number
  limit?: number
  status?: BugReportStatus
  category?: BugReportCategory
  severity?: BugReportSeverity
  assignedTo?: string
  sortBy?: 'createdAt' | 'severity' | 'priority' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface BugReportListResponse {
  success: boolean
  data: {
    reports: BugReport[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface BugReportStats {
  total: number
  open: number
  inProgress: number
  resolved: number
}

// Helper funkce pro zobrazování
export function getCategoryLabel(category: BugReportCategory): string {
  const labels: Record<BugReportCategory, string> = {
    bug: 'Chyba',
    enhancement: 'Vylepšení',
    other: 'Ostatní'
  }
  return labels[category]
}

export function getSeverityLabel(severity: BugReportSeverity): string {
  const labels: Record<BugReportSeverity, string> = {
    low: 'Nízká',
    medium: 'Střední',
    high: 'Vysoká',
    critical: 'Kritická'
  }
  return labels[severity]
}

export function getStatusLabel(status: BugReportStatus): string {
  const labels: Record<BugReportStatus, string> = {
    open: 'Otevřený',
    in_progress: 'Řeší se',
    resolved: 'Vyřešený',
    closed: 'Uzavřený',
    wont_fix: 'Nebude opraveno'
  }
  return labels[status]
}

export function getSeverityColor(severity: BugReportSeverity): string {
  const colors: Record<BugReportSeverity, string> = {
    low: 'text-blue-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-500'
  }
  return colors[severity]
}

export function getStatusColor(status: BugReportStatus): string {
  const colors: Record<BugReportStatus, string> = {
    open: 'text-yellow-400',
    in_progress: 'text-blue-400',
    resolved: 'text-green-400',
    closed: 'text-gray-400',
    wont_fix: 'text-red-400'
  }
  return colors[status]
}
