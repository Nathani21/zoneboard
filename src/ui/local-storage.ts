/**
 * Safe wrappers around localStorage. Some browsers and privacy settings block
 * storage and make it throw; when that happens, reads return null and writes
 * are skipped, so the app keeps working and simply doesn't remember anything.
 */

export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage blocked: nothing is remembered, but nothing breaks either
  }
}