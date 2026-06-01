<script setup>
const emit = defineEmits(['navigate'])

const stats = [
  {
    label: 'Total Students',
    value: '1,245',
    iconBg: '#dbeafe',
    iconColor: '#2563eb',
    icon: 'users',
  },
  {
    label: 'Total Courses',
    value: '86',
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    icon: 'book',
  },
  {
    label: 'Today Attendance',
    value: '98.2%',
    iconBg: '#fef9c3',
    iconColor: '#ca8a04',
    icon: 'clipboard',
  },
  {
    label: 'System Load',
    value: 'Normal',
    iconBg: '#fce7f3',
    iconColor: '#db2777',
    icon: 'chart',
  },
]

const quickAccess = [
  {
    title: 'Code Set Management',
    description: 'Maintain system code sets and dictionaries.',
    pageId: 'code-set-management',
    iconBg: '#e0f2fe',
    iconColor: '#0284c7',
    icon: 'grid',
  },
  {
    title: 'University Info1',
    description: 'Manage school and portal branding settings.',
    pageId: 'university-info',
    iconBg: '#fce7f3',
    iconColor: '#db2777',
    icon: 'school',
  },
  {
    title: 'Block Management',
    description: 'Manage campus buildings and floors.',
    pageId: 'block-management',
    iconBg: '#dbeafe',
    iconColor: '#2563eb',
    icon: 'location',
  },
  {
    title: 'Programme Info',
    description: 'View and manage academic programmes.',
    pageId: 'programme-info',
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    icon: 'database',
  },
  {
    title: 'Course Info',
    description: 'Manage courses and curriculum.',
    pageId: 'course-information',
    iconBg: '#fef9c3',
    iconColor: '#ca8a04',
    icon: 'book',
  },
  {
    title: 'Lecturer Info',
    description: 'View lecturer profiles and assignments.',
    pageId: 'lecturer-information',
    iconBg: '#ede9fe',
    iconColor: '#7c3aed',
    icon: 'user',
  },
]

function openQuickAccess(pageId) {
  emit('navigate', pageId)
}
</script>

<template>
  <div class="dashboard">
    <section class="welcome">
      <h2 class="welcome-title">Welcome back, Admin User</h2>
      <p class="welcome-subtitle">Basic Data module overview.</p>
    </section>

    <section class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <div class="stat-header">
          <span class="stat-label">{{ stat.label }}</span>
          <div class="stat-icon" :style="{ background: stat.iconBg, color: stat.iconColor }">
            <svg v-if="stat.icon === 'users'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <svg v-else-if="stat.icon === 'book'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <svg v-else-if="stat.icon === 'clipboard'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <polyline points="9 14 11 16 15 12" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
        </div>
        <div class="stat-value">{{ stat.value }}</div>
      </div>
    </section>

    <section class="quick-access">
      <h3 class="section-title">Common Operations</h3>
      <div class="quick-grid">
        <button
          v-for="item in quickAccess"
          :key="item.title"
          type="button"
          class="quick-card"
          @click="openQuickAccess(item.pageId)"
        >
          <div class="quick-icon" :style="{ background: item.iconBg, color: item.iconColor }">
            <svg v-if="item.icon === 'grid'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <svg v-else-if="item.icon === 'school'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
            </svg>
            <svg v-else-if="item.icon === 'location'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <svg v-else-if="item.icon === 'database'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <svg v-else-if="item.icon === 'book'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div class="quick-content">
            <h4 class="quick-title">{{ item.title }}</h4>
            <p class="quick-desc">{{ item.description }}</p>
          </div>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 24px 28px;
}

.welcome {
  margin-bottom: 24px;
}

.welcome-title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.welcome-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #f3f4f6;
}

.stat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 20px;
  height: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  background: #fff;
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #f3f4f6;
  cursor: pointer;
  text-align: left;
  transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
}

.quick-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
  transform: translateY(-1px);
}

.quick-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-icon svg {
  width: 24px;
  height: 24px;
}

.quick-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.quick-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1024px) {
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid,
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
