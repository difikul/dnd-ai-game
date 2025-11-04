import api from './api.service'
import type {
  BugReport,
  CreateBugReportInput,
  UpdateBugReportInput,
  ListBugReportsQuery,
  BugReportListResponse,
  BugReportStats
} from '@/types/bugReport'

// ═══════════════════════════════════════════════
// PUBLIC API (authenticated users)
// ═══════════════════════════════════════════════

/**
 * Vytvoří nový bug report
 */
export async function createBugReport(
  input: CreateBugReportInput
): Promise<BugReport> {
  const response = await api.post('/api/bug-reports', input)
  return response.data.data
}

/**
 * Nahraje screenshot k bug reportu
 */
export async function uploadScreenshot(
  bugReportId: string,
  file: File
): Promise<BugReport> {
  const formData = new FormData()
  formData.append('screenshot', file)

  const response = await api.post(`/api/bug-reports/${bugReportId}/screenshot`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response.data.data
}

/**
 * Získá moje bug reporty
 */
export async function getMyBugReports(): Promise<BugReport[]> {
  const response = await api.get('/api/bug-reports/my')
  return response.data.data
}

// ═══════════════════════════════════════════════
// ADMIN API
// ═══════════════════════════════════════════════

/**
 * Získá seznam všech bug reportů s filtrováním (admin only)
 */
export async function listBugReports(
  query: ListBugReportsQuery = {}
): Promise<BugReportListResponse['data']> {
  const params = new URLSearchParams()

  if (query.page) params.append('page', query.page.toString())
  if (query.limit) params.append('limit', query.limit.toString())
  if (query.status) params.append('status', query.status)
  if (query.category) params.append('category', query.category)
  if (query.severity) params.append('severity', query.severity)
  if (query.assignedTo) params.append('assignedTo', query.assignedTo)
  if (query.sortBy) params.append('sortBy', query.sortBy)
  if (query.sortOrder) params.append('sortOrder', query.sortOrder)

  const response = await api.get(`/api/bug-reports/admin?${params.toString()}`)
  return response.data.data
}

/**
 * Získá detail bug reportu (admin only)
 */
export async function getBugReportById(id: string): Promise<BugReport> {
  const response = await api.get(`/api/bug-reports/admin/${id}`)
  return response.data.data
}

/**
 * Aktualizuje bug report (admin only)
 */
export async function updateBugReport(
  id: string,
  input: UpdateBugReportInput
): Promise<BugReport> {
  const response = await api.patch(`/api/bug-reports/admin/${id}`, input)
  return response.data.data
}

/**
 * Smaže bug report (admin only)
 */
export async function deleteBugReport(id: string): Promise<void> {
  await api.delete(`/api/bug-reports/admin/${id}`)
}

/**
 * Získá statistiky bug reportů (admin only)
 */
export async function getBugReportStats(): Promise<BugReportStats> {
  const response = await api.get('/api/bug-reports/admin/stats')
  return response.data.data
}
