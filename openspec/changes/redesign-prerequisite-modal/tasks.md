## 1. Modal Shell & Layout

- [ ] 1.1 Rewrite `CoursePrerequisiteModal.vue` panel: title **Add**, `max-width: 1000px`, flex column (header / body / footer)
- [ ] 1.2 Style header (16px title, × close) and footer (**Discard** + **Confirm**, button radius 8px) per prototype
- [ ] 1.3 Wire close overlay, ×, and Discard to `emit('close')` without persisting selection

## 2. Search Area

- [ ] 2.1 Add search row: Course Name, Course Code, Offering (select from `getOfferingOptions(initialDepartments)`)
- [ ] 2.2 Implement draft vs applied search state; **Search** applies filters and resets page to 1; **Reset** clears both
- [ ] 2.3 Layout: three fields on one row with Search/Reset aligned right; labels left-aligned with compact spacing (match list-page search style)
- [ ] 2.4 Client-side filter: partial match on name/code; exact match on offering code; exclude `excludeCode`

## 3. Data Table

- [ ] 3.1 Render table columns: checkbox, No., Course code, Course Name, Offering, Credit Value, Course Classification
- [ ] 3.2 Offering column via `getOfferingLabel`; classification via `tr(course.courseClassification)`; missing values as `--`
- [ ] 3.3 Multi-select with `checkedCodes`; header checkbox select-all / indeterminate for **current page only**
- [ ] 3.4 Preserve cross-page selections; empty state `common.noData`
- [ ] 3.5 Table body scrollable within modal; horizontal scroll if needed on narrow viewports

## 4. Pagination

- [ ] 4.1 Integrate `TablePagination` below table (`total = filtered.length`, default pageSize 10)
- [ ] 4.2 Paginate filtered results before render; compute No. from page offset

## 5. Confirm & Integration

- [ ] 5.1 Confirm emits `checkedCodes.join(', ')` then close
- [ ] 5.2 On open: restore selection from `selectedCodes`, reset search fields
- [ ] 5.3 Normalize course rows from both `courses` and application payloads (ensure code/name/offering/credit/classification available)
- [ ] 5.4 Smoke test: Course Information wizard Choose flow; Course Application wizard Choose flow

## 6. i18n

- [ ] 6.1 Add `Discard` → 放弃 (or 取消 per product) and `Add` title keys if missing in `zh-flat.js` / locales
- [ ] 6.2 Reuse existing keys: Search, Reset, Course Name, Course Code, Offering, Credit Value, Course Classification, Confirm

## 7. Verification

- [ ] 7.1 Visual check against prototype: wide modal, 3-field search, 7-column table, pagination bar, Discard/Confirm
- [ ] 7.2 Run `npm run build`
