## ADDED Requirements

### Requirement: Course change application list page
The system SHALL provide a list page at menu **Course Change Application** for managing revision requests against approved courses in Course Information.

#### Scenario: Default list load
- **WHEN** user navigates to Course Change Application
- **THEN** the system displays a paginated table with columns: No., Status, Approval Stage, Course Name, Offering, Course Classification, Credit, Applicant, Application Date and Time, and Actions

#### Scenario: Status badge styling
- **WHEN** a record is displayed in the list
- **THEN** status badges use solid background with white text consistent with Course Application list styling

#### Scenario: Sticky actions column and row layout
- **WHEN** the table content overflows horizontally
- **THEN** the Actions column remains sticky on the right
- **AND** row content uses adequate row height and `white-space: nowrap` for readability

### Requirement: Search and filter change applications
The system SHALL support searching change applications by Course Code, Course Name, Offering, and Course Classification.

#### Scenario: Basic search layout
- **WHEN** user views the search area
- **THEN** Course Code, Course Name, and Offering appear on the first row with Search and Reset buttons aligned to the right on the same row
- **AND** Course Classification appears on the second row
- **AND** filter labels are right-aligned so colons align vertically

#### Scenario: Search filters results
- **WHEN** user enters filter criteria and clicks Search
- **THEN** the list shows only matching records and resets to page 1

#### Scenario: Reset filters
- **WHEN** user clicks Reset
- **THEN** all search fields are cleared and the full list is restored

#### Scenario: More expands optional filters
- **WHEN** user clicks More
- **THEN** additional filters such as Status and Applicant MAY be shown consistent with Course Application list behavior

### Requirement: Toolbar actions
The system SHALL provide toolbar actions **Create**, **Delete**, **Export**, **Submit**, and **Withdraw** on the change application list page.

#### Scenario: Create opens wizard
- **WHEN** user clicks Create
- **THEN** the system opens the four-step change application wizard in create mode

#### Scenario: Delete draft applications
- **WHEN** user selects one or more Temporary saved records and clicks Delete
- **THEN** the system shows a confirmation dialog
- **AND** upon confirm removes only deletable draft records

#### Scenario: Export list
- **WHEN** user clicks Export and confirms field selection
- **THEN** the system downloads an Excel file of filtered change application data

#### Scenario: Submit drafts with confirmation
- **WHEN** user selects Temporary saved record(s) and clicks Submit
- **THEN** the system shows a secondary Submit Confirmation dialog
- **AND** upon confirm changes status to In Progress and sets approval stage to HoD/HoP Review
- **AND** appends an entry to approvalLog

#### Scenario: Withdraw in-progress applications
- **WHEN** user selects In Progress record(s) and clicks Withdraw
- **THEN** the system shows a confirmation dialog
- **AND** upon confirm changes status to Temporary saved and sets approval stage to `--`
- **AND** appends an entry to approvalLog

#### Scenario: Submit and Withdraw disabled for ineligible selections
- **WHEN** user selects records that do not meet Submit or Withdraw eligibility
- **THEN** the corresponding toolbar action is disabled or shows an appropriate notice

### Requirement: Row actions by status
The system SHALL provide row actions based on application status.

#### Scenario: Edit draft
- **WHEN** user clicks Edit on a Temporary saved row
- **THEN** the system opens the four-step wizard in edit mode

#### Scenario: View details for non-draft
- **WHEN** user clicks Details on an In Progress, Approved, or Rejected row
- **THEN** the system opens a read-only four-step detail view

#### Scenario: Approval log
- **WHEN** user clicks Approval Log on a row that has been submitted at least once
- **THEN** the system displays chronological approval history for that change application

#### Scenario: Rejected records are read-only terminal state
- **WHEN** a change application has status Rejected
- **THEN** Edit, Submit, and Withdraw are not available
- **AND** only Details and Approval Log are shown
- **AND** the application cannot be resubmitted; user must create a new change application to request further changes

### Requirement: Immutable course code
The system SHALL NOT allow changing the Course Code on a change application.

#### Scenario: Course code is read-only in wizard
- **WHEN** user views or edits Basic Information step
- **THEN** Course Code is displayed as read-only
- **AND** its value always matches the selected baseline course

#### Scenario: Validation enforces baseline course code
- **WHEN** user saves or submits a change application
- **THEN** the system rejects the operation if courseCode differs from the baseline snapshot courseCode

### Requirement: Baseline course selection
The system SHALL require selecting an approved baseline course from Course Information before completing a change application.

#### Scenario: Choose baseline course on step 1
- **WHEN** user clicks Choose on Change Description step
- **THEN** the system opens a course selection dialog listing courses from Course Information
- **AND** user selects exactly one course

#### Scenario: Auto-fill from baseline
- **WHEN** user confirms baseline course selection
- **THEN** the system copies baseline general information, CLO, and SLT data into the change application
- **AND** stores a baseline snapshot for later comparison and write-back

#### Scenario: Baseline locked after first save
- **WHEN** user has saved a draft change application
- **THEN** the baseline course SHALL NOT be changed without creating a new application

### Requirement: Four-step change wizard
The system SHALL provide a four-step wizard: Change Description, Basic Information, Course Learning Outcome (CLO), and Student Learning Time (SLT).

#### Scenario: Stepper navigation
- **WHEN** user views the wizard stepper
- **THEN** steps are clickable to jump directly to a step in detail mode or after validation in edit mode
- **AND** only the current step is highlighted in blue

#### Scenario: Wizard header actions
- **WHEN** user is in create or edit mode
- **THEN** the header provides Back (with leave confirmation), Cancel, Previous, Next, and Save
- **AND** Save persists the application as Temporary saved from any step

#### Scenario: Step validation on Next
- **WHEN** user clicks Next
- **THEN** the system validates the current step before advancing
- **AND** Step 1 requires baseline course and change description selections
- **AND** Step 2 requires valid basic information fields
- **AND** Step 3 requires at least one CLO

### Requirement: Change description annotations
The system SHALL allow marking each change component as Major Changes or Minor / No Changes on step 1.

#### Scenario: Main components
- **WHEN** user views MAIN COMPONENTS on Change Description step
- **THEN** the system lists Course Name, Credit Value, Course Classification, and CLO
- **AND** each row allows selecting Major Changes or Minor / No Changes

#### Scenario: Other components
- **WHEN** user views OTHER COMPONENTS on Change Description step
- **THEN** the system lists Synopsis, Pre-requisite / co-requisite, Teaching Methods, Course Content, Assessment Methods, and References
- **AND** each row allows selecting Major Changes or Minor / No Changes

#### Scenario: Default annotation
- **WHEN** user first loads Change Description for a new application
- **THEN** all components default to Minor / No Changes unless user changes them

### Requirement: Basic information step
The system SHALL provide a Basic Information step with the same fields as Course Information general information, pre-filled from the baseline course.

#### Scenario: Field parity with Course Information
- **WHEN** user views Basic Information step
- **THEN** fields include Course Code, Course Name, Offering, Course Owner, Course Classification, Credit, Medium of Instruction, Semester Type, Pre-requisite / co-requisite, Synopsis, and References
- **AND** Course Code is read-only and matches the baseline course
- **AND** other required fields match Course Application / Course Information validation rules

### Requirement: CLO and SLT steps
The system SHALL provide CLO and SLT steps consistent with Course Application wizard behavior.

#### Scenario: CLO management
- **WHEN** user is on the CLO step in edit mode
- **THEN** the system supports Create, Edit, and Delete for CLO rows via the shared CLO form modal
- **AND** at least one CLO is required before proceeding

#### Scenario: SLT management
- **WHEN** user is on the SLT step
- **THEN** the system displays Course Content Outline, Continuous Assessment, and Final Assessment sub-modules using the shared SLT step panel

### Requirement: Read-only detail view
The system SHALL provide a read-only detail view for submitted and completed change applications.

#### Scenario: Detail layout parity
- **WHEN** user opens Details
- **THEN** all four steps are viewable with the same structure as edit mode
- **AND** Change Description shows major/minor annotations in read-only form
- **AND** Basic Information uses the shared read-only general information layout aligned with Course Information detail styling

### Requirement: Write-back helper for final approval
The system SHALL provide a data-layer helper to write approved changes back to Course Information; the full approval UI SHALL be implemented in the Course Change Review module.

#### Scenario: Helper merges approved data
- **WHEN** `applyApprovedChangeToCourse` is invoked with an approved change application and the shared courses collection
- **THEN** the system updates the baseline course with approved form, CLO, and SLT data
- **AND** appends change records using the existing course change log builder
- **AND** sets the change application status to Approved and approval stage to Approved

#### Scenario: Application module does not expose approval UI
- **WHEN** user uses Course Change Application in v1
- **THEN** there is no Approval modal or stage-advance UI on the application list
- **AND** final approval and write-back are triggered only via the Review module calling the helper (or test/demo invocation)

#### Scenario: Approved change application is read-only
- **WHEN** a change application has status Approved
- **THEN** it cannot be edited or resubmitted from the change application list

### Requirement: Confirmation dialogs for destructive and submit actions
The system SHALL require secondary confirmation for Submit, Withdraw, Delete, and leaving the wizard with unsaved changes.

#### Scenario: Submit confirmation
- **WHEN** user confirms Submit from the toolbar
- **THEN** a Submit Confirmation dialog appears before status changes

#### Scenario: Withdraw confirmation
- **WHEN** user confirms Withdraw from the toolbar
- **THEN** a confirmation dialog appears before reverting to draft

#### Scenario: Leave wizard confirmation
- **WHEN** user clicks Back or Cancel with unsaved changes in the wizard
- **THEN** a leave confirmation dialog appears before returning to the list
