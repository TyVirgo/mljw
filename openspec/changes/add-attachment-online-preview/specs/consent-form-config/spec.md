## MODIFIED Requirements

### Requirement: Create and edit consent form templates
The system SHALL provide a Create/Edit modal to maintain consent form templates with required form name, applicable movement type, Student Type, and student consent file upload.

#### Scenario: Open create form
- **WHEN** user clicks Create on the list page
- **THEN** the system opens the Create/Edit modal with empty fields and Cancel + Save footer actions

#### Scenario: Optional parent consent upload
- **WHEN** user uploads a parent consent file in Create/Edit
- **THEN** the system stores the parent file metadata on the template record

#### Scenario: Required student consent upload
- **WHEN** user submits Create/Edit without a student consent file
- **THEN** the system prevents save and shows validation feedback

#### Scenario: Duplicate movement type and student type
- **WHEN** user creates or edits a template that would duplicate the same applicable movement type and Student Type pair
- **THEN** the system prevents save and shows a validation message

#### Scenario: Education level required on create or edit
- **WHEN** user opens Create or Edit for a consent form template
- **THEN** the form includes a required Education Level dropdown with options Foundation, Undergraduate, and Postgraduate
- **AND** the UI displays Chinese labels 预科, 本科, and 研究生 when the locale is Chinese

#### Scenario: Unique movement type student type and education level
- **WHEN** user saves a template that duplicates the same applicable movement type, Student Type, and Education Level combination
- **THEN** the system prevents save and shows a validation message

#### Scenario: Preview uploaded consent files in form
- **WHEN** user uploads a student or parent consent file in Create/Edit
- **THEN** the system shows the file name with an eye icon for online preview next to each uploaded file name

### Requirement: View consent form template
The system SHALL provide a View action that opens a read-only modal showing all template fields and uploaded file names.

#### Scenario: Open view modal
- **WHEN** user clicks View on a list row
- **THEN** the system opens a read-only modal with form name, movement type, Student Type, Education Level, remark, and file names

#### Scenario: Mock download from view
- **WHEN** user clicks a file name link in the View modal
- **THEN** the system triggers a mock file download for that template file

#### Scenario: Preview consent files in view modal
- **WHEN** user clicks the eye icon next to a student or parent consent file name in the View modal
- **THEN** the system opens the attachment preview modal for that template file
