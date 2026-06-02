## 1. Data Layer & Shared State

- [ ] 1.1 Create `src/data/courseChangeApplications.js`: status/stage enums, `courseChangeSteps` (4 steps), mock records (≥6 rows matching prototype), changeDescription schema, helpers (`canEdit`, `canSubmit`, `canWithdraw`, `canDelete`, `submitChangeApplications`, `withdrawChangeApplications`)
- [ ] 1.2 Create or extend `courseChangeStore.js` / `courseStore.js` with shared `courseChangeApplications` ref and **`applyApprovedChangeToCourse()`** helper (Review module calls this on final Approved; no approval UI on application page in v1)
- [ ] 1.3 Implement baseline copy helper: `loadBaselineFromCourse(course)` → form, clos, slt, baselineSnapshot; **courseCode locked to baseline**
- [ ] 1.4 Add validation: step1 (baseline + changeDescription), step2 (general form, **courseCode === baselineSnapshot.courseCode**), step3 (≥1 CLO); helpers mark Rejected as non-editable/non-withdrawable

## 2. Course Selection Modal

- [ ] 2.1 Create `CourseSelectModal.vue`: list courses from shared `courses` ref; columns Course Code, Course Name, Offering, Classification; single-select + Confirm/Cancel
- [ ] 2.2 Wire Choose button on Change Description step; lock baseline after first Save

## 3. Change Description Step

- [ ] 3.1 Create `ChangeDescriptionStep.vue` with MAIN COMPONENTS (Course Name, Credit Value, Course Classification, CLO) and OTHER COMPONENTS (Synopsis, Pre-requisite, Teaching Methods, Course Content, Assessment Methods, References)
- [ ] 3.2 Implement Major Changes (N) / Minor / No Changes (Y) toggle per row with prototype styling
- [ ] 3.3 Add helper description text per row (i18n); readonly mode for detail view

## 4. Four-Step Wizard

- [ ] 4.1 Create `CourseChangeWizard.vue` with view modes create / edit / detail; reuse `CourseDetailStepper` for 4 steps
- [ ] 4.2 Step 2: Basic Information form grid; **Course Code field readonly** (matches baseline)
- [ ] 4.3 Step 3: CLO table + `CourseCLOFormModal`; Step 4: `CourseSLTStepPanel`
- [ ] 4.4 Header: Back/Cancel (ConfirmDialog), Previous, Next, Save; detail mode: Back, Previous, Next, Export placeholder
- [ ] 4.5 Detail mode: Step 1 readonly change table; Step 2 `CourseGeneralInfoDetail`; CLO pagination; SLT readonly

## 5. List Page — CourseChangeApplicationView

- [ ] 5.1 Create `src/views/CourseChangeApplicationView.vue` with viewMode list / create / edit / detail
- [ ] 5.2 Search: row1 (Course Code, Course Name, Offering + Search/Reset/More), row2 (Course Classification); colon-aligned labels
- [ ] 5.3 Toolbar: Create, Delete, Export, Submit, Withdraw with eligibility rules
- [ ] 5.4 Table: specified columns, status badges, sticky Actions, nowrap rows; row actions Edit vs Details by status
- [ ] 5.5 Integrate TablePagination, ExportModal, ApprovalLogModal, ConfirmDialog (Delete, Submit, Withdraw, leave wizard)

## 6. Export, i18n & Registration

- [ ] 6.1 Create `exportCourseChangeApplicationExcel.js` with list field definitions
- [ ] 6.2 Add i18n: Change Description, Basic Information, Major/Minor labels, MAIN/OTHER COMPONENTS, Withdraw, change component descriptions, confirmation messages
- [ ] 6.3 Register `CourseChangeApplicationView` in `App.vue`; add `course-change-application` to `developedPages`

## 7. Write-back Helper & Verification

- [ ] 7.1 Export `applyApprovedChangeToCourse` in data layer (no Approval UI on application page); document for Course Change Review integration
- [ ] 7.2 Smoke test: Create → Choose baseline → Course Code readonly → Save draft → Edit → Submit (with confirmation)
- [ ] 7.3 Smoke test: Withdraw In Progress → Temporary saved; Delete draft; Rejected row has no Edit/Submit/Withdraw
- [ ] 7.4 Smoke test: invoke helper directly → Course Information shows updated data + changeRecords
- [ ] 7.5 Run `npm run build`
