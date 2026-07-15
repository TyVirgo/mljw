import { ref } from 'vue'

const queuePhase = ref('idle') // idle | waiting | success
const queueContext = ref(null)
const successContext = ref(null)
const waitSeconds = ref(0)
const queueSize = ref(0)
const queuePosition = ref(0)

let timerId = null
let positionTimerId = null
let resolveCallback = null

function clearTimer() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
  if (positionTimerId) {
    clearInterval(positionTimerId)
    positionTimerId = null
  }
}

function simulateQueueStats(totalWait) {
  queueSize.value = 80 + Math.floor(Math.random() * 120)
  queuePosition.value = Math.min(queueSize.value, 12 + Math.floor(Math.random() * 30))
  positionTimerId = setInterval(() => {
    if (queuePosition.value <= 1) return
    queuePosition.value = Math.max(1, queuePosition.value - (Math.random() > 0.4 ? 1 : 0))
  }, 700)
}

function buildSuccessCourses(context) {
  if (context?.courses?.length) return context.courses
  if (!context?.courseCode) return []
  return [
    {
      courseCode: context.courseCode,
      courseName: context.courseName,
      sectionCode: context.section,
      time: context.time,
      room: context.room,
      lecturer: context.lecturer,
      credits: context.credits,
    },
  ]
}

/**
 * 模拟高并发选课队列（12306 式：排队 → 成功）
 */
export function runRegistrationQueue(context, options = {}) {
  const minWait = options.minWait ?? 5
  const maxWait = options.maxWait ?? 8
  const totalWait = minWait + Math.floor(Math.random() * (maxWait - minWait + 1))
  const showSuccess = options.showSuccess !== false

  return new Promise((resolve, reject) => {
    clearTimer()
    queueContext.value = {
      ...context,
      lockingMessage: true,
    }
    waitSeconds.value = totalWait
    queuePhase.value = 'waiting'
    successContext.value = null
    simulateQueueStats(totalWait)
    resolveCallback = { resolve, reject, options }

    timerId = setInterval(() => {
      waitSeconds.value -= 1
      if (waitSeconds.value <= 0) {
        clearTimer()
        const result = options.onComplete?.(context) ?? { ok: true }
        if (showSuccess) {
          queuePhase.value = 'success'
          successContext.value = {
            ...context,
            registeredCourses: buildSuccessCourses(context),
            registeredAt: new Date().toLocaleDateString('en-GB'),
          }
          queueContext.value = null
        } else {
          resetQueue()
        }
        resolve(result)
        resolveCallback = null
      }
    }, 1000)
  })
}

export function cancelRegistrationQueue() {
  clearTimer()
  resetQueue()
  if (resolveCallback) {
    resolveCallback.reject(new Error('cancelled'))
    resolveCallback = null
  }
}

function resetQueue() {
  queuePhase.value = 'idle'
  queueContext.value = null
  successContext.value = null
  waitSeconds.value = 0
  queueSize.value = 0
  queuePosition.value = 0
}

export function dismissRegistrationSuccess() {
  resetQueue()
}

export function useRegistrationQueue() {
  return {
    queuePhase,
    queueVisible: queuePhase,
    queueContext,
    successContext,
    successVisible: queuePhase,
    waitSeconds,
    queueSize,
    queuePosition,
    runRegistrationQueue,
    cancelRegistrationQueue,
    dismissRegistrationSuccess,
  }
}
