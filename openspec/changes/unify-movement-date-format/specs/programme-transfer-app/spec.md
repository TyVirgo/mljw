## MODIFIED Requirements

### Requirement: Programme transfer form sections match prototype
The system SHALL render the application form with sections aligned to the StudentSys prototype, including Section VII on create and edit forms as a visible but non-editable administrative block during application.

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
- **THEN** the system shows a required declaration checkbox with full legal text and a required checkbox to agree

#### Scenario: Section IV supporting documents
- **WHEN** user views Section IV
- **THEN** the system shows required attachment upload (mock: file name and size) with supported format hint PDF, JPG, PNG, DOCX, max 5MB, and a Download Consent Letter action

#### Scenario: Section VII visible but disabled on create form
- **WHEN** user opens the create application form via "+ New Application"
- **THEN** the system displays Section VII after Section IV with grey section header "FOR ACADEMIC AFFAIRS OFFICE USE ONLY"
- **AND** fields New Programme, New Intake, and Date are visible with prototype layout
- **AND** all Section VII inputs are disabled with readonly gray styling and cannot be edited by the applicant

#### Scenario: Section VII layout on form
- **WHEN** user views Section VII in the create or edit form
- **THEN** New Programme and New Intake appear on the first row and Date appears on the second row below New Programme

#### Scenario: Section VII not validated on submit from application form
- **WHEN** user submits or saves draft from the programme transfer application form
- **THEN** the system does not require Section VII fields to be filled
- **AND** the application-side submit does not persist user edits to Section VII administrative fields
