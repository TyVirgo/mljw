## 1. Data Layer & Shared State

- [ ] 1.1 Add approval helpers in `courseApplications.js` (or `courseApproval.js`): `getApprovalQueue`, `canApproveApplication`, `applyApprovalDecision`, `advanceApprovalStage`, `returnApplicationToDraft`, `rejectApplication`, `archiveApplicationToCourses`
- [ ] 1.2 Define approval action enum: Approved, Rejected, Update Required; stage flow HoD/HoP Review → Senate Review → Approved
- [ ] 1.3 Introduce shared state (store module or App-level provide) so Course Application Submit and Course Approval decisions mutate the same applications/courses collections
- [ ] 1.4 Add static Common Comments presets (3–5 templates) for approval modal

## 2. Approval Modal

- [ ] 2.1 Create `CourseApprovalModal.vue` with header, current-stage intro text, Action radios, Comments textarea (100 char limit + counter), Common Comments preset picker (3–5 static items)
- [ ] 2.2 Wire Cancel / Confirm; validate Action selected; Comments required for Rejected and Update Required
- [ ] 2.3 On Confirm, call `applyApprovalDecision` for each target id (single or batch) and close modal; refresh list

## 3. List Page — CourseApprovalView

- [ ] 3.1 Create `src/views/CourseApprovalView.vue` with viewMode list / detail
- [ ] 3.2 Implement search: row1 (Course Code, Course Name, Offering + Search/Reset/More right-aligned), row2 (Course Classification + expanded Status/Applicant); colon-aligned labels
- [ ] 3.3 Implement toolbar: Approval (batch: same approvalStage + In Progress), Export
- [ ] 3.4 Implement table: columns incl. **Course Code** (after Approval Stage), status badges, sticky Actions, nowrap rows
- [ ] 3.5 Row actions: Details, Approval Log only
- [ ] 3.6 Integrate TablePagination, ExportModal, ApprovalLogModal, CourseApplicationWizard (detail)

## 4. Approval Workflow Integration

- [ ] 4.1 Wire toolbar Approval to open CourseApprovalModal with selected id(s); enforce same approvalStage for batch
- [ ] 4.2 Implement Approved path: stage advance; final Senate approve → status Approved + archive to courses
- [ ] 4.3 Implement Rejected path: terminal Rejected status + approvalLog
- [ ] 4.4 Implement Update Required path: Temporary saved + remove from approval queue
- [ ] 4.5 Ensure Course Application Submit adds record to approval queue

## 5. Export & i18n

- [ ] 5.1 Create `exportCourseApprovalExcel.js` with list field definitions
- [ ] 5.2 Add i18n keys: Approval, Action, Comments, Common Comments, Update Required, approval intro text, 审核/通过/拒绝/驳回/办理意见/常用意见
- [ ] 5.3 Register `CourseApprovalView` in `App.vue`; add `course-approval-process` to `developedPages`

## 6. Verification

- [ ] 6.1 Smoke test: Submit from Course Application → appears in New Course Approval
- [ ] 6.2 Smoke test: Approved at HoD → Senate stage; Approved at Senate → Course Information new row
- [ ] 6.3 Smoke test: Update Required → back to Course Application draft editable
- [ ] 6.4 Smoke test: batch Approval (same stage) applies one decision to all selected rows
- [ ] 6.5 Smoke test: Rejected → read-only in both modules
- [ ] 6.6 Run `npm run build`
