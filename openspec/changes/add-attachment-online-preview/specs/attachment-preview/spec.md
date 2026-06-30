## ADDED Requirements

### Requirement: Attachment preview trigger and modal
The system SHALL provide reusable attachment preview UI consisting of an eye icon button adjacent to a file name and a modal that displays preview content when the eye icon is activated.

#### Scenario: Eye icon visible when file exists
- **WHEN** a file name is present for an uploaded or saved attachment
- **THEN** the system shows an eye icon button next to the file name
- **AND** the eye icon has an accessible preview label

#### Scenario: Eye icon hidden when no file
- **WHEN** no attachment file name is present
- **THEN** the system does not show the eye icon button

#### Scenario: Open preview modal from eye icon
- **WHEN** user clicks the eye icon for an attachment
- **THEN** the system opens a preview modal titled with the file name
- **AND** displays preview content appropriate to the file type or demo mock content when only metadata exists

#### Scenario: Close preview modal
- **WHEN** user closes the preview modal
- **THEN** the system hides the modal
- **AND** revokes any temporary blob preview URL created for the session

### Requirement: Attachment preview mock and blob strategies
The system SHALL resolve preview content using a local File blob when available from the current upload session, otherwise using demo mock preview content derived from file name and metadata.

#### Scenario: Preview newly selected PDF in form
- **WHEN** user selects a PDF file in a form upload control during the current modal session
- **AND** user clicks the eye icon before save
- **THEN** the preview modal displays the selected PDF using a blob URL

#### Scenario: Preview saved mock attachment without blob
- **WHEN** user opens preview for an attachment stored as mock metadata only
- **THEN** the preview modal displays demo placeholder content for the file type
- **AND** shows a notice that content is simulated in the demo environment

#### Scenario: Unsupported file type preview
- **WHEN** user clicks preview for a file type that cannot be inline previewed in the demo such as DOCX
- **THEN** the preview modal shows file summary and an unsupported or conversion-required message
- **AND** does not fail silently

### Requirement: File name and preview actions are separate
The system SHALL treat file name download and eye icon preview as distinct actions.

#### Scenario: File name triggers download
- **WHEN** user clicks the attachment file name where download is supported
- **THEN** the system triggers mock file download behavior
- **AND** does not open the preview modal unless the eye icon is clicked

#### Scenario: Eye icon triggers preview only
- **WHEN** user clicks the eye icon
- **THEN** the system opens the preview modal
- **AND** does not trigger download
