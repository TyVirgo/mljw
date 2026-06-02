## ADDED Requirements

### Requirement: Lecturer list page displays core fields
The system SHALL display a paginated table of lecturers with columns: No., Staff ID, Name, Gender, Category, Department, Academic Qualification (Highest), Title, Academic Position, Degree, Employment Status, Date of Joining, and Actions (Details, Edit, Delete).

#### Scenario: Default list load
- **WHEN** user navigates to Lecturer Information
- **THEN** the system displays the first page of lecturer records with all listed columns

#### Scenario: Requires Evaluation tag
- **WHEN** a lecturer record has `requiresEvaluation` set to true
- **THEN** the system displays a green "Requires Evaluation" tag next to the lecturer name in the list

### Requirement: Search and filter lecturers
The system SHALL support searching and filtering by Staff ID, Name, Department, Category, Title, Academic Position, Degree, and Employment Status.

#### Scenario: Basic search
- **WHEN** user enters Staff ID or Name and clicks Search
- **THEN** the list shows only matching records and resets to page 1

#### Scenario: Expanded filters via More
- **WHEN** user clicks More and sets Title, Academic Position, Degree, or Employment Status filters then clicks Search
- **THEN** the list applies all active filters together (AND logic)

#### Scenario: Evaluation filter toggle
- **WHEN** user enables "Filter lecturers who require teaching observation/lecture evaluation" and clicks Search
- **THEN** the list shows only lecturers with `requiresEvaluation` true

#### Scenario: Reset filters
- **WHEN** user clicks Reset
- **THEN** all search fields and the evaluation toggle are cleared and the full list is restored

### Requirement: Create lecturer via four-step wizard
The system SHALL provide a Create modal with four steps: (1) Basic Info, (2) Academic Qualifications, (3) Working Experience, (4) CPD preview.

#### Scenario: Step 1 — Personal and Employment Information
- **WHEN** user opens Create and is on step 1
- **THEN** the system shows Personal Information fields (Name*, Gender*, Date of Birth, Nationality, Mobile Phone*, Personal Email, Degree*, Research focus areas) and Employment Information fields (Staff ID*, Category*, School/Department*, Foundation/Undergraduate/Postgraduate*, Title*, Academic Position*, Office Extension*, XMUM Email*, Date of Joining*, Currently Teaching*, Employment Status*) plus Others (Attachment PDF upload, Remarks 0/100)

#### Scenario: Step 2 — Academic Qualifications
- **WHEN** user proceeds to step 2
- **THEN** the system allows adding, editing, saving, and deleting multiple qualification records, each with Name of Qualification, Name of Awarding Institution, Awarding country, Year of Award, Remarks, and attachment upload (PDF)

#### Scenario: Step 3 — Working Experience
- **WHEN** user proceeds to step 3
- **THEN** the system allows adding, editing, saving, and deleting multiple working experience records with Academic Position, Employer, Start of Service, End of Service, Experience in Education (Years), and Experience in Industry (Years)

#### Scenario: Step 4 — CPD read-only on create
- **WHEN** user proceeds to step 4 during Create
- **THEN** the system shows an empty or informational CPD section indicating data will come from HR sync or teacher portal approval (no manual entry on create)

#### Scenario: Successful create
- **WHEN** user completes all required fields on steps 1–3 and clicks Confirm on step 4
- **THEN** the system saves the new lecturer and refreshes the list

### Requirement: Edit lecturer via four-step wizard
The system SHALL allow editing an existing lecturer using the same four-step wizard, pre-filled with existing data.

#### Scenario: Edit pre-fill
- **WHEN** user clicks Edit on a list row
- **THEN** the wizard opens with all existing lecturer data loaded across steps 1–3

#### Scenario: Successful edit
- **WHEN** user modifies data and confirms
- **THEN** the system updates the record and reflects changes in the list

### Requirement: View lecturer details via four-step modal
The system SHALL provide a read-only Details modal with four steps matching the Create wizard structure.

#### Scenario: Step 1 details — Basic Info
- **WHEN** user clicks Details on a list row
- **THEN** step 1 shows Personal Information, Employment Information, attachment download, and Remarks in read-only format

#### Scenario: Step 2 details — Qualifications
- **WHEN** user navigates to step 2 in Details
- **THEN** the system lists all academic qualifications with attachment download links

#### Scenario: Step 3 details — Working Experience
- **WHEN** user navigates to step 3 in Details
- **THEN** the system lists all working experience records in read-only card layout

#### Scenario: Step 4 details — CPD by year
- **WHEN** user navigates to step 4 in Details
- **THEN** the system displays CPD records grouped by year with summary (Number of Activity Attended, Number of Hours Earned) and a table per year (No., Name of Activity, Name of Activity Provider, Type of Activity, Category, Mode of Delivery, Date(s) Attended, Number of Hours Earned, Evidence download link)

### Requirement: Delete lecturers
The system SHALL support single-row and batch delete with confirmation.

#### Scenario: Single delete
- **WHEN** user clicks Delete on one row and confirms
- **THEN** the lecturer is removed from the list

#### Scenario: Batch delete
- **WHEN** user selects multiple rows, clicks Delete, and confirms
- **THEN** all selected lecturers are removed

### Requirement: Export lecturer data
The system SHALL support exporting filtered lecturer list data to Excel via the existing Export modal pattern.

#### Scenario: Export current page
- **WHEN** user clicks Export and selects current page fields
- **THEN** the system downloads an Excel file with selected columns for the current page

### Requirement: Toolbar placeholder actions
The system SHALL display Sync Cache and Refers to EMS system buttons that show an informational notice when clicked (no backend integration in this phase).

#### Scenario: Sync Cache placeholder
- **WHEN** user clicks Sync Cache
- **THEN** the system shows a notice that HR system sync is not yet connected

#### Scenario: EMS reference placeholder
- **WHEN** user clicks Refers to EMS system
- **THEN** the system shows a notice that EMS integration is not yet connected

### Requirement: CPD data sources (future integration)
The system SHALL document that CPD data originates from (1) HR system sync and (2) teacher portal submission after approval; in this phase CPD is populated from mock data only.

#### Scenario: Mock CPD on detail view
- **WHEN** user views step 4 Details for a lecturer with mock CPD data
- **THEN** the system displays the mock CPD records grouped by year
