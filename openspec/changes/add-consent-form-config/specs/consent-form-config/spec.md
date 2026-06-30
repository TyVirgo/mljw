## ADDED Requirements

### Requirement: Consent form list page
The system SHALL display a paginated informed consent form configuration table under the Informed Consent Form menu with columns: selection checkbox, serial number, form name, applicable movement type, Student Type, Education Level, remark, and Actions including Edit, View, and Version History.

#### Scenario: Initial list with seed data
- **WHEN** user opens Informed Consent Form for the first time
- **THEN** the system displays pre-seeded template rows covering multiple movement types and Student Types

#### Scenario: Search filters list
- **WHEN** user filters by applicable movement type, form name, Student Type, or Education Level and clicks Search
- **THEN** the list shows only matching rows and resets to page 1

#### Scenario: Reset search
- **WHEN** user clicks Reset
- **THEN** all search fields clear and the full list is restored

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

### Requirement: Consent form version history by academic session
The system SHALL provide a Version History action on each consent form list row that opens a modal listing version snapshots for the same movement type, Student Type, and Education Level grouped by academic session in YYYY/MM format aligned with intake sets and movement application session fields.

#### Scenario: Open version history from list row
- **WHEN** user clicks Version History on a consent form list row
- **THEN** the system opens a history modal scoped to that row's movement type, Student Type, and Education Level
- **AND** the modal lists version entries with academic session, attachment summary, update time, and an Apply toggle

#### Scenario: Version belongs to academic session where maintained
- **WHEN** user adds or edits a consent version for academic session 2025/04 in the history modal
- **THEN** the system stores or updates a version entry under academicSession 2025/04 for that configuration row

#### Scenario: One applied version per academic session
- **WHEN** user turns Apply on for a version under academic session 2025/04
- **THEN** the system sets isApplied true for that version
- **AND** sets isApplied false for all other versions of the same configuration row under academic session 2025/04

#### Scenario: Edit list row updates defaults only
- **WHEN** user clicks Edit on the consent form list and saves changes to attachments or remark
- **THEN** the system updates the configuration row default fields only
- **AND** does not automatically create or replace academic session version snapshots

### Requirement: Resolve applied consent template for movement applications
The system SHALL resolve consent templates using movement type, student category, student programme level mapped to education level, and the application's academic session, returning the applied version snapshot for that session when one exists.

#### Scenario: Match applied version by four dimensions
- **WHEN** lookup is called with movement type deferment, student category Local, programme level Undergraduate, and academic session 2025/09
- **AND** a configuration row exists for deferment, Local, and Undergraduate
- **AND** a version under academic session 2025/09 has isApplied true
- **THEN** the helper returns that applied version's file metadata

#### Scenario: No applied version for session
- **WHEN** lookup finds a configuration row but no applied version for the requested academic session
- **THEN** the helper returns null

#### Scenario: Download shows contact admin when unmatched
- **WHEN** user clicks Download Consent Letter or Download Parent Consent Letter in a movement application form or detail attachment panel
- **AND** lookup returns null
- **THEN** the system shows the message that no matching consent form was found and the user should contact an administrator
- **AND** does not download a file

### Requirement: View consent form template
The system SHALL provide a View action that opens a read-only modal showing all template fields and uploaded file names.

#### Scenario: Open view modal
- **WHEN** user clicks View on a list row
- **THEN** the system opens a read-only modal with form name, movement type, Student Type, Education Level, remark, and file names

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
The system SHALL expose a lookup helper that returns the applied consent form version snapshot matching a movement application type, the selected student's category, programme level mapped to education level, and the application's academic session.

#### Scenario: Match by movement type and student type
- **WHEN** lookup is called with movement type programme-transfer and student category China
- **THEN** the system resolves Student Type Chinese and continues matching education level and academic session

#### Scenario: No template configured
- **WHEN** lookup finds no configuration row or no applied version for the academic session
- **THEN** the helper returns null

## REMOVED Requirements

### Requirement: Study duration eligibility for programme transfer
**Reason**: Product defers study duration configuration and eligibility checks to a later phase.
**Migration**: Remove study duration from consent form admin UI and programme transfer submit validation; template lookup and download unchanged.

### Requirement: Consent form page pagination
The system SHALL paginate the consent form list using the same pagination pattern as other student-records list pages.

#### Scenario: List pagination
- **WHEN** more template rows exist than the page size
- **THEN** the list shows pagination controls

## MODIFIED Requirements

### Requirement: Consent form version history by academic session
The system SHALL provide a Version History action that opens a **read-only** modal listing append-only version log entries for the configuration row, styled like the student profile Status Log table with a light green header. The history modal SHALL NOT provide controls to create, edit, upload, or delete version entries.

#### Scenario: Open read-only version history
- **WHEN** user clicks Version History on a consent form list row
- **THEN** the system opens a modal showing columns Academic Session, Changed By, Change Details, Updated At, and Apply
- **AND** the Change Details column displays a bold remark title followed by one or more diff lines

#### Scenario: Save appends version log on create
- **WHEN** user saves a new consent form template successfully
- **THEN** the system appends a version log entry with remark title indicating new registration
- **AND** sets academic session from the current date using resolveAcademicSessionFromDate
- **AND** sets the new entry as the globally applied version for that configuration row

#### Scenario: Save appends version log on edit
- **WHEN** user saves edits to an existing consent form template successfully
- **THEN** the system appends a version log entry with remark title indicating an update and diff lines for changed fields such as attachment file names
- **AND** sets the new entry as the globally applied version and clears isApplied on all other entries for that row

#### Scenario: One globally applied version per configuration row
- **WHEN** user turns Apply on for a version log entry in the history modal
- **THEN** the system sets isApplied true for that entry
- **AND** sets isApplied false for every other version entry on the same configuration row regardless of academic session

#### Scenario: History modal excludes manual maintenance
- **WHEN** user opens the version history modal
- **THEN** the system does not show a form to add or edit version entries with file uploads

### Requirement: Resolve applied consent template for movement applications
The system SHALL resolve consent templates using movement type, student category, and student programme level mapped to education level, returning the **globally applied** version snapshot on the matching configuration row. In this phase the application's academic session SHALL NOT be used for consent template matching.

#### Scenario: Match globally applied snapshot
- **WHEN** lookup is called with movement type deferment, student category Local, and programme level Undergraduate
- **AND** a configuration row exists for deferment, Local, and Undergraduate
- **AND** exactly one version entry on that row has isApplied true
- **THEN** the helper returns that version entry's student and parent file metadata

#### Scenario: No globally applied version
- **WHEN** lookup finds a configuration row but no version entry with isApplied true
- **THEN** the helper returns null

#### Scenario: Download shows contact admin when unmatched
- **WHEN** user clicks Download Consent Letter or Download Parent Consent Letter in a movement application form or detail attachment panel
- **AND** lookup returns null
- **THEN** the system shows the message that no matching consent form was found and the user should contact an administrator
- **AND** does not download a file

### Requirement: Resolve consent template for movement applications
The system SHALL expose a lookup helper that returns the globally applied consent form version snapshot matching movement application type, student category, and programme level mapped to education level.

#### Scenario: Match by movement type student type and education level
- **WHEN** lookup is called with movement type programme-transfer and student category China
- **THEN** the system resolves Student Type Chinese and education level from programme level
- **AND** returns the globally applied version snapshot when one exists

#### Scenario: No template configured
- **WHEN** lookup finds no configuration row or no globally applied version entry
- **THEN** the helper returns null
