import { ref } from 'vue'
import { initialCourseApplications } from './courseApplications.js'
import { initialCourseChangeApplications } from './courseChangeApplications.js'
import { initialCourses } from './courses.js'

/** Shared in-memory state for course applications and formal course records. */
export const courseApplications = ref(initialCourseApplications.map((item) => ({ ...item })))

export const courseChangeApplications = ref(
  initialCourseChangeApplications.map((item) => JSON.parse(JSON.stringify(item))),
)

export const courses = ref(initialCourses.map((item) => ({ ...item })))
