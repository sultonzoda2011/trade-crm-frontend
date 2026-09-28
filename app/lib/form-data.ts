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
  const fd = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;

    if (value instanceof File) {
      fd.append(key, value);
    } else if (value instanceof Date) {
      fd.append(key, value.toISOString());
    } else {
      fd.append(key, String(value));
    }
  }

  return fd;
}

/**
 * Form values → the multipart body an image-bearing endpoint expects, so pages
 * stop hand-rolling the same two rules: the picked file goes under `fileKey`
 * (and a leftover avatar *string* under that same key is dropped, because the
 * backend only accepts an upload there), and empty fields are omitted rather
 * than sent as `''` — which each page used to spell as `value || undefined`.
 *
 * Values are otherwise passed through `appendToFormData` unchanged, so the wire
 * format is identical to what those pages built by hand.
 */
export function buildMultipart(data: Record<string, unknown>, fileKey = 'image'): FormData {
  const entries: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === fileKey) {
      if (value instanceof File) entries[key] = value;
      continue;
    }
    if (value === '' || value === null || value === undefined) continue;
    entries[key] = value;
  }

  return appendToFormData(entries);
}
