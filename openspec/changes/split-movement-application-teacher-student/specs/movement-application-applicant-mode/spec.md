## ADDED Requirements

### Requirement: Applicant mode controls list scope
The system SHALL filter movement application lists by applicant mode so student self-service portals show only the current student's applications.

#### Scenario: Teacher list shows all applications
- **WHEN** user views any movement tab with `applicantMode` set to `teacher`
- **THEN** the list includes applications for all students subject to existing search and pagination filters

#### Scenario: Student list shows own applications only
- **WHEN** user views any movement tab with `applicantMode` set to `student`
- **THEN** the list includes only applications whose student ID matches the current mock logged-in student

#### Scenario: Student list search within own records
- **WHEN** student user applies advanced list filters (Programme Code, Application Session, Approval Status, Implemented) on any tab
- **THEN** search operates only within the current student's applications and does not expose a Student ID or Name search field

### Requirement: Student portal auto-fills Section I on create
The system SHALL auto-populate Section I student identity fields from the current logged-in student when creating any movement application in student mode.

#### Scenario: Create opens with current student snapshot
- **WHEN** student user opens Create on any movement tab in student mode
- **THEN** Section I displays the current student's ID, name, and related readonly profile fields without a student picker

#### Scenario: Section I readonly in student mode
- **WHEN** student user views Section I in create or draft edit in student mode
- **THEN** student identity fields are readonly and cannot be changed to another student

#### Scenario: Consistent across four movement types
- **WHEN** student user creates Deferment, Resumption, Withdrawal, or Programme Transfer in student mode
- **THEN** the same auto-fill and readonly Section I behavior applies

### Requirement: Staff portal uses student selector on create
The system SHALL require staff to pick a student via StudentSelectModal when creating any movement application in teacher mode.

#### Scenario: Create requires student selection
- **WHEN** staff user opens Create on any movement tab in teacher mode with no student selected
- **THEN** Section I shows an empty student display and a Select action to open StudentSelectModal

#### Scenario: Draft edit locks student identity
- **WHEN** staff user edits a Draft or Update Required application in teacher mode
- **THEN** the bound student ID and name are readonly and the Select action is not available to change student

### Requirement: Draft edit mirrors create editable fields
The system SHALL allow draft editing of the same business fields that are editable on create for each movement type, in both applicant modes, while keeping Section I identity readonly per mode rules.

#### Scenario: Student draft edits business sections
- **WHEN** student user edits a Draft application in student mode
- **THEN** Section II–IV and attachment fields follow the same editability rules as create for that movement type, and Section I remains readonly

#### Scenario: Staff draft edits business sections
- **WHEN** staff user edits a Draft application in teacher mode
- **THEN** Section II–IV and attachment fields follow the same editability rules as create for that movement type, and Section I student identity remains locked

### Requirement: Mock current student for student portal
The system SHALL resolve the current logged-in student from a single mock module for list filtering and form auto-fill until real authentication is integrated.

#### Scenario: Single source for current student
- **WHEN** student portal list or form needs the logged-in student
- **THEN** the system reads from the shared mock current student helper backed by `initialStudents`

#### Scenario: Swappable for future SSO
- **WHEN** authentication is integrated later
- **THEN** only the mock current student module needs replacement without changing list filter or form auto-fill call sites

### Requirement: Section I displays student ID and name in separate fields
The system SHALL show student ID and full name in two adjacent readonly fields on the same form row in all four movement form modals.

#### Scenario: Student ID field shows ID only
- **WHEN** staff or student user views Section I after a student is bound (via selector or auto-fill)
- **THEN** the Student ID field displays only the student ID and does not concatenate the student name

#### Scenario: Name field shows full name separately
- **WHEN** staff selects a student or student portal auto-fills on create
- **THEN** the adjacent Name field displays the student's full name from the profile snapshot

#### Scenario: Same-row layout with Select at row end
- **WHEN** staff user opens Create on any movement form modal in teacher mode
- **THEN** Student ID and Name appear on the first row as two equal columns with the Select action at the **end of that row**, not between the Student ID and Name fields

#### Scenario: Student mode without Select button
- **WHEN** student user opens Create on any movement form modal
- **THEN** the first row shows Student ID and Name only without a Select action

#### Scenario: Consistent across four movement types
- **WHEN** user opens Programme Transfer, Deferment, Resumption, or Withdrawal form modals
- **THEN** the same separate-field, same-row layout with Select-at-end (teacher create only) applies in both teacher and student applicant modes

### Requirement: Readonly snapshot fields are visually distinct from editable fields
The system SHALL apply a consistent readonly (greyed) visual treatment to all profile and snapshot fields populated from the student record, distinct from editable business fields.

#### Scenario: Section I and snapshot fields are greyed
- **WHEN** user views readonly fields in Section I and readonly snapshot fields such as Current Programme, Current Intake, and Current School on Programme Transfer
- **THEN** those fields use the shared readonly styling (muted background and text) so they are visually distinguishable from editable inputs in later sections

#### Scenario: Editable fields remain white
- **WHEN** user views editable Section II–IV fields (selects, text inputs, textareas, checkboxes, file upload)
- **THEN** those fields retain the standard editable control styling without the readonly grey treatment

### Requirement: Programme transfer list removes simulate expire mock action
The system SHALL NOT expose a manual "Simulate Expire" action on the programme transfer application list.

#### Scenario: No simulate expire button
- **WHEN** staff or student user views programme transfer list actions for Draft or Update Required applications
- **THEN** the Simulate Expire action is not shown

#### Scenario: expireApplication helper removed
- **WHEN** the codebase is updated for this change
- **THEN** the `expireApplication` mock helper is removed from programme transfer data module and is not imported by views

### Requirement: Section I displays application academic session
The system SHALL show a readonly **Application Academic Session** (`applicationSession`) field as the last field in Section I on all four movement form modals and detail modals, using the `YYYY/MM` format consistent with approval, maintenance, and query list columns.

#### Scenario: Auto-fill on create
- **WHEN** user opens Create on any movement form modal (teacher or student mode)
- **THEN** Section I displays the current application academic session derived from the system current semester (e.g. `2025/09`) as a readonly greyed field at the end of Section I

#### Scenario: Frozen on draft edit
- **WHEN** user edits an existing Draft or Update Required application
- **THEN** the application academic session retains the value stored on the record and is not recalculated from the current semester

#### Scenario: Persisted on save and submit
- **WHEN** user saves a draft or submits an application
- **THEN** the `applicationSession` value is persisted on the movement record in the store

#### Scenario: Detail modal matches form format
- **WHEN** user views application details via any movement DetailModal (including approval review readonly view)
- **THEN** Section I shows Application Academic Session in the same `YYYY/MM` format as the form modal

#### Scenario: Consistent across four movement types
- **WHEN** user creates or views Programme Transfer, Deferment, Resumption, or Withdrawal
- **THEN** the application academic session field appears at the end of Section I with the same label and format in all four types

## MODIFIED Requirements

### Requirement: Section I displays application academic session
The system SHALL show a readonly **Application Academic Session** (`applicationSession`) field as the last field in Section I on all four movement form modals and detail modals, using the `YYYY/MM` format consistent with approval, maintenance, and query list columns. The value SHALL be derived from the selected student's enrollment intake and SHALL NOT be prefilled before a student is bound.

#### Scenario: Empty before student selection on teacher create
- **WHEN** staff user opens Create on any movement form modal in teacher mode before selecting a student
- **THEN** the Application Academic Session field at the end of Section I is empty or shows an em dash placeholder
- **AND** the field does not display the system current semester

#### Scenario: Fill from student intake after selection
- **WHEN** staff user selects a student via StudentSelectModal on create
- **THEN** the Application Academic Session field displays that student's enrollment intake in `YYYY/MM` format (e.g. `2023/09`) as a readonly greyed field

#### Scenario: Student portal auto-fill includes intake session
- **WHEN** student user opens Create on any movement form modal in student mode
- **THEN** Section I displays the current student's enrollment intake as Application Academic Session at the end of Section I

#### Scenario: Frozen on draft edit
- **WHEN** user edits an existing Draft or Update Required application
- **THEN** the application academic session retains the value stored on the record and is not recalculated from the student profile or current semester

#### Scenario: Persisted on save and submit
- **WHEN** user saves a draft or submits an application
- **THEN** the `applicationSession` value is persisted on the movement record in the store

#### Scenario: Detail modal matches form format
- **WHEN** user views application details via any movement DetailModal (including approval review readonly view)
- **THEN** Section I shows Application Academic Session in the same `YYYY/MM` format as the form modal

#### Scenario: Consistent across four movement types
- **WHEN** user creates or views Programme Transfer, Deferment, Resumption, or Withdrawal
- **THEN** the application academic session field appears at the end of Section I with the same label and intake-based rules in all four types

## REMOVED Requirements

#### Scenario: Auto-fill on create from system current semester
- **REMOVED** — superseded by Empty before student selection on teacher create and Fill from student intake after selection
