## ADDED Requirements

### Requirement: Deferment list page displays deferment history
The system SHALL display a paginated Deferment History table with columns: Application ID, Student ID, Name, Intake, Programme, Deferment Period, Reason, Status, Date, and Actions.

#### Scenario: Default list load
- **WHEN** user navigates to Deferment in the Student Records sidebar
- **THEN** the system displays the Deferment page with a Deferment History table and at least mock sample records

#### Scenario: Status badge display for six core statuses
- **WHEN** a record has status Draft, In Progress, Update Required, Approved, Rejected, or Cancelled
- **THEN** the system displays the status as a read-only badge with distinct styling aligned to programme transfer badges

#### Scenario: Reason column shows main reason
- **WHEN** a deferment record is shown in the list
- **THEN** the Reason column displays the localized main reason value

#### Scenario: List actions follow status rules
- **WHEN** user views a Draft record
- **THEN** the Actions column shows Details, Edit, Delete, and Workflow Log
- **WHEN** user views an In Progress record at Pending Review stage eligible for cancel
- **THEN** the Actions column shows Details, Cancel, and Workflow Log
- **WHEN** user views an Update Required record
- **THEN** the Actions column shows Details, Edit, and Workflow Log
- **WHEN** user views a Cancelled, Rejected, or Approved record
- **THEN** the Actions column shows Details and Workflow Log only

### Requirement: Search deferment applications
The system SHALL support searching applications by Student ID or Name using a search bar on the first row of the list page card.

#### Scenario: Search bar is first row without page title
- **WHEN** user navigates to Deferment
- **THEN** the list card does not display a large in-page title
- **AND** the first row of the card is the search bar with Search and Reset actions aligned to the right

#### Scenario: Search by student ID or name
- **WHEN** user enters a keyword and clicks Search
- **THEN** the list shows only matching records and resets to page 1

#### Scenario: Reset search
- **WHEN** user clears the keyword and clicks Reset
- **THEN** the full list is restored

### Requirement: Create and edit deferment applications with draft support
The system SHALL allow users to create and edit deferment applications via a multi-section form modal with Save Draft and Submit workflows.

#### Scenario: Open create form
- **WHEN** user clicks "+ New Deferment"
- **THEN** the system opens the Deferment form modal with Section I–III, Supporting Documents, and footer actions Close, Save Draft, and Submit

#### Scenario: Save draft
- **WHEN** user clicks Save Draft on a new or edited application
- **THEN** the application is saved with status Draft and appears in the list with Edit and Delete actions

#### Scenario: Submit application
- **WHEN** user completes all submit-required fields and clicks Submit
- **THEN** the application status becomes In Progress with approval stage Pending Review

#### Scenario: One active application per student
- **WHEN** user attempts to submit for a student who already has a Draft, In Progress, or Update Required deferment
- **THEN** the system prevents submission and displays a validation message

### Requirement: Deferment form sections match prototype
The system SHALL render the application form with sections and fields aligned to the StudentSys prototype.

#### Scenario: Section I student information
- **WHEN** user views Section I in the form
- **THEN** the system shows Student ID (required, searchable select), Date of Application (read-only), Name, Intake, NRIC/Passport No., Nationality, Programme, and Programme Level

#### Scenario: Student ID auto-fill
- **WHEN** user selects a Student ID from the student profile data
- **THEN** the system auto-fills Section I and Section II fields from the linked student profile

#### Scenario: Section II and III and supporting documents
- **WHEN** user views the form
- **THEN** the system shows Section II application fields, Section III parent/guardian fields, and required supporting document upload with format hints

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
- **THEN** the record is not physically deleted from Deferment History

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

### Requirement: Deferment approval workflow
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

### Requirement: Deferment list exposes workflow log action
The system SHALL provide a Workflow Log action on every deferment application row regardless of status.

#### Scenario: Workflow log opens separate modal
- **WHEN** user clicks Workflow Log on a deferment row
- **THEN** the system opens ApprovalLogModal with approval log entries in table format
- **AND** the modal displays a subtitle with application ID, student ID, and student name
- **AND** the detail modal does not contain an inline approval log section

#### Scenario: Workflow log on draft without submissions
- **WHEN** user clicks Workflow Log on a Draft application with no log entries
- **THEN** the modal opens and displays a no-data message

### Requirement: Deferment detail modal does not embed approval log
The system SHALL NOT display the approval log timeline inside DefermentDetailModal.

#### Scenario: Detail modal without log section
- **WHEN** user opens Details for any deferment application
- **THEN** the detail modal shows application sections and in-progress approval controls only
- **AND** does not show an inline approval log list

### Requirement: Deferment status demonstration mock data
The system SHALL provide mock deferment records covering Draft, In Progress, Cancelled, Update Required, Rejected, and Approved with at least two records per status.

#### Scenario: Draft status samples
- **WHEN** user loads Deferment History with mock data
- **THEN** at least two Draft records exist with Edit and Delete actions

#### Scenario: In progress status samples
- **WHEN** user loads Deferment History with mock data
- **THEN** at least two In Progress records exist including one Pending Review record with Cancel and one record beyond Pending Review without Cancel

#### Scenario: Cancelled update required rejected approved samples
- **WHEN** user loads Deferment History with mock data
- **THEN** at least two records exist for each of Cancelled, Update Required, Rejected, and Approved statuses

### Requirement: Deferment page supports bilingual i18n
The system SHALL provide English and Chinese translations for all Deferment page UI text including six status badges and workflow actions.

#### Scenario: Locale switching
- **WHEN** user switches application language
- **THEN** Deferment list, form, details, status badges, and actions display text from the active locale

### Requirement: Deferment page is registered in student records app
The system SHALL register Deferment as a developed page in the Student Records Application.

#### Scenario: Sidebar navigation
- **WHEN** user selects Deferment in the Student Records sidebar
- **THEN** the system displays DefermentView instead of the under-construction page
