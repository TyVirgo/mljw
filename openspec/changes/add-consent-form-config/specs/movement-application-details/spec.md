## MODIFIED Requirements

### Requirement: Movement attachment readonly display matches prototype
The system SHALL render uploaded attachments in detail modals using a bordered panel aligned to the prototype: label row with required marker, Download Consent Letter action on the right, and file link with document icon below.

#### Scenario: Attachment panel layout
- **WHEN** user views the Documents section in any movement detail modal
- **THEN** the system shows an Upload Attachment label with required indicator, a Download Consent Letter button on the same row, and the uploaded file name as a blue link with document icon below

#### Scenario: No attachment placeholder
- **WHEN** an application has no attachment file name
- **THEN** the attachment panel shows a placeholder instead of a file link

#### Scenario: Download consent letter from configured template
- **WHEN** user clicks Download Consent Letter in the detail attachment panel
- **AND** a consent form template exists for the application's movement type and the application's student category
- **THEN** the system downloads the configured student consent template file (mock)

#### Scenario: Download consent letter when not configured
- **WHEN** user clicks Download Consent Letter in the detail attachment panel
- **AND** no matching applied consent version exists for the movement type, student category, programme level, and academic session
- **THEN** the system shows a message that no matching consent form was found and the user should contact an administrator

## ADDED Requirements

### Requirement: Movement application form downloads matched consent templates
The system SHALL resolve and download consent form templates from the consent form configuration store when users click Download Consent Letter in movement application create/edit forms.

#### Scenario: Download student template in programme transfer form
- **WHEN** user clicks Download Consent Letter in the programme transfer application form Documents section
- **AND** a student is selected with a resolvable programme level and application academic session
- **AND** an applied consent version exists for programme-transfer, the student's category, education level, and academic session
- **THEN** the system downloads that version's student consent template file (mock)

#### Scenario: Download student template in deferment resumption withdrawal forms
- **WHEN** user clicks Download Consent Letter in deferment, resumption, or withdrawal application form Documents section
- **AND** a student is selected with a resolvable programme level and application academic session
- **AND** a matching applied version exists
- **THEN** the system downloads the student consent template file (mock)

#### Scenario: Download not configured in application form
- **WHEN** user clicks Download Consent Letter in any movement application form
- **AND** no matching applied consent version exists for the current tab, selected student, and application academic session
- **THEN** the system shows a message that no matching consent form was found and the user should contact an administrator

### Requirement: Parent consent template download in deferment and withdrawal forms
The system SHALL provide a Download Parent Consent Letter action in deferment and withdrawal application forms when the matched template includes a parent consent file.

#### Scenario: Show parent download when configured
- **WHEN** user is in deferment or withdrawal create/edit form Section III (parent/guardian consent)
- **AND** the matched template has a parent consent file
- **THEN** the system shows a Download Parent Consent Letter action

#### Scenario: Hide parent download when not configured
- **WHEN** the matched template has no parent consent file
- **THEN** the system does not show Download Parent Consent Letter in Section III

#### Scenario: Download parent template
- **WHEN** user clicks Download Parent Consent Letter
- **AND** the matched template has a parent consent file
- **THEN** the system downloads the parent consent template file (mock)

## MODIFIED Requirements

### Requirement: Movement application form downloads matched consent templates
The system SHALL resolve consent templates using movement type, student category, and programme level mapped to education level only, returning the globally applied version on the matching configuration row. Application academic session SHALL NOT be used for consent matching in this phase.

#### Scenario: Download student template in programme transfer form
- **WHEN** user clicks Download Consent Letter in the programme transfer application form Documents section
- **AND** a student is selected with a resolvable programme level
- **AND** a globally applied consent version exists for programme-transfer, the student's category, and education level
- **THEN** the system downloads that version's student consent template file (mock)

#### Scenario: Download student template in deferment resumption withdrawal forms
- **WHEN** user clicks Download Consent Letter in deferment, resumption, or withdrawal application form Documents section
- **AND** a student is selected with a resolvable programme level
- **AND** a matching globally applied version exists
- **THEN** the system downloads the student consent template file (mock)

#### Scenario: Download not configured in application form
- **WHEN** user clicks Download Consent Letter in any movement application form
- **AND** no matching globally applied consent version exists for the current tab and selected student
- **THEN** the system shows a message that no matching consent form was found and the user should contact an administrator

### Requirement: Download consent letter when not configured
The system SHALL show the contact administrator message when no globally applied consent version matches movement type, student category, and programme level.

#### Scenario: Download consent letter when not configured
- **WHEN** user clicks Download Consent Letter in the detail attachment panel
- **AND** no matching globally applied consent version exists for the movement type, student category, and programme level
- **THEN** the system shows a message that no matching consent form was found and the user should contact an administrator
