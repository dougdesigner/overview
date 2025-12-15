/**
 * Local Storage utility functions for portfolio data management
 */

const STORAGE_VERSION = '1.0.0'
const STORAGE_KEYS = {
  accounts: 'portfolio_accounts',
  holdings: 'portfolio_holdings',
  version: 'portfolio_version',
  lastUpdated: 'portfolio_lastUpdated',
  BENCHMARK: 'benchmark_selected',
} as const

export interface StorageData<T> {
  version: string
  data: T
  timestamp: number
}

/**
 * Safely get data from localStorage with error handling
 */
export function getFromStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    const parsed: StorageData<T> = JSON.parse(item)

    // Version check for future migrations
    if (parsed.version !== STORAGE_VERSION) {
      console.warn(`Storage version mismatch for ${key}. Expected ${STORAGE_VERSION}, got ${parsed.version}`)
      // In future, add migration logic here
    }

    return parsed.data
  } catch (error) {
    console.error(`Error reading from localStorage for key ${key}:`, error)
    return null
  }
}

/**
 * Safely set data in localStorage with error handling
 */
export function setToStorage<T>(key: string, data: T): boolean {
  try {
    const storageData: StorageData<T> = {
      version: STORAGE_VERSION,
      data,
      timestamp: Date.now(),
    }

    localStorage.setItem(key, JSON.stringify(storageData))
    return true
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof DOMException && error.code === 22) {
      console.error('localStorage quota exceeded')
      // Could implement cleanup of old data here
    } else {
      console.error(`Error writing to localStorage for key ${key}:`, error)
    }
    return false
  }
}

/**
 * Remove data from localStorage
 */
export function removeFromStorage(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error removing from localStorage for key ${key}:`, error)
    return false
  }
}

/**
 * Clear all portfolio data from localStorage
 */
export function clearPortfolioData(): boolean {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    return true
  } catch (error) {
    console.error('Error clearing portfolio data:', error)
    return false
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Get storage size in bytes
 */
export function getStorageSize(): number {
  let totalSize = 0

  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const item = localStorage.getItem(key)
        if (item) {
          totalSize += key.length + item.length
        }
      }
    }
  } catch (error) {
    console.error('Error calculating storage size:', error)
  }

  return totalSize
}

/**
 * Export all portfolio data as JSON
 */
export function exportPortfolioData() {
  const data = {
    version: STORAGE_VERSION,
    exportDate: new Date().toISOString(),
    accounts: getFromStorage(STORAGE_KEYS.accounts),
    holdings: getFromStorage(STORAGE_KEYS.holdings),
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Import portfolio data from JSON file
 */
export function importPortfolioData(file: File): Promise<{ accounts: any[], holdings: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        // Validate structure
        if (!data.accounts || !data.holdings) {
          throw new Error('Invalid portfolio data structure')
        }

        resolve({
          accounts: data.accounts,
          holdings: data.holdings,
        })
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export { STORAGE_KEYS }