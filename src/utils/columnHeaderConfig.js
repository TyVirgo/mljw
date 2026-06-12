export const COLUMN_HEADER_LANG_FIELDS = ['nameZh', 'nameEn', 'nameMs']

export function isColumnHeaderLangValueEmpty(value) {
  return !String(value ?? '').trim()
}

export function normalizeColumnHeaderLangValue(value, fallback = '') {
  const trimmed = String(value ?? '').trim()
  return trimmed || fallback
}

/** @returns {{ id: string, field: string }[]} */
export function validateColumnHeaderRows(rows) {
  const errors = []
  for (const row of rows) {
    for (const field of COLUMN_HEADER_LANG_FIELDS) {
      if (isColumnHeaderLangValueEmpty(row[field])) {
        errors.push({ id: row.id, field })
      }
    }
  }
  return errors
}

export function resolveColumnHeaderLabel(row, locale) {
  if (locale === 'zh') {
    return row.nameZh || row.nameEn || row.nameMs || row.id
  }
  if (locale === 'ms') {
    return row.nameMs || row.nameEn || row.nameZh || row.id
  }
  return row.nameEn || row.nameZh || row.nameMs || row.id
}

export function createColumnHeaderStore(storageKey, defaultRows) {
  function cloneDefaults() {
    return defaultRows.map((item) => ({ ...item }))
  }

  function load() {
    if (typeof localStorage === 'undefined') {
      return cloneDefaults()
    }

    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return cloneDefaults()

      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return cloneDefaults()

      return defaultRows.map((defaultRow) => {
        const saved = parsed.find((item) => item?.id === defaultRow.id)
        if (!saved) return { ...defaultRow }

        return {
          ...defaultRow,
          nameZh: normalizeColumnHeaderLangValue(saved.nameZh, defaultRow.nameZh),
          nameEn: normalizeColumnHeaderLangValue(saved.nameEn, defaultRow.nameEn),
          nameMs: normalizeColumnHeaderLangValue(saved.nameMs, defaultRow.nameMs),
        }
      })
    } catch {
      return cloneDefaults()
    }
  }

  function save(rows) {
    if (typeof localStorage === 'undefined') return

    const validationErrors = validateColumnHeaderRows(rows)
    if (validationErrors.length) {
      throw new Error('COLUMN_HEADER_LANG_REQUIRED')
    }

    const payload = rows.map(({ id, nameZh, nameEn, nameMs }) => ({
      id,
      nameZh: String(nameZh ?? '').trim(),
      nameEn: String(nameEn ?? '').trim(),
      nameMs: String(nameMs ?? '').trim(),
    }))

    localStorage.setItem(storageKey, JSON.stringify(payload))
  }

  return {
    storageKey,
    defaultRows,
    load,
    save,
    resolve: resolveColumnHeaderLabel,
  }
}
