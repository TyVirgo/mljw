import { ref } from 'vue'

/** 第一轮志愿待分配（全库共享，避免 store ↔ volunteer 循环依赖） */
export const studentPendingAssignCourses = ref([])
