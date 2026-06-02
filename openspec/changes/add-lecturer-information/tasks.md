## 1. Data Layer

- [ ] 1.1 Create `src/data/lecturers.js` with mock records (≥6 rows matching prototype), option enums (category, title, academicPosition, degree, employmentStatus, gender, nationality, country), ID helpers, and `normalizeLecturer()`
- [ ] 1.2 Define nested structures: `qualifications[]`, `workingExperiences[]`, `cpdByYear[]` with sample data for Loh Yoong Keong and others
- [ ] 1.3 Create `src/utils/exportLecturerExcel.js` with export field definitions aligned to list columns

## 2. List Page

- [ ] 2.1 Create `src/views/LecturerInformationView.vue` with search bar (Staff ID, Name, Department, Category + More row for Title, Academic Position, Degree, Employment Status)
- [ ] 2.2 Add evaluation filter toggle row and wire filter logic (AND + requiresEvaluation)
- [ ] 2.3 Implement data table with all list columns, Requires Evaluation tag, row selection, and Actions (Details, Edit, Delete)
- [ ] 2.4 Add toolbar: Create, Delete, Export, Sync Cache (notice), Refers to EMS system (notice)
- [ ] 2.5 Integrate `TablePagination`, `ConfirmDialog`, and `ExportModal`

## 3. Create / Edit Wizard

- [ ] 3.1 Create `src/components/lecturer/LecturerFormModal.vue` with four-step stepper and navigation (Cancel / Previous / Next / Confirm)
- [ ] 3.2 Implement Step 1: Personal Information + Employment Information + Others sections with validation on required fields
- [ ] 3.3 Create `src/components/lecturer/QualificationSection.vue` for Step 2 — add/edit/save/delete qualification cards with PDF attachment mock
- [ ] 3.4 Create `src/components/lecturer/WorkingExperienceSection.vue` for Step 3 — add/edit/save/delete experience cards with date pickers
- [ ] 3.5 Implement Step 4 CPD placeholder (informational text, no manual entry)
- [ ] 3.6 Wire Create and Edit modes: pre-fill on edit, save/update to parent list, duplicate Staff ID check

## 4. Details Modal

- [ ] 4.1 Create `src/components/lecturer/LecturerDetailModal.vue` with four-step read-only stepper
- [ ] 4.2 Step 1: display Personal, Employment, attachment download card, Remarks
- [ ] 4.3 Step 2: list qualifications with attachment downloads
- [ ] 4.4 Step 3: list working experience cards (read-only)
- [ ] 4.5 Step 4: CPD grouped by year with collapsible panels, summary stats, and activity table with Evidence links

## 5. App Integration

- [ ] 5.1 Register `LecturerInformationView` in `App.vue` (import, computed, template branch)
- [ ] 5.2 Add `lecturer-information` to `developedPages` in `src/config/menu.js`
- [ ] 5.3 Manual smoke test: navigate from sidebar, CRUD flow, search/export, detail all four steps
