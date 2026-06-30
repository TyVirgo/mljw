## MODIFIED Requirements

### Requirement: Movement attachment readonly display matches prototype
The system SHALL render uploaded attachments in movement application detail views using a bordered panel aligned to the prototype: label row with required marker, Download Consent Letter action on the right, and file link with document icon and eye preview icon below. Detail content SHALL render inside the unified application detail drawer when opened from list actions, not as a standalone centered modal overlay.

#### Scenario: Attachment panel layout in drawer
- **WHEN** user opens Details from any movement list that uses the unified drawer
- **THEN** the Documents section appears in the lower detail portion of the drawer with the same attachment panel layout as before

#### Scenario: Preview uploaded attachment in drawer detail
- **WHEN** user clicks the eye icon next to the uploaded file name in the drawer detail attachment panel
- **THEN** the system opens the attachment preview modal for that application attachment

#### Scenario: Download consent letter from drawer detail
- **WHEN** user clicks Download Consent Letter in the drawer detail attachment panel
- **AND** a matching consent template exists
- **THEN** the system downloads the configured student consent template file (mock)

### Requirement: Movement detail no longer opens as separate log modal from list
The system SHALL NOT open a separate Approval Log or Workflow Log modal from movement application, approval, query, or maintenance list row actions.

#### Scenario: Student movement list
- **WHEN** user views Actions on deferment, programme transfer, resumption, or withdrawal list rows
- **THEN** Workflow Log is not a separate action
- **AND** approval history is visible in the timeline section of the Details drawer

#### Scenario: Admin movement lists
- **WHEN** user views Actions on movement approval, query, or maintenance list rows
- **THEN** Approval Log is not a separate action
- **AND** approval history is visible in the timeline section of the Details drawer
