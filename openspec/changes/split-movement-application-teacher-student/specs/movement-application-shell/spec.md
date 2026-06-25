## ADDED Requirements

### Requirement: Dual movement application sidebar entries
The system SHALL expose two sibling sidebar entries under Student Status Change for staff-assisted and student self-service movement applications.

#### Scenario: Teacher menu label
- **WHEN** user views the Student Records sidebar under Student Status Change
- **THEN** a leaf menu item displays the label **学籍异动申请（管理端）** in Chinese UI (English: **Status Change Application (Management)**)

#### Scenario: Student menu label
- **WHEN** user views the Student Records sidebar under Student Status Change
- **THEN** a sibling leaf menu item displays the label for student self-service status change application

#### Scenario: Distinct page identifiers
- **WHEN** user navigates to either movement application entry
- **THEN** the system uses distinct page identifiers `sr-movement-application-teacher` and `sr-movement-application-student`

### Requirement: Shell passes applicant mode to embedded views
The system SHALL propagate an `applicantMode` of `teacher` or `student` from the movement application shell to all four embedded movement views.

#### Scenario: Teacher shell mode
- **WHEN** user opens the staff movement application menu entry
- **THEN** the shell renders with `applicantMode` set to `teacher` and passes it to ProgrammeTransferView, DefermentView, ResumptionView, and WithdrawalView

#### Scenario: Student shell mode
- **WHEN** user opens the student movement application menu entry
- **THEN** the shell renders with `applicantMode` set to `student` and passes it to all four embedded views

#### Scenario: Tab behavior unchanged
- **WHEN** user switches tabs inside either portal
- **THEN** tab keys, default tab, and embedded view reuse remain the same as the single-portal shell

## MODIFIED Requirements

### Requirement: Movement application shell hosts four embedded views
The system SHALL embed the existing ProgrammeTransferView, DefermentView, ResumptionView, and WithdrawalView inside a single parent shell component without duplicating their business logic, for both teacher and student portal entries.

#### Scenario: Single shell component per portal entry
- **WHEN** the application renders either staff or student status change application
- **THEN** the same shell component manages tab state and renders exactly one embedded movement view at a time

#### Scenario: No duplicate data modules
- **WHEN** the shell embeds movement views in either portal
- **THEN** each tab reuses the existing data layer files without forking new mock stores
