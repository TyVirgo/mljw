## 1. Data Layer

- [ ] 1.1 Create `src/data/evaluationSettings.js` with default settings, load/save via localStorage, validation helpers, and lightweight `applyEvaluationRules()` (demo only)
- [ ] 1.2 Add optional mock fields on lecturers: `hasTeachingRecord`, `previousCategory` (minimal sample data for demo)
- [ ] 1.3 Add i18n keys for Evaluation Settings page (EN/ZH) in `zh-flat.js`, `locales/en.js`, `locales/zh.js`

## 2. Evaluation Settings Page

- [ ] 2.1 Create `src/views/EvaluationSettingsView.vue` with page-card layout (no search area)
- [ ] 2.2 Implement global info banner (blue) with localized text
- [ ] 2.3 Implement New Lecturer section: title, description, right-aligned enable toggle
- [ ] 2.4 Implement Change in Lecturer Category section with rule rows (from/to selects, inline sentence template, Delete, rule toggle)
- [ ] 2.5 Wire "+ Create" to append rule; Delete with `ConfirmDialog` confirmation; category options from `categoryOptions`
- [ ] 2.6 Add bottom-right Save button with validation, persist, success message, and call `applyEvaluationRules`

## 3. UI Components & Styling

- [ ] 3.1 Reuse or add compact blue ON/OFF toggle matching static design (align with prototype, distinct from list Y/N filter if needed)
- [ ] 3.2 Style rule rows, section headers, and Save footer consistent with University Info / Lecturer form pages
- [ ] 3.3 Implement `ConfirmDialog` on rule Delete (required secondary confirmation)

## 4. App Integration

- [ ] 4.1 Register `EvaluationSettingsView` in `App.vue`
- [ ] 4.2 Add `evaluation-settings` to `developedPages` in `src/config/menu.js`
- [ ] 4.3 Manual smoke test: open page EN/ZH, edit rules, Save, verify Lecturer Information Requires Evaluation tags and filter

## 5. Verification

- [ ] 5.1 Run `npm run build` and fix any lint issues
- [ ] 5.2 Verify no search/query UI appears on Evaluation Settings page
