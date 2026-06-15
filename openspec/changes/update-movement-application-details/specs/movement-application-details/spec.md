## ADDED Requirements

### Requirement: Movement application detail is read-only application content
The system SHALL display movement application details as read-only mirrors of the student-facing form sections only, without approval workflow controls or administrative-only sections.

#### Scenario: Detail excludes approval actions
- **WHEN** user opens Details from any movement type list in Status Change Application tab
- **THEN** the detail modal does not show approval action, comment, common comments, or submit approval controls

#### Scenario: Detail excludes approval stage in header
- **WHEN** user opens Details for an In Progress application
- **THEN** the detail header shows Application ID and Status badge only, not approval stage text

#### Scenario: Programme transfer detail excludes Section VII
- **WHEN** user opens Details for a programme transfer application
- **THEN** the modal does not display Section VII (For Academic Affairs Office Only) fields or editable admin programme/intake/date controls

#### Scenario: Detail sections match create form
- **WHEN** user opens Details for Deferment, Resumption, or Withdrawal
- **THEN** the modal displays the same student application sections as the create/edit form up to and including Documents, excluding any approval-only content

### Requirement: Movement attachment readonly display matches prototype
The system SHALL render uploaded attachments in detail modals using a bordered panel aligned to the prototype: label row with required marker, Download Consent Letter action on the right, and file link with document icon below.

#### Scenario: Attachment panel layout
- **WHEN** user views the Documents section in any movement detail modal
- **THEN** the system shows an Upload Attachment label with required indicator, a Download Consent Letter button on the same row, and the uploaded file name as a blue link with document icon below

#### Scenario: No attachment placeholder
- **WHEN** an application has no attachment file name
- **THEN** the attachment panel shows a placeholder instead of a file link

#### Scenario: Download consent letter in detail
- **WHEN** user clicks Download Consent Letter in the detail attachment panel
- **THEN** the system triggers the same mock download hint behavior as the application form

### Requirement: Workflow log remains external to detail
The system SHALL keep approval history accessible only via the list Workflow Log action, not embedded in the detail modal.

#### Scenario: Workflow log from list
- **WHEN** user clicks Workflow Log on a list row
- **THEN** ApprovalLogModal opens with stage/actor/action history regardless of detail modal content changes

## MODIFIED Requirements

### Requirement: Programme transfer detail modal (from programme-transfer-app)
The system SHALL provide a read-only detail view for programme transfer applications showing student application sections I–IV only.

#### Scenario: Open detail from list
- **WHEN** user clicks Details on a programme transfer row
- **THEN** the system opens a detail modal with student sections and status metadata, without Section VII or inline approval

#### Scenario: Edit from detail when allowed
- **WHEN** user opens Details for Draft or Update Required programme transfer
- **THEN** the footer may offer Edit to open the form modal; approval is not available in detail

### Requirement: Movement list actions no longer depend on detail approval
The system SHALL not route approval state updates through detail modal approve events in the Status Change Application module.

#### Scenario: Detail close without approval side effects
- **WHEN** user views Details for an In Progress application and closes the modal
- **THEN** application status and approval stage remain unchanged unless user performs list-level or form-level actions
