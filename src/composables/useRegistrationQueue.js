import { ref } from 'vue'

const queuePhase = ref('idle') // idle | waiting | success | failed
const queueContext = ref(null)
const successContext = ref(null)
/** 已等待秒数（递增展示） */
const waitSeconds = ref(0)
const queueSize = ref(0)
const queuePosition = ref(0)
/** 是否展示全屏队列；静默入队时为 false，查看进度时再打开 */
const queueOverlayVisible = ref(false)

let timerId = null
let positionTimerId = null
let resolveCallback = null
let targetWaitSeconds = 0

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

function simulateQueueStats() {
  queueSize.value = 80 + Math.floor(Math.random() * 120)
  queuePosition.value = Math.min(queueSize.value, 12 + Math.floor(Math.random() * 30))
  positionTimerId = setInterval(() => {
    if (queuePosition.value <= 1) return
    queuePosition.value = Math.max(1, queuePosition.value - (Math.random() > 0.4 ? 1 : 0))
  }, 700)
}

function buildResultCourses(context) {
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
 * 仅当队列 overlay 仍打开时展示成功/失败结果页；已关闭则静默收尾。
 */
function finishQueueWithResult(result, options, context) {
  const keepOverlayOpen = queueOverlayVisible.value
  if (!keepOverlayOpen) {
    resetQueue()
    return
  }

  const ok = result?.ok !== false
  queuePhase.value = ok ? 'success' : 'failed'
  queueOverlayVisible.value = true
  successContext.value = {
    ...context,
    registeredCourses: buildResultCourses(context),
    registeredAt: new Date().toLocaleDateString('en-GB'),
    errorKey: result?.errorKey,
    errorParams: result?.errorParams,
    resultKind: options.resultKind || context.resultKind || '',
  }
  queueContext.value = null
}

/**
 * 模拟高并发选课队列（12306 式：排队 → 成功/失败结果）
 * @param {object} options
 * @param {boolean} [options.silent] 不自动展示 overlay
 */
export function runRegistrationQueue(context, options = {}) {
  const minWait = options.minWait ?? 1
  const maxWait = options.maxWait ?? 3
  const totalWait = minWait + Math.floor(Math.random() * (maxWait - minWait + 1))

  return new Promise((resolve, reject) => {
    if (resolveCallback) {
      resolveCallback.reject(new Error('superseded'))
      resolveCallback = null
    }
    clearTimer()
    queueContext.value = {
      ...context,
      lockingMessage: true,
    }
    waitSeconds.value = 0
    targetWaitSeconds = totalWait
    queuePhase.value = 'waiting'
    successContext.value = null
    queueOverlayVisible.value = options.silent !== true
    simulateQueueStats()
    resolveCallback = { resolve, reject, options }

    timerId = setInterval(() => {
      waitSeconds.value += 1
      if (waitSeconds.value >= targetWaitSeconds) {
        clearTimer()
        const result = options.onComplete?.(context) ?? { ok: true }
        finishQueueWithResult(result, options, context)
        resolve(result)
        resolveCallback = null
      }
    }, 1000)
  })
}

export function isRegistrationQueueWaiting() {
  return queuePhase.value === 'waiting'
}

export function revealQueueOverlay() {
  if (queuePhase.value === 'waiting' && queueContext.value) {
    queueOverlayVisible.value = true
  }
}

/** 仅收起进度页，不中止排队 */
export function hideQueueOverlay() {
  queueOverlayVisible.value = false
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
  targetWaitSeconds = 0
  queueSize.value = 0
  queuePosition.value = 0
  queueOverlayVisible.value = false
}

export function dismissRegistrationSuccess() {
  resetQueue()
}

export function useRegistrationQueue() {
  return {
    queuePhase,
    queueVisible: queuePhase,
    queueOverlayVisible,
    queueContext,
    successContext,
    successVisible: queuePhase,
    waitSeconds,
    queueSize,
    queuePosition,
    runRegistrationQueue,
    cancelRegistrationQueue,
    dismissRegistrationSuccess,
    revealQueueOverlay,
    hideQueueOverlay,
    isRegistrationQueueWaiting,
  }
}
