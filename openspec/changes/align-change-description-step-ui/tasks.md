## 1. Data Layer

- [x] 1.1 Extend `changeDescriptionComponents` in `courseChangeApplications.js`: replace `hint` with `majorCriteria[]` and `minorCriteria[]` for all 10 components (text from prototype)
- [x] 1.2 Verify `createEmptyChangeDescription()` defaults and validation unchanged

## 2. Toggle Component

- [x] 2.1 Create `ChangeLevelToggle.vue`: pill-shaped N/Y switch, props `active` / `disabled`, blue active state (#2563eb)
- [x] 2.2 Support readonly mode (disabled, no pointer events)

## 3. ChangeDescriptionStep Refactor

- [x] 3.1 Rewrite template to three-column table: header row + data rows with Component Name | Major Changes | Minor / No Changes
- [x] 3.2 Render `majorCriteria` / `minorCriteria` as bullet lists under each column toggle
- [x] 3.3 Wire mutually exclusive toggle logic: click inactive column → set `major` or `minor`
- [x] 3.4 Add section title blue vertical accent bar (MAIN COMPONENTS / OTHER COMPONENTS)
- [x] 3.5 Style table: row borders, component name column `#fafafa` background, 12px grey criteria text

## 4. i18n

- [x] 4.1 Add Chinese translations in `zh-flat.js` for all criteria bullet strings (10 components × major + minor lists)
- [x] 4.2 Add table header keys if missing: `Component Name`, `Major Changes`, `Minor / No Changes`

## 5. Verification

- [x] 5.1 Visual check: Step 1 matches prototype layout (three columns, pill toggles, bullet criteria)
- [x] 5.2 Functional check: toggle mutual exclusivity, default minor, readonly detail mode
- [x] 5.3 Run `npm run build`
