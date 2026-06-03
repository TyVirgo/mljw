<script setup>
import { ref } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'

const collapsed = ref(false)
const { tr } = useAppI18n()

function togglePanel() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <aside class="collapsible-tree-panel" :class="{ collapsed }">
    <div v-show="!collapsed" class="tree-panel-inner">
      <slot name="search" />
      <div class="tree-body">
        <slot />
      </div>
    </div>
    <button
      type="button"
      class="tree-panel-toggle"
      :class="{ 'is-collapsed': collapsed }"
      :aria-label="collapsed ? tr('Expand tree panel') : tr('Collapse tree panel')"
      :title="collapsed ? tr('Expand tree panel') : tr('Collapse tree panel')"
      @click="togglePanel"
    >
      <span class="tree-panel-toggle-rail" aria-hidden="true"></span>
      <span class="tree-panel-toggle-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline v-if="collapsed" points="9 18 15 12 9 6" />
          <polyline v-else points="15 18 9 12 15 6" />
        </svg>
      </span>
    </button>
  </aside>
</template>

<style scoped>
.collapsible-tree-panel {
  position: relative;
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
  background: #fafafa;
  transition: width 0.22s ease;
  overflow: hidden;
}

.collapsible-tree-panel.collapsed {
  width: 0;
  min-width: 0;
  border-right: none;
  background: transparent;
  overflow: visible;
}

.tree-panel-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 260px;
  overflow: hidden;
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 18px 14px 0;
}

.tree-panel-toggle {
  --toggle-w: 14px;
  --toggle-h: 36px;
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  z-index: 3;
  width: var(--toggle-w);
  height: var(--toggle-h);
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.tree-panel-toggle-rail {
  position: absolute;
  inset: 0;
  border: 1px solid #cbd5e1;
  border-right: none;
  border-radius: 6px 0 0 6px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: -2px 0 6px rgba(15, 23, 42, 0.06);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.tree-panel-toggle-icon {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #64748b;
  transition: color 0.18s ease, transform 0.18s ease;
}

.tree-panel-toggle-icon svg {
  width: 9px;
  height: 9px;
}

.tree-panel-toggle:hover .tree-panel-toggle-rail {
  border-color: #93c5fd;
  background: linear-gradient(180deg, #ffffff 0%, #eff6ff 100%);
  box-shadow:
    -2px 0 8px rgba(37, 99, 235, 0.12),
    inset 1px 0 0 rgba(37, 99, 235, 0.08);
}

.tree-panel-toggle:hover .tree-panel-toggle-icon {
  color: #2563eb;
}

.tree-panel-toggle:active .tree-panel-toggle-icon {
  transform: scale(0.92);
}

.tree-panel-toggle:focus-visible {
  outline: none;
}

.tree-panel-toggle:focus-visible .tree-panel-toggle-rail {
  border-color: #2563eb;
  box-shadow:
    -2px 0 8px rgba(37, 99, 235, 0.14),
    inset 0 0 0 1px rgba(37, 99, 235, 0.15);
}

.tree-panel-toggle.is-collapsed {
  right: auto;
  left: 0;
}

.tree-panel-toggle.is-collapsed .tree-panel-toggle-rail {
  border-left: none;
  border-right: 1px solid #cbd5e1;
  border-radius: 0 6px 6px 0;
  box-shadow: 2px 0 6px rgba(15, 23, 42, 0.06);
}

.tree-panel-toggle.is-collapsed:hover .tree-panel-toggle-rail {
  box-shadow:
    2px 0 8px rgba(37, 99, 235, 0.12),
    inset -1px 0 0 rgba(37, 99, 235, 0.08);
}
</style>
