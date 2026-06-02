## 1. Data Layer

- [ ] 1.1 Create `src/data/courseApplications.js` with status/approvalStage enums, bloom/teaching/assessment option lists, mock records (≥6 rows matching prototype names/statuses), nested `clos`, `slt`, `approvalLog` samples
- [ ] 1.2 Implement helpers: `createCourseApplicationId`, `createEmptyApplication`, `validateGeneralStep` (delegate to `validateCourseForm` rules), `validateCloStep` (≥1 CLO), `validateCloForm`, `validateContentOutline`, `validateContinuousAssessment`, `validateFinalAssessment`, `computeTotalSlt`, `submitApplication`, `canEditApplication` (Temporary saved only), `canSubmitApplication`, `canDeleteApplication`
- [ ] 1.3 Create `src/utils/exportCourseApplicationExcel.js` with list column field definitions

## 2. List Page

- [ ] 2.1 Create `src/views/CourseApplicationView.vue` with viewMode switching (list / apply / detail)
- [ ] 2.2 Implement search bar: Course Code, Course Name, Offering, Course Classification + More (Status, Applicant or equivalent)
- [ ] 2.3 Implement toolbar: Apply New Course, Delete, Import (placeholder notice), Export, Submit (Temporary saved only)
- [ ] 2.4 Implement data table with Status badges (color by status), Approval Stage, all list columns, row selection, Actions (Details, Approval Log)
- [ ] 2.5 Integrate `TablePagination`, `ConfirmDialog`, `ExportModal`; wire Submit and Delete rules

## 3. Application Wizard — Shell

- [ ] 3.1 Create `CourseApplicationWizard.vue` with horizontal 3-step stepper (General Information → CLO → SLT); **clickable steps; only current step highlighted blue**
- [ ] 3.2 Implement header: Back (**always ConfirmDialog**), Previous, Next, **Save** (no Cancel; Save right of Next)
- [ ] 3.3 Wire create, edit (Temporary saved only), and read-only detail modes; hide Edit/Submit for Rejected
- [ ] 3.4 Wizard body: **inline scrollable content area** (not wrapped in large modal)

## 4. Step 1 — General Information

- [ ] 4.1 Create `GeneralInformationStep.vue`: **two-column grid**, scrollable; fields from `createEmptyCourseForm` (incl. prerequisite, synopsis, references)
- [ ] 4.2 Reuse `validateCourseForm` from `courses.js`; **Credit input full column width** (match select dropdowns)

## 5. Step 2 — CLO

- [ ] 5.1 Create `CloStep.vue` with CLO table (No., CLO, Outcome, Bloom's Taxonomy Level, Teaching Methods, Assessment Methods, Actions)
- [ ] 5.2 Add Create / Delete toolbar; row Edit / Delete
- [ ] 5.3 Create `CloFormModal.vue`: CLO*, Outcome* (0/100), Bloom* (single select A1–P7), Teaching Methods* (multi), Assessment Methods* (multi)
- [ ] 5.4 Block Next from Step 2 when `clos.length === 0`; show inline validation message

## 6. Step 3 — SLT

- [ ] 6.1 Create `SltStep.vue` with three sections: Course Content Outline and Subtopics, Continuous Assessment, Final Assessment
- [ ] 6.2 Create `CourseContentOutlineModal.vue`: Course Content*, CLO* (multi-select from step 2), Learning Time grid (F2F Physical/Online, NF2F), Total SLT auto-sum
- [ ] 6.3 Create `ContinuousAssessmentModal.vue`: Continuous Assessment*, Percentage*, Learning Time (Physical, Online, NF2F), Total SLT
- [ ] 6.4 Create `FinalAssessmentModal.vue`: Final Assessment*, Percentage*, Learning Time, Total SLT
- [ ] 6.5 Table CRUD for each SLT subsection with Create/Delete and row actions

## 7. Details & Approval Log

- [ ] 7.1 Implement Details flow (read-only wizard or dedicated detail view) from list Actions
- [ ] 7.2 Create `ApprovalLogModal.vue` showing stage, actor, action, date/time, comment timeline

## 8. App Integration & i18n

- [ ] 8.1 Register `CourseApplicationView` in `App.vue`
- [ ] 8.2 Add `course-application` to `developedPages` in `menu.js`
- [ ] 8.3 Add i18n keys for statuses, stages, wizard labels, SLT sections (zh-flat + locales)
- [ ] 8.4 Smoke test: list search, apply 3-step flow, save draft, submit, details, approval log, export, delete

## 9. Import (UI placeholder)

- [ ] 9.1 Wire Import button to show placeholder notice alert; no ImportModal or xlsx parsing in this phase
