## ADDED Requirements

### Requirement: Programme Transfer list page displays application history
The system SHALL display a paginated Application History table for programme transfer requests with columns: Application ID, Student ID, Name, Type, Old Programme, New Programme, Status, Date, and Actions.

#### Scenario: Default list load
- **WHEN** user navigates to Programme Transfer in the Student Records sidebar
- **THEN** the system displays the Programme Transfer Application page with an Application History table and at least mock sample records

#### Scenario: Type column value
- **WHEN** a programme transfer record is shown in the list
- **THEN** the Type column displays "Programme Transfer" (localized)

#### Scenario: Status badge display
- **WHEN** a record has status Draft, In Progress, Update Required, Approved, Rejected, Cancelled, or Expired
- **THEN** the system displays the status as a read-only badge with distinct styling (not an editable dropdown)

### Requirement: Search programme transfer applications
The system SHALL support searching applications by Student ID or Name using a single keyword field.

#### Scenario: Search by student ID
- **WHEN** user enters a student ID keyword and clicks Search
- **THEN** the list shows only matching records and resets to page 1

#### Scenario: Search by name
- **WHEN** user enters a student name keyword and clicks Search
- **THEN** the list shows records whose student name matches the keyword

#### Scenario: Reset search
- **WHEN** user clears the keyword and searches again or uses reset
- **THEN** the full filtered list (by active/archived tab) is restored

### Requirement: Filter active and archived applications
The system SHALL provide a filter to view in-progress applications separately from archived applications.

#### Scenario: Active filter
- **WHEN** user selects the in-progress filter tab
- **THEN** the list shows only records that are not archived (Draft, In Progress, Update Required)

#### Scenario: Archived filter
- **WHEN** user selects the archived filter tab
- **THEN** the list shows only records with archived status (Approved, Rejected, Cancelled, Expired)

### Requirement: Create new programme transfer application
The system SHALL allow users to create a new programme transfer application via a "+ New Application" action opening a multi-section form modal.

#### Scenario: Open create form
- **WHEN** user clicks "+ New Application"
- **THEN** the system opens the Programme Transfer Application form modal with Notes, Section I–IV, and footer actions Cancel, Save Draft, and Submit

#### Scenario: Save draft
- **WHEN** user fills required draft fields and clicks Save Draft
- **THEN** the application is saved with status Draft and appears in the active list

#### Scenario: Submit application
- **WHEN** user completes all submit-required fields including declaration and attachment and clicks Submit
- **THEN** the application changes to status In Progress with approval stage Pending Review and is not editable by the applicant except where cancel is allowed

#### Scenario: One active application per student
- **WHEN** user attempts to create or submit an application for a student who already has a non-terminal application
- **THEN** the system prevents the action and displays a validation message

### Requirement: Programme transfer form sections match prototype
The system SHALL render the application form with the following sections and fields aligned to the StudentSys prototype.

#### Scenario: Section I student details
- **WHEN** user views Section I in the form
- **THEN** the system shows Student ID (required, searchable select), Full Name, NRIC/Passport No., Nationality, Email, Contact No., and Student Visa Expiry Date

#### Scenario: Student ID auto-fill
- **WHEN** user selects a Student ID from the student profile data
- **THEN** the system auto-fills Section I fields and Section II current programme, intake, and school from the linked student profile

#### Scenario: Section II transfer information
- **WHEN** user views Section II in the form
- **THEN** the system shows Current Programme, Current Intake, Current School, New Programme (1st Choice, required), New Programme (2nd Choice, optional), Start Semester of New Programme (required), and Reasons to Transfer (required textarea)

#### Scenario: Section III declaration
- **WHEN** user views Section III
- **THEN** the system shows declaration text and a required checkbox "I agree to the declaration"

#### Scenario: Section IV supporting documents
- **WHEN** user views Section IV
- **THEN** the system shows required attachment upload (mock: file name and size) with supported format hint PDF, JPG, PNG, DOCX, max 5MB, and a Download Consent Letter action

#### Scenario: Section VII academic affairs fields
- **WHEN** user is an administrator editing during the Academic Affairs approval stage
- **THEN** the system shows Section VII fields New Programme, New Intake, and Date for office use only

### Requirement: Edit and delete draft applications
The system SHALL allow full edit and delete only for applications in Draft status.

#### Scenario: Edit draft
- **WHEN** user clicks Edit on a Draft application
- **THEN** the system opens the form modal pre-filled and allows Save Draft or Submit

#### Scenario: Delete draft
- **WHEN** user clicks Delete on a Draft application and confirms
- **THEN** the application is removed from the list

#### Scenario: Non-draft cannot be deleted
- **WHEN** user views a non-Draft application in the list
- **THEN** Delete action is not available

### Requirement: Cancel application before approval starts
The system SHALL allow the applicant to cancel an application that is In Progress at Pending Review stage only.

#### Scenario: Cancel pending review
- **WHEN** user clicks Cancel on an In Progress application with approval stage Pending Review and confirms
- **THEN** the application changes to status Cancelled, is archived, and cannot be edited or resubmitted

#### Scenario: Cannot cancel after approval started
- **WHEN** an application has approval stage beyond Pending Review
- **THEN** Cancel action is not available

### Requirement: Update Required allows edit and resubmit
The system SHALL allow editing and resubmission for applications in Update Required status.

#### Scenario: Edit update required
- **WHEN** user clicks Edit on an Update Required application
- **THEN** the system opens the form modal for editing all applicant sections

#### Scenario: Resubmit after update
- **WHEN** user saves changes and clicks Resubmit with valid data
- **THEN** the application returns to status In Progress with approval stage Pending Review and a resubmit entry is appended to the approval log

### Requirement: Terminal statuses are read-only archived
The system SHALL treat Approved, Rejected, Cancelled, and Expired as terminal archived statuses with read-only details.

#### Scenario: View approved details
- **WHEN** user clicks Details on an Approved application
- **THEN** the system shows all sections and Section VII values in read-only mode with no edit or resubmit actions

#### Scenario: Rejected is terminal
- **WHEN** an application is Rejected at any approval node
- **THEN** the application is archived and cannot be edited or resubmitted

#### Scenario: Expired is terminal
- **WHEN** a Draft or Update Required application exceeds the application deadline (mock)
- **THEN** the system may transition it to Expired, archive it, and disallow edit or resubmit

### Requirement: Programme transfer approval workflow
The system SHALL implement a mock multi-stage approval workflow driven by approval actions, not manual status selection.

#### Scenario: Approval stages progression
- **WHEN** an administrator approves an In Progress application at a non-final stage
- **THEN** the approval stage advances Pending Review → Academic Affairs → Dean/HoP and status remains In Progress

#### Scenario: Final approval
- **WHEN** an administrator approves at the final stage with Section VII completed
- **THEN** the application status becomes Approved, is archived, and approval log records the decision

#### Scenario: Update required decision
- **WHEN** an administrator selects Update Required with a comment
- **THEN** the application status becomes Update Required and returns to the applicant for editing

#### Scenario: Reject decision
- **WHEN** an administrator selects Rejected with a comment
- **THEN** the application status becomes Rejected, is archived, and the workflow terminates

#### Scenario: Approval log in details
- **WHEN** user opens Details on a submitted application
- **THEN** the system displays an approval log with stage, actor, action, date/time, and comment entries

### Requirement: Programme transfer form validation on submit
The system SHALL validate required fields before Submit or Resubmit.

#### Scenario: Missing required fields
- **WHEN** user clicks Submit without Student ID, first-choice programme, start semester, reasons, declaration, or attachment
- **THEN** the system prevents submission and displays inline validation messages

#### Scenario: Attachment format hint
- **WHEN** user selects an attachment file in the mock uploader
- **THEN** the system stores file metadata only and shows the selected file name

### Requirement: Programme transfer page is registered in student records app
The system SHALL register Programme Transfer as a developed page in the Student Records Application.

#### Scenario: Sidebar navigation
- **WHEN** user selects Programme Transfer in the Student Records sidebar
- **THEN** the system displays ProgrammeTransferView instead of the under-construction page

#### Scenario: Breadcrumb
- **WHEN** user is on the Programme Transfer page
- **THEN** the breadcrumb shows Student Status Management > Programme Transfer (localized)

## MODIFIED Requirements

### Requirement: Search programme transfer applications
The system SHALL support searching applications by Student ID or Name using a search bar on the first row of the list page, with a field-specific label followed by the input control.

#### Scenario: Search bar is first row without page title
- **WHEN** user navigates to Programme Transfer
- **THEN** the list card does not display a large in-page title such as "Programme Transfer Application"
- **AND** the first row of the card is the search bar with Search and Reset actions

#### Scenario: Search field label matches input meaning
- **WHEN** user views the search bar
- **THEN** the label describes the searchable content (e.g. "Student ID or Name:") followed by the text input on the same row as the action buttons

#### Scenario: Search by student ID
- **WHEN** user enters a student ID keyword and clicks Search
- **THEN** the list shows only matching records and resets to page 1

#### Scenario: Search by name
- **WHEN** user enters a student name keyword and clicks Search
- **THEN** the list shows records whose student name matches the keyword

#### Scenario: Reset search
- **WHEN** user clears the keyword and clicks Reset
- **THEN** the full filtered list (by active/archived tab) is restored

### Requirement: Programme transfer form sections match prototype
The system SHALL render the application form with sections aligned to the StudentSys prototype, including Section VII on create and edit forms.

#### Scenario: Section I student details
- **WHEN** user views Section I in the form
- **THEN** the system shows Student ID (required, searchable select), Full Name, NRIC/Passport No., Nationality, Email, Contact No., and Student Visa Expiry Date

#### Scenario: Student ID auto-fill
- **WHEN** user selects a Student ID from the student profile data
- **THEN** the system auto-fills Section I fields and Section II current programme, intake, and school from the linked student profile

#### Scenario: Section II transfer information
- **WHEN** user views Section II in the form
- **THEN** the system shows Current Programme, Current Intake, Current School, New Programme (1st Choice, required), New Programme (2nd Choice, optional), Start Semester of New Programme (required), and Reasons to Transfer (required textarea)

#### Scenario: Section III declaration
- **WHEN** user views Section III
- **THEN** the system shows declaration text and a required checkbox "I agree to the declaration"

#### Scenario: Section IV supporting documents
- **WHEN** user views Section IV
- **THEN** the system shows required attachment upload (mock: file name and size) with supported format hint PDF, JPG, PNG, DOCX, max 5MB, and a Download Consent Letter action

#### Scenario: Section VII visible on create form
- **WHEN** user opens the create application form via "+ New Application"
- **THEN** the system displays Section VII after Section IV with grey section header "FOR ACADEMIC AFFAIRS OFFICE USE ONLY"
- **AND** fields New Programme (Select Programme), New Intake (Select Intake), and Date (Please Select) match the prototype layout

#### Scenario: Section VII layout on form
- **WHEN** user views Section VII in the create or edit form
- **THEN** New Programme and New Intake appear on the first row and Date appears on the second row below New Programme

#### Scenario: Section VII academic affairs fields in details approval
- **WHEN** user is an administrator editing during the Academic Affairs approval stage in Details
- **THEN** the system allows editing Section VII fields New Programme, New Intake, and Date for office use only

## ADDED Requirements

### Requirement: Programme transfer mock data covers all core statuses with two samples each
The system SHALL provide at least two mock programme transfer records for each core business status: Draft, In Progress, Cancelled, Update Required, Rejected, and Approved.

#### Scenario: Two draft samples
- **WHEN** user loads the Programme Transfer Application History list
- **THEN** at least two records have status Draft and each supports Edit and Delete actions

#### Scenario: Two in progress samples with cancel eligibility
- **WHEN** user views In Progress records
- **THEN** at least two records exist
- **AND** at least one has approval stage Pending Review and shows Cancel action
- **AND** at least one has approval stage beyond Pending Review and does not show Cancel action

#### Scenario: Two cancelled samples are read only
- **WHEN** user views Cancelled records
- **THEN** at least two archived Cancelled records exist
- **AND** neither shows Edit, Delete, or Resubmit actions

#### Scenario: Two update required samples allow resubmit
- **WHEN** user views Update Required records
- **THEN** at least two records exist and each shows Edit action for resubmission workflow

#### Scenario: Two rejected samples are terminal
- **WHEN** user views Rejected records
- **THEN** at least two archived Rejected records exist from different approval stages
- **AND** neither allows Edit or Resubmit

#### Scenario: Two approved samples are terminal
- **WHEN** user views Approved records
- **THEN** at least two archived Approved records exist with Section VII values populated where applicable

### Requirement: Cancelled status preserves record without delete
The system SHALL transition cancelled applications to Cancelled read-only archived status without removing the record from history.

#### Scenario: Cancel does not delete
- **WHEN** user cancels an In Progress application at Pending Review stage
- **THEN** the record remains in Application History with status Cancelled
- **AND** the record is not physically deleted from the list

### Requirement: Programme transfer list exposes workflow log action
The system SHALL provide a Workflow Log action on every programme transfer application row regardless of status.

#### Scenario: Workflow log opens separate modal
- **WHEN** user clicks Workflow Log on a programme transfer row
- **THEN** the system opens ApprovalLogModal with approval log entries in table format
- **AND** the detail modal does not contain an inline approval log section

#### Scenario: Workflow log on draft without submissions
- **WHEN** user clicks Workflow Log on a Draft application with no log entries
- **THEN** the system opens the modal and shows a no-data message
