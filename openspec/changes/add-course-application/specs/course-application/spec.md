## ADDED Requirements

### Requirement: Course application list page
The system SHALL display a paginated table of course applications with columns: No., Status, Approval Stage, Course Name, Offering, Course Classification, Credit, Applicant, Application Date and Time, and Actions (Details, Approval Log).

#### Scenario: Default list load
- **WHEN** user navigates to Course Application
- **THEN** the system displays the first page of application records with all listed columns

#### Scenario: Status badge colors
- **WHEN** an application has status In Progress, Approved, Temporary saved, or Rejected
- **THEN** the system displays the status with distinct badge styling (blue, green, grey, red respectively)

### Requirement: Search and filter applications
The system SHALL support searching by Course Code, Course Name, Offering, and Course Classification, with optional expanded filters via More.

#### Scenario: Basic search
- **WHEN** user enters Course Code or Course Name and clicks Search
- **THEN** the list shows only matching records and resets to page 1

#### Scenario: Reset filters
- **WHEN** user clicks Reset
- **THEN** all search fields are cleared and the full list is restored

### Requirement: Apply new course via three-step wizard
The system SHALL provide a full-page Apply New Course flow with three steps: (1) General Information, (2) Course Learning Outcome (CLO), (3) Student Learning Time (SLT).

#### Scenario: Wizard navigation
- **WHEN** user clicks Apply New Course
- **THEN** the list is replaced by a full-page wizard with a clickable step indicator, Back button, and Previous / Next / Save controls in the header area
- **AND** step content is rendered inline in a scrollable page area, not inside a large modal dialog

#### Scenario: Step indicator highlights current step only
- **WHEN** user is on a wizard step
- **THEN** only the current step title and circle are styled active (blue)
- **AND** other step titles remain inactive (grey)

#### Scenario: Click step to navigate
- **WHEN** user clicks a step title in the step indicator
- **THEN** the wizard navigates directly to that step's content

#### Scenario: Back confirmation
- **WHEN** user clicks Back
- **THEN** the system shows a confirmation dialog before returning to the list

#### Scenario: Save from header
- **WHEN** user clicks Save in the wizard header
- **THEN** the application is saved as Temporary saved without using a Cancel button
- **AND** Save is positioned to the right of Next

#### Scenario: Step 1 — General Information layout
- **WHEN** user is on step 1
- **THEN** the system shows the same general fields as Course Information in a two-column scrollable form layout
- **AND** the Credit field input width matches the select dropdown width in the same column

#### Scenario: CLO required before step 3
- **WHEN** user is on step 2 with zero CLO records and clicks Next
- **THEN** the system prevents navigation and displays a validation message that at least one CLO is required

#### Scenario: CLO required on save
- **WHEN** user attempts to save the application on step 3 with zero CLO records
- **THEN** the system prevents save and displays a validation message that at least one CLO is required

#### Scenario: Step 2 — CLO management
- **WHEN** user is on step 2
- **THEN** the system displays a CLO table with Create and Delete actions and per-row Edit and Delete
- **AND** Create opens a modal with CLO, Outcome (max 100 chars), Bloom's Taxonomy Level (single select), Teaching Methods (multi-select), and Assessment Methods (multi-select)

#### Scenario: CLO field options
- **WHEN** user selects Bloom's Taxonomy Level
- **THEN** options include A1–A5, C1–C6, and P1–P7
- **WHEN** user selects Teaching Methods
- **THEN** options include Lecture, Practical, and Others (multi-select)
- **WHEN** user selects Assessment Methods
- **THEN** options include Assignments, Quiz, Mid-term Examination, Practical Test, Lab Report, Presentation, Project, and Final Examination (multi-select)

#### Scenario: Step 3 — SLT management
- **WHEN** user is on step 3
- **THEN** the system provides subsections for Course Content Outline and Subtopics, Continuous Assessment, and Final Assessment, each with table CRUD and Create modals

#### Scenario: Course content outline modal
- **WHEN** user creates a course content outline entry
- **THEN** the modal requires Course Content and CLO selection and provides Learning Time inputs for F2F Physical, F2F Online/Technology-mediated, and NF2F with auto-calculated Total SLT

#### Scenario: Continuous and final assessment modals
- **WHEN** user creates a continuous or final assessment entry
- **THEN** the modal requires assessment type and percentage and provides Learning Time fields with auto-calculated Total SLT

#### Scenario: Save draft
- **WHEN** user completes the wizard and confirms save on the final step
- **THEN** the application is saved with status Temporary saved and appears in the list

### Requirement: Submit applications for review
The system SHALL allow submitting selected Temporary saved applications for approval.

#### Scenario: Submit from list
- **WHEN** user selects one or more Temporary saved applications and clicks Submit
- **THEN** each selected application changes to status In Progress with approval stage HoD/HoP Review and an entry is appended to approval log

#### Scenario: Rejected applications cannot be resubmitted
- **WHEN** an application has status Rejected
- **THEN** the system does not offer Edit or Submit actions for that application
- **AND** Details and Approval Log remain available as read-only actions

### Requirement: View details and approval log
The system SHALL provide read-only Details and an Approval Log for each application.

#### Scenario: Details
- **WHEN** user clicks Details on a list row
- **THEN** the system opens a read-only view of all three wizard steps' data

#### Scenario: Approval log
- **WHEN** user clicks Approval Log on a list row
- **THEN** the system displays a chronological list of approval events for that application

### Requirement: Delete and export applications
The system SHALL support batch delete and export of application records.

#### Scenario: Delete with confirmation
- **WHEN** user selects applications and clicks Delete
- **THEN** the system prompts for confirmation and removes deletable records (Approved applications SHALL NOT be deletable)

#### Scenario: Export
- **WHEN** user clicks Export and selects fields
- **THEN** the system downloads an Excel file of filtered application list data

#### Scenario: Import placeholder
- **WHEN** user clicks Import
- **THEN** the system displays a placeholder notice that import is not yet available
- **AND** no file upload or Excel parsing is performed in this phase

### Requirement: Edit permissions by status
The system SHALL restrict editing to Temporary saved applications only.

#### Scenario: Edit draft only
- **WHEN** user opens a Temporary saved application for editing
- **THEN** the three-step wizard opens in editable apply mode

#### Scenario: No edit for other statuses
- **WHEN** an application has status In Progress, Approved, or Rejected
- **THEN** the system does not provide an Edit action; only Details and Approval Log (where applicable) are available

### Requirement: App registration
The system SHALL register Course Application as a developed page accessible from the Course Info submenu.

#### Scenario: Menu access
- **WHEN** user clicks Course Application in the sidebar
- **THEN** the Course Application view loads instead of Under Construction
