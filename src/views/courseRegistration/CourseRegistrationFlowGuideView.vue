<script setup>
import { ref } from 'vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  semesterPhases,
  adminFlowNodes,
  studentFlowNodes,
  crossLinks,
  sequenceConstraints,
  dimensionBadges,
} from '../../data/courseRegistration/courseRegistrationFlowGuide.js'
import '../../styles/course-registration-flow-guide.css'

const emit = defineEmits(['navigate'])

const { t } = useAppI18n()
const selectedPhase = ref(null)

function togglePhase(key) {
  selectedPhase.value = selectedPhase.value === key ? null : key
}

function isNodeHighlighted(pageId, phaseKeys = []) {
  if (!selectedPhase.value) return false
  if (phaseKeys.includes(selectedPhase.value)) return true
  const phase = semesterPhases.find((item) => item.key === selectedPhase.value)
  return phase?.relatedPageIds?.includes(pageId)
}

function goToPage(pageId) {
  emit('navigate', pageId)
}
</script>

<template>
  <div class="cr-flow-guide-page">
    <CourseRegistrationCallout variant="rule">
      {{ t('courseRegistration.flowGuide.disclaimer') }}
    </CourseRegistrationCallout>

    <section class="page-card">
      <h2 class="cr-flow-guide-section-title">{{ t('courseRegistration.flowGuide.sections.timeline') }}</h2>
      <p class="cr-flow-guide-section-desc">{{ t('courseRegistration.flowGuide.sections.timelineDesc') }}</p>
      <div class="cr-flow-timeline">
        <button
          v-for="phase in semesterPhases"
          :key="phase.key"
          type="button"
          class="cr-flow-phase"
          :class="{ 'cr-flow-phase--active': selectedPhase === phase.key }"
          @click="togglePhase(phase.key)"
        >
          <span class="cr-flow-phase-key">{{ phase.key }}</span>
          <span class="cr-flow-phase-label">{{ t(phase.labelKey) }}</span>
          <span class="cr-flow-phase-desc">{{ t(phase.descKey) }}</span>
        </button>
      </div>
    </section>

    <section class="page-card">
      <h2 class="cr-flow-guide-section-title">{{ t('courseRegistration.flowGuide.sections.mainFlow') }}</h2>
      <p class="cr-flow-guide-section-desc">{{ t('courseRegistration.flowGuide.sections.mainFlowDesc') }}</p>
      <div class="cr-flow-dual-lanes">
        <div>
          <h3 class="cr-flow-lane-title">{{ t('courseRegistration.flowGuide.lanes.admin') }}</h3>
          <div class="cr-flow-node-stack">
            <template v-for="(node, index) in adminFlowNodes" :key="node.pageId">
              <div v-if="index > 0" class="cr-flow-connector" aria-hidden="true">
                <span class="cr-flow-connector-line" />
                <span class="cr-flow-connector-arrow">▼</span>
              </div>
              <button
                type="button"
                class="cr-flow-node"
                :class="{ 'cr-flow-node--highlight': isNodeHighlighted(node.pageId, node.phaseKeys) }"
                @click="goToPage(node.pageId)"
              >
                <div class="cr-flow-node-head">
                  <span class="cr-flow-node-order">{{ node.order }}</span>
                  <span class="cr-flow-node-title">{{ t(node.menuKey) }}</span>
                </div>
                <p class="cr-flow-node-desc">{{ t(node.descKey) }}</p>
                <span class="cr-flow-node-action">{{ t('courseRegistration.flowGuide.openPage') }}</span>
              </button>
            </template>
          </div>
        </div>

        <div>
          <h3 class="cr-flow-lane-title">{{ t('courseRegistration.flowGuide.lanes.student') }}</h3>
          <div class="cr-flow-node-stack">
            <template v-for="(node, index) in studentFlowNodes" :key="node.pageId">
              <div v-if="index > 0" class="cr-flow-connector" aria-hidden="true">
                <span class="cr-flow-connector-line" />
                <span class="cr-flow-connector-arrow">▼</span>
              </div>
              <button
                type="button"
                class="cr-flow-node"
                :class="{ 'cr-flow-node--highlight': isNodeHighlighted(node.pageId, node.phaseKeys) }"
                @click="goToPage(node.pageId)"
              >
                <div class="cr-flow-node-head">
                  <span class="cr-flow-node-order">{{ node.order }}</span>
                  <span class="cr-flow-node-title">{{ t(node.menuKey) }}</span>
                </div>
                <p class="cr-flow-node-desc">{{ t(node.descKey) }}</p>
                <div v-if="node.badges?.length" class="cr-flow-node-badges">
                  <span v-for="badge in node.badges" :key="badge" class="cr-flow-badge">
                    {{ t(dimensionBadges[badge]) }}
                  </span>
                </div>
                <span class="cr-flow-node-action">{{ t('courseRegistration.flowGuide.openPage') }}</span>
              </button>
            </template>
          </div>
        </div>
      </div>
    </section>

    <section class="page-card">
      <h2 class="cr-flow-guide-section-title">{{ t('courseRegistration.flowGuide.sections.crossLinks') }}</h2>
      <p class="cr-flow-guide-section-desc">{{ t('courseRegistration.flowGuide.sections.crossLinksDesc') }}</p>
      <div class="cr-flow-links-grid">
        <div v-for="(link, index) in crossLinks" :key="index" class="cr-flow-link-card">
          <div class="cr-flow-link-route">
            <button type="button" class="cr-flow-link-btn" @click="goToPage(link.fromPageId)">
              {{ t(link.fromKey) }}
            </button>
            <span class="cr-flow-link-arrow">→</span>
            <button type="button" class="cr-flow-link-btn" @click="goToPage(link.toPageId)">
              {{ t(link.toKey) }}
            </button>
          </div>
          <p class="cr-flow-link-desc">{{ t(link.descKey) }}</p>
        </div>
      </div>
    </section>

    <section class="page-card">
      <h2 class="cr-flow-guide-section-title">{{ t('courseRegistration.flowGuide.sections.constraints') }}</h2>
      <p class="cr-flow-guide-section-desc">{{ t('courseRegistration.flowGuide.sections.constraintsDesc') }}</p>
      <ol class="cr-flow-constraints">
        <li v-for="key in sequenceConstraints" :key="key">{{ t(key) }}</li>
      </ol>
    </section>
  </div>
</template>
