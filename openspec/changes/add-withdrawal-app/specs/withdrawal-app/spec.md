## ADDED Requirements

### Requirement: Withdrawal list page displays withdrawal history
The system SHALL display a paginated Withdrawal History table with columns: Application ID, Student ID, Name, Programme, Intake, Reason, Status, Date, and Actions.

#### Scenario: Default list load
- **WHEN** user navigates to Withdrawal in the Student Records sidebar
- **THEN** the system displays the Withdrawal page with a Withdrawal History table and at least mock sample records

#### Scenario: Status badge display for six core statuses
- **WHEN** a record has status Draft, In Progress, Update Required, Approved, Rejected, or Cancelled
- **THEN** the system displays the status as a read-only badge with distinct styling aligned to programme transfer and deferment badges

#### Scenario: Reason column shows main reason without level suffix
- **WHEN** a withdrawal record is shown in the list
- **THEN** the Reason column displays the localized main reason text without appending (UG) or (PG) suffixes

#### Scenario: List actions follow status rules
- **WHEN** user views a Draft record
- **THEN** the Actions column shows Details, Edit, Delete, and Workflow Log
- **WHEN** user views an In Progress record at Pending Review stage eligible for cancel
- **THEN** the Actions column shows Details, Cancel, and Workflow Log
- **WHEN** user views an In Progress record beyond Pending Review or with approval decisions in the log
- **THEN** the Actions column shows Details and Workflow Log only
- **WHEN** user views an Update Required record
- **THEN** the Actions column shows Details, Edit, and Workflow Log
- **WHEN** user views a Cancelled, Rejected, or Approved record
- **THEN** the Actions column shows Details and Workflow Log only

### Requirement: Search withdrawal applications
The system SHALL support searching applications by Student ID or Name using a search bar on the first row of the list page card.

#### Scenario: Search bar is first row without page title
- **WHEN** user navigates to Withdrawal
- **THEN** the list card does not display a large in-page title
- **AND** the first row of the card is the search bar with Search and Reset actions aligned to the right

#### Scenario: Search field label matches input meaning
- **WHEN** user views the search bar
- **THEN** the label describes the searchable content (e.g. "Student ID or Name:") followed by the text input

#### Scenario: Search by student ID or name
- **WHEN** user enters a keyword and clicks Search
- **THEN** the list shows only matching records and resets to page 1

#### Scenario: Reset search
- **WHEN** user clears the keyword and clicks Reset
- **THEN** the full list is restored

### Requirement: Create and edit withdrawal applications with draft support
The system SHALL allow users to create and edit withdrawal applications via a multi-section form modal with Save Draft and Submit workflows.

#### Scenario: Open create form
- **WHEN** user clicks "+ New Withdrawal"
- **THEN** the system opens the Withdrawal Application form modal with Section I–III, declaration, supporting documents, conditional ISAO note area, and footer actions Close, Save Draft, and Submit

#### Scenario: Save draft
- **WHEN** user clicks Save Draft on a new or edited application
- **THEN** the application is saved with status Draft and appears in the list with Edit and Delete actions

#### Scenario: Submit application
- **WHEN** user completes all submit-required fields including declaration, parent/guardian section, and attachment and clicks Submit
- **THEN** the application status becomes In Progress with approval stage Pending Review

#### Scenario: One active application per student
- **WHEN** user attempts to submit for a student who already has a Draft, In Progress, or Update Required withdrawal
- **THEN** the system prevents submission and displays a validation message

### Requirement: Withdrawal form sections match prototype
The system SHALL render the application form with sections and fields aligned to the StudentSys prototype.

#### Scenario: Section I student information
- **WHEN** user views Section I in the form
- **THEN** the system shows Student ID (required, searchable select), Date of Application (read-only, current date), Name, Intake, NRIC/Passport No., Nationality, Programme, and Programme Level

#### Scenario: Student ID auto-fill
- **WHEN** user selects a Student ID from the student profile data
- **THEN** the system auto-fills Section I and Section II contact fields from the linked student profile

#### Scenario: Section II student application
- **WHEN** user views Section II in the form
- **THEN** the system shows Personal Email, Phone Number, Last Date of Attendance, Destination after Leaving, Main Reason for Withdrawal (dropdown), Current Whereabout, and Detailed Reason (textarea)

#### Scenario: Main reason dropdown without level suffix
- **WHEN** user views the Main Reason for Withdrawal dropdown
- **THEN** the system shows localized reason options without (UG) or (PG) suffixes

#### Scenario: Declaration checkbox
- **WHEN** user views the declaration area
- **THEN** the system shows one required checkbox declaring that all provided information is correct and complete

#### Scenario: Section III parent or guardian consent
- **WHEN** user views Section III in the form
- **THEN** the system shows Parent/Guardian Name, Contact No., NRIC/Passport No., Relationship, and Email as required fields on submit

#### Scenario: Supporting documents section
- **WHEN** user views Supporting Documents in the form
- **THEN** the system shows required attachment upload (mock) with format hint PDF/JPG/PNG/DOCX max 5MB and Download Consent Letter action

#### Scenario: ISAO note for international students only
- **WHEN** user selects a student with category International
- **THEN** the system displays a purple ISAO note alert that ISAO approval is required for withdrawal

#### Scenario: ISAO note hidden for local and china students
- **WHEN** user selects a student with category Local or China
- **THEN** the system does not display the ISAO note alert

### Requirement: Withdrawal form validation
The system SHALL validate required fields according to form mode (draft vs submit/resubmit).

#### Scenario: Draft validation
- **WHEN** user clicks Save Draft
- **THEN** the system requires only Student ID and allows saving without declaration, parent section, or attachment

#### Scenario: Submit validation
- **WHEN** user clicks Submit or Resubmit without Student ID, Section II required fields, declaration checkbox, Section III fields, or attachment
- **THEN** the system prevents submission and displays inline validation messages

### Requirement: Cancel in-progress application before review starts
The system SHALL allow students to cancel an In Progress application only while it is at Pending Review and before any approval decision is recorded.

#### Scenario: Cancel at pending review
- **WHEN** user clicks Cancel on an In Progress application at Pending Review with no approval decisions in the log
- **THEN** the application status becomes Cancelled, is archived, and remains in history as read-only

#### Scenario: Cancel not available after review starts
- **WHEN** an In Progress application has progressed beyond Pending Review or has approval decisions in the log
- **THEN** the Cancel action is not shown

#### Scenario: Cancel does not delete record
- **WHEN** user cancels an application
- **THEN** the record is not physically deleted from Withdrawal History

### Requirement: Update required allows edit and resubmit
The system SHALL allow editing and resubmission when an application is in Update Required status.

#### Scenario: Edit update required application
- **WHEN** user clicks Edit on an Update Required record
- **THEN** the system opens the form modal with existing data editable

#### Scenario: Resubmit after update
- **WHEN** user saves changes and resubmits an Update Required application
- **THEN** the status becomes In Progress with approval stage Pending Review

### Requirement: Terminal statuses are read-only
The system SHALL treat Approved, Rejected, and Cancelled as terminal archived statuses with read-only details.

#### Scenario: View terminal details
- **WHEN** user clicks Details on an Approved, Rejected, or Cancelled application
- **THEN** the system shows all sections in read-only mode with no approval or edit actions

#### Scenario: In progress allows approval
- **WHEN** an application has status In Progress
- **THEN** approval actions are available in Details when the user can approve

#### Scenario: ISAO note in details for international student
- **WHEN** user views Details for an application linked to an International student
- **THEN** the system displays the ISAO note in read-only mode

### Requirement: Withdrawal approval workflow
The system SHALL implement a mock multi-stage approval workflow driven by approval actions, not manual status selection.

#### Scenario: Approve and advance stage
- **WHEN** an administrator approves a non-final stage on an In Progress application
- **THEN** the application advances to the next approval stage and remains In Progress

#### Scenario: Final approval
- **WHEN** an administrator approves at the final stage
- **THEN** the application status becomes Approved and is archived

#### Scenario: Update required decision
- **WHEN** an administrator selects Update Required with a comment
- **THEN** the application status becomes Update Required and allows edit and resubmit

#### Scenario: Reject application
- **WHEN** an administrator selects Rejected with a comment
- **THEN** the application status becomes Rejected, is archived, and the workflow terminates

#### Scenario: Reject requires comment
- **WHEN** an administrator selects Rejected without a comment
- **THEN** the system prevents the decision and displays a validation message

### Requirement: Withdrawal list exposes workflow log action
The system SHALL provide a Workflow Log action on every withdrawal application row regardless of status.

#### Scenario: Workflow log opens separate modal
- **WHEN** user clicks Workflow Log on a withdrawal row
- **THEN** the system opens ApprovalLogModal with approval log entries in table format
- **AND** the modal displays a subtitle with application ID, student ID, and student name
- **AND** the detail modal does not contain an inline approval log section

#### Scenario: Workflow log on draft without submissions
- **WHEN** user clicks Workflow Log on a Draft application with no log entries
- **THEN** the modal opens and displays a no-data message

### Requirement: Withdrawal detail modal does not embed approval log
The system SHALL NOT display the approval log timeline inside WithdrawalDetailModal.

#### Scenario: Detail modal without log section
- **WHEN** user opens Details for any withdrawal application
- **THEN** the detail modal shows application sections and in-progress approval controls only
- **AND** does not show an inline approval log list

### Requirement: Withdrawal status demonstration mock data
The system SHALL provide mock withdrawal records covering Draft, In Progress, Cancelled, Update Required, Rejected, and Approved with at least two records per status.

#### Scenario: Draft status samples
- **WHEN** user loads Withdrawal History with mock data
- **THEN** at least two Draft records exist with Edit and Delete actions

#### Scenario: In progress status samples
- **WHEN** user loads Withdrawal History with mock data
- **THEN** at least two In Progress records exist including one Pending Review record with Cancel and one record beyond Pending Review without Cancel

#### Scenario: Cancelled update required rejected approved samples
- **WHEN** user loads Withdrawal History with mock data
- **THEN** at least two records exist for each of Cancelled, Update Required, Rejected, and Approved statuses

### Requirement: Withdrawal page supports bilingual i18n
The system SHALL provide complete English and Chinese translations for all Withdrawal page UI text including six status badges and workflow actions via the `withdrawal.*` i18n namespace.

#### Scenario: English locale
- **WHEN** user sets the application language to English
- **THEN** Withdrawal list, form, details, status badges, main reason options, declaration, and ISAO note display English text from `en.js`

#### Scenario: Chinese locale
- **WHEN** user sets the application language to Chinese
- **THEN** Withdrawal list, form, details, status badges, main reason options, declaration, and ISAO note display Chinese text from `zh.js`

### Requirement: Withdrawal page is registered in student records app
The system SHALL register Withdrawal as a developed page in the Student Records Application.

#### Scenario: Sidebar navigation
- **WHEN** user selects Withdrawal in the sidebar
- **THEN** the system displays WithdrawalView instead of the under-construction page
