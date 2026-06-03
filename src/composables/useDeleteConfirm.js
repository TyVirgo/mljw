import { ref } from 'vue'

export function useDeleteConfirm(defaultMessage = 'Are you sure you want to delete this record?') {
  const visible = ref(false)
  const message = ref(defaultMessage)
  let pendingAction = null

  function requestDelete(action, customMessage) {
    pendingAction = action
    message.value = customMessage || defaultMessage
    visible.value = true
  }

  function confirmDelete() {
    pendingAction?.()
    pendingAction = null
    visible.value = false
  }

  function cancelDelete() {
    pendingAction = null
    visible.value = false
  }

  return {
    deleteConfirmVisible: visible,
    deleteConfirmMessage: message,
    requestDelete,
    confirmDelete,
    cancelDelete,
  }
}
