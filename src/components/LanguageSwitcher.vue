<script setup>
import { useAppI18n } from '../composables/useAppI18n.js'

const { locale, toggleLocale, t } = useAppI18n()

function handleClick() {
  toggleLocale()
}
</script>

<template>
  <button
    type="button"
    class="lang-switch"
    :aria-label="locale === 'en' ? t('lang.switchToZh') : t('lang.switchToEn')"
    @click="handleClick"
  >
    {{ locale === 'en' ? t('lang.switchToZh') : t('lang.switchToEn') }}
  </button>
</template>

<style scoped>
.lang-switch {
  min-width: 44px;
  height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.35);
  transition: background 0.15s, border-color 0.15s;
}

.lang-switch:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.55);
}
</style>
