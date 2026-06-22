## ADDED Requirements

### Requirement: Consent form list page
The system SHALL display a paginated informed consent form configuration table under the Informed Consent Form menu with columns: selection checkbox, serial number, form name, applicable movement type, Student Type, study duration rule, remark, and Actions.

#### Scenario: Initial list with seed data
- **WHEN** user opens Informed Consent Form for the first time
- **THEN** the system displays pre-seeded template rows covering multiple movement types and Student Types

#### Scenario: Search filters list
- **WHEN** user filters by applicable movement type, form name, or Student Type and clicks Search
- **THEN** the list shows only matching rows and resets to page 1

#### Scenario: Reset search
- **WHEN** user clicks Reset
- **THEN** all search fields clear and the full list is restored

### Requirement: Create and edit consent form templates
The system SHALL provide a Create/Edit modal to maintain consent form templates with required form name, applicable movement type, Student Type, and student consent file upload.

#### Scenario: Open create form
- **WHEN** user clicks Create on the list page
- **THEN** the system opens the Create/Edit modal with empty fields and Cancel + Save footer actions

#### Scenario: Study duration required for programme transfer
- **WHEN** user selects Programme Transfer as the applicable movement type in the Create/Edit modal
- **THEN** the system shows a required study duration rule field

#### Scenario: Study duration default for other movement types
- **WHEN** user selects Deferment, Resumption, or Withdrawal as the applicable movement type
- **THEN** the study duration rule defaults to none (no restriction) and the list displays the unrestricted label

#### Scenario: Optional parent consent upload
- **WHEN** user uploads a parent consent file in Create/Edit
- **THEN** the system stores the parent file metadata on the template record

#### Scenario: Required student consent upload
- **WHEN** user submits Create/Edit without a student consent file
- **THEN** the system prevents save and shows validation feedback

#### Scenario: Duplicate movement type and student type
- **WHEN** user creates or edits a template that would duplicate the same applicable movement type and Student Type pair
- **THEN** the system prevents save and shows a validation message

### Requirement: View consent form template
The system SHALL provide a View action that opens a read-only modal showing all template fields and uploaded file names.

#### Scenario: Open view modal
- **WHEN** user clicks View on a list row
- **THEN** the system opens a read-only modal with form name, movement type, Student Type, study duration rule, remark, and file names

#### Scenario: Mock download from view
- **WHEN** user clicks a file name link in the View modal
- **THEN** the system triggers a mock file download for that template file

### Requirement: Delete consent form templates
The system SHALL support deleting one or more selected template rows with confirmation.

#### Scenario: Bulk delete
- **WHEN** user selects rows and clicks Delete
- **THEN** the system shows a confirmation dialog
- **AND** confirmed deletion removes the selected rows from mock storage

### Requirement: Resolve consent template for movement applications
The system SHALL expose a lookup helper that returns the consent form template matching a movement application type and the selected student's category.

#### Scenario: Match by movement type and student type
- **WHEN** lookup is called with movement type programme-transfer and student category China
- **THEN** the system returns the template whose Student Type is Chinese and movement type is programme-transfer

#### Scenario: No template configured
- **WHEN** lookup finds no matching template
- **THEN** the helper returns null

### Requirement: Study duration eligibility for programme transfer
The system SHALL enforce a mock study duration eligibility check when submitting a programme transfer application if the matched template specifies a non-none study duration rule.

#### Scenario: Block submit before one academic year
- **WHEN** user submits a programme transfer application
- **AND** the matched template study duration rule is after one academic year
- **AND** the selected student's enrollment date is less than one year ago (mock calculation)
- **THEN** the system prevents submit and shows an eligibility message

#### Scenario: Allow submit when rule satisfied
- **WHEN** user submits a programme transfer application
- **AND** the matched template study duration rule is satisfied by mock calculation
- **THEN** the system proceeds with normal submit validation

### Requirement: Consent form page pagination
The system SHALL paginate the consent form list using the same pagination pattern as other student-records list pages.

#### Scenario: List pagination
- **WHEN** more template rows exist than the page size
- **THEN** the list shows pagination controls
