## MODIFIED Requirements

### Requirement: Movement attachment readonly display matches prototype
The system SHALL render uploaded attachments in detail modals using a bordered panel aligned to the prototype: label row with required marker, Download Consent Letter action on the right, and file link with document icon and eye preview icon below.

#### Scenario: Attachment panel layout
- **WHEN** user views the Documents section in any movement detail modal
- **THEN** the system shows an Upload Attachment label with required indicator, a Download Consent Letter button on the same row, and the uploaded file name as a blue link with document icon and eye preview icon below

#### Scenario: No attachment placeholder
- **WHEN** an application has no attachment file name
- **THEN** the attachment panel shows a placeholder instead of a file link
- **AND** does not show an eye preview icon

#### Scenario: Preview uploaded attachment in detail
- **WHEN** user clicks the eye icon next to the uploaded file name in a movement detail attachment panel
- **THEN** the system opens the attachment preview modal for that application attachment

#### Scenario: Download consent letter from configured template
- **WHEN** user clicks Download Consent Letter in the detail attachment panel
- **AND** a consent form template exists for the application's movement type and the application's student category
- **THEN** the system downloads the configured student consent template file (mock)

#### Scenario: Download consent letter when not configured
- **WHEN** user clicks Download Consent Letter in the detail attachment panel
- **AND** no matching globally applied consent version exists for the movement type, student category, and programme level
- **THEN** the system shows a message that no matching consent form was found and the user should contact an administrator

### Requirement: Movement application form attachment preview
The system SHALL show an eye preview icon next to the uploaded attachment file name in movement application create and edit forms after a file is selected or when editing an existing attachment file name.

#### Scenario: Preview after file selection in deferment form
- **WHEN** user selects an attachment file in the deferment application form Documents section
- **THEN** the system displays the file name with an eye icon for online preview

#### Scenario: Preview in programme transfer resumption withdrawal forms
- **WHEN** user selects or views an attachment file name in programme transfer, resumption, or withdrawal application forms
- **THEN** the system displays the eye icon next to the file name using the same preview behavior as other movement forms

#### Scenario: Preview applies in approval maintenance and query detail views
- **WHEN** user opens a movement application in approval, maintenance, or query review detail
- **THEN** the attachment panel includes the eye preview icon consistent with the readonly attachment component
