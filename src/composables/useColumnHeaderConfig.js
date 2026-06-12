import { ref } from 'vue'
import { useAppI18n } from './useAppI18n.js'

export function useColumnHeaderConfig(store) {
  const columnHeadersRef = ref(store.load())
  let headerVersion = 0

  const { locale } = useAppI18n()

  function refresh() {
    columnHeadersRef.value = store.load()
    headerVersion += 1
  }

  function headerLabel(id) {
    headerVersion
    locale.value
    const row = columnHeadersRef.value.find((item) => item.id === id)
    if (!row) return id
    return store.resolve(row, locale.value)
  }

  function getEditableRows() {
    return columnHeadersRef.value.map((item) => ({ ...item }))
  }

  function save(rows) {
    store.save(rows)
    refresh()
  }

  return {
    headerLabel,
    getEditableRows,
    save,
    refresh,
    defaultRows: store.defaultRows,
  }
}
