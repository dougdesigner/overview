/**
 * IndexedDB Backup System for Portfolio Data
 * Provides automatic backup and recovery of portfolio data
 */

const DB_NAME = "PortfolioBackup"
const DB_VERSION = 1
const STORE_NAME = "backups"
const MAX_BACKUPS = 10

export interface PortfolioBackup {
  id?: number
  timestamp: number
  accounts: any[]
  holdings: any[]
  version: string
}

/**
 * Initialize IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        })
        // Index by timestamp for easy sorting
        objectStore.createIndex("timestamp", "timestamp", { unique: false })
      }
    }
  })
}

/**
 * Save portfolio data to IndexedDB
 */
export async function saveBackupToIndexedDB(
  accounts: any[],
  holdings: any[],
  version: string = "1.0.0"
): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    const backup: PortfolioBackup = {
      timestamp: Date.now(),
      accounts,
      holdings,
      version,
    }

    // Add the backup
    store.add(backup)

    // Clean up old backups - keep only last MAX_BACKUPS
    const index = store.index("timestamp")
    const getAllRequest = index.getAll()

    getAllRequest.onsuccess = () => {
      const allBackups = getAllRequest.result as PortfolioBackup[]

      // Sort by timestamp descending
      allBackups.sort((a, b) => b.timestamp - a.timestamp)

      // Delete old backups beyond MAX_BACKUPS
      if (allBackups.length > MAX_BACKUPS) {
        const backupsToDelete = allBackups.slice(MAX_BACKUPS)
        backupsToDelete.forEach((backup) => {
          if (backup.id) {
            store.delete(backup.id)
          }
        })
      }
    }

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(undefined)
      transaction.onerror = () => reject(transaction.error)
    })

    console.log("✅ Portfolio backup saved to IndexedDB")
  } catch (error) {
    console.error("Failed to save backup to IndexedDB:", error)
  }
}

/**
 * Get the most recent backup from IndexedDB
 */
export async function getLatestBackupFromIndexedDB(): Promise<PortfolioBackup | null> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index("timestamp")

    // Get all backups and find the most recent
    const getAllRequest = index.getAll()

    const allBackups = await new Promise<PortfolioBackup[]>((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result)
      getAllRequest.onerror = () => reject(getAllRequest.error)
    })

    if (allBackups.length === 0) {
      return null
    }

    // Sort by timestamp descending and return the most recent
    allBackups.sort((a, b) => b.timestamp - a.timestamp)
    return allBackups[0]
  } catch (error) {
    console.error("Failed to get backup from IndexedDB:", error)
    return null
  }
}

/**
 * Get all backups from IndexedDB (sorted by timestamp descending)
 */
export async function getAllBackupsFromIndexedDB(): Promise<PortfolioBackup[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index("timestamp")

    const getAllRequest = index.getAll()

    const allBackups = await new Promise<PortfolioBackup[]>((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result)
      getAllRequest.onerror = () => reject(getAllRequest.error)
    })

    // Sort by timestamp descending
    allBackups.sort((a, b) => b.timestamp - a.timestamp)
    return allBackups
  } catch (error) {
    console.error("Failed to get all backups from IndexedDB:", error)
    return []
  }
}

/**
 * Delete all backups from IndexedDB
 */
export async function clearIndexedDBBackups(): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    store.clear()

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(undefined)
      transaction.onerror = () => reject(transaction.error)
    })

    console.log("🗑️ All IndexedDB backups cleared")
  } catch (error) {
    console.error("Failed to clear IndexedDB backups:", error)
  }
}

/**
 * Format backup age for display
 */
export function getBackupAge(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  return `${days} day${days > 1 ? "s" : ""} ago`
}

/**
 * Format backup timestamp for display
 */
export function formatBackupDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}
