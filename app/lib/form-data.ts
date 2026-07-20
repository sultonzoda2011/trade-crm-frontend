/**
 * Converts a plain form data object into a FormData instance.
 *
 * Rules:
 *  - null / undefined  → skipped
 *  - File              → appended as-is (triggers multipart/form-data)
 *  - Date              → ISO 8601 string
 *  - everything else   → String(value)
 */
export function appendToFormData(data: Record<string, unknown>): FormData {
  const fd = new FormData()

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue

    if (value instanceof File) {
      fd.append(key, value)
    } else if (value instanceof Date) {
      fd.append(key, value.toISOString())
    } else {
      fd.append(key, String(value))
    }
  }

  return fd
}