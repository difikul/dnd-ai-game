/**
 * Bug Report Store
 * Pinia store pro hlášení chyb a jejich správu
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as bugReportService from '@/services/bugReport.service'
import type {
  BugReport,
  CreateBugReportInput,
  UpdateBugReportInput,
  ListBugReportsQuery,
  BugReportStats
} from '@/types/bugReport'

export const useBugReportStore = defineStore('bugReport', () => {
  // ═══════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════

  const reports = ref<BugReport[]>([])
  const myReports = ref<BugReport[]>([])
  const currentReport = ref<BugReport | null>(null)
  const stats = ref<BugReportStats | null>(null)

  // Pagination
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalReports = ref(0)
  const limit = ref(20)

  // Loading states
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const isUploadingScreenshot = ref(false)

  // Error handling
  const error = ref<string | null>(null)

  // ═══════════════════════════════════════════════
  // ACTIONS - PUBLIC (authenticated users)
  // ═══════════════════════════════════════════════

  /**
   * Vytvoří nový bug report
   */
  async function createBugReport(input: CreateBugReportInput): Promise<BugReport> {
    isSubmitting.value = true
    error.value = null

    try {
      const report = await bugReportService.createBugReport(input)

      // Přidáme do myReports
      myReports.value.unshift(report)

      return report
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Nepodařilo se vytvořit bug report'
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Nahraje screenshot k bug reportu
   */
  async function uploadScreenshot(bugReportId: string, file: File): Promise<void> {
    isUploadingScreenshot.value = true
    error.value = null

    try {
      const updatedReport = await bugReportService.uploadScreenshot(bugReportId, file)

      // Aktualizujeme report v myReports
      const index = myReports.value.findIndex(r => r.id === bugReportId)
      if (index !== -1) {
        myReports.value[index] = updatedReport
      }

      // Aktualizujeme currentReport pokud je to ten samý
      if (currentReport.value?.id === bugReportId) {
        currentReport.value = updatedReport
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Nepodařilo se nahrát screenshot'
      throw err
    } finally {
      isUploadingScreenshot.value = false
    }
  }

  /**
   * Načte moje bug reporty
   */
  async function fetchMyBugReports(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      myReports.value = await bugReportService.getMyBugReports()
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Nepodařilo se načíst bug reporty'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ═══════════════════════════════════════════════
  // ACTIONS - ADMIN
  // ═══════════════════════════════════════════════

  /**
   * Načte seznam bug reportů (admin)
   */
  async function fetchBugReports(query: ListBugReportsQuery = {}): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await bugReportService.listBugReports({
        ...query,
        page: query.page || currentPage.value,
        limit: query.limit || limit.value
      })

      reports.value = response.reports
      currentPage.value = response.pagination.page
      totalPages.value = response.pagination.totalPages
      totalReports.value = response.pagination.total
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Nepodařilo se načíst bug reporty'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Načte detail bug reportu (admin)
   */
  async function fetchBugReportById(id: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      currentReport.value = await bugReportService.getBugReportById(id)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Nepodařilo se načíst bug report'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Aktualizuje bug report (admin)
   */
  async function updateBugReport(
    id: string,
    input: UpdateBugReportInput
  ): Promise<void> {
    isSubmitting.value = true
    error.value = null

    try {
      const updatedReport = await bugReportService.updateBugReport(id, input)

      // Aktualizujeme v seznamu
      const index = reports.value.findIndex(r => r.id === id)
      if (index !== -1) {
        reports.value[index] = updatedReport
      }

      // Aktualizujeme currentReport
      if (currentReport.value?.id === id) {
        currentReport.value = updatedReport
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Nepodařilo se aktualizovat bug report'
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Smaže bug report (admin)
   */
  async function deleteBugReport(id: string): Promise<void> {
    isSubmitting.value = true
    error.value = null

    try {
      await bugReportService.deleteBugReport(id)

      // Odstraníme ze seznamu
      reports.value = reports.value.filter(r => r.id !== id)

      // Pokud byl zobrazen detail, vyčistíme ho
      if (currentReport.value?.id === id) {
        currentReport.value = null
      }

      // Aktualizujeme celkový počet
      totalReports.value--
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Nepodařilo se smazat bug report'
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Načte statistiky bug reportů (admin)
   */
  async function fetchBugReportStats(): Promise<void> {
    try {
      stats.value = await bugReportService.getBugReportStats()
    } catch (err: any) {
      console.error('Chyba při načítání statistik bug reportů:', err)
      // Tiše selheme - statistiky nejsou kritické
    }
  }

  /**
   * Vyčistí chybu
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * Reset store
   */
  function $reset(): void {
    reports.value = []
    myReports.value = []
    currentReport.value = null
    stats.value = null
    currentPage.value = 1
    totalPages.value = 1
    totalReports.value = 0
    limit.value = 20
    isLoading.value = false
    isSubmitting.value = false
    isUploadingScreenshot.value = false
    error.value = null
  }

  return {
    // State
    reports,
    myReports,
    currentReport,
    stats,
    currentPage,
    totalPages,
    totalReports,
    limit,
    isLoading,
    isSubmitting,
    isUploadingScreenshot,
    error,

    // Actions - Public
    createBugReport,
    uploadScreenshot,
    fetchMyBugReports,

    // Actions - Admin
    fetchBugReports,
    fetchBugReportById,
    updateBugReport,
    deleteBugReport,
    fetchBugReportStats,

    // Helpers
    clearError,
    $reset
  }
})
