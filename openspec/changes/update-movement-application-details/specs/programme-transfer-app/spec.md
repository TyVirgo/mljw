## MODIFIED Requirements

### Requirement: View programme transfer application details
The system SHALL display programme transfer application details as read-only student application content (Sections I–IV) without Section VII or embedded approval controls.

#### Scenario: Detail content scope
- **WHEN** user opens programme transfer Details
- **THEN** Sections I (Student Details), II (Transfer Information), III (Declaration), and IV (Supporting Documents) are shown read-only

#### Scenario: No admin approval in application module
- **WHEN** user opens Details for In Progress programme transfer with pending approval
- **THEN** the system does not offer Approve, Update Required, or Reject actions in the detail modal

#### Scenario: Supporting documents UI
- **WHEN** user views Section IV in detail
- **THEN** attachment is shown via the shared readonly attachment panel with Download Consent Letter action

## REMOVED Requirements

### Requirement: Approve programme transfer from detail modal
**Reason**: Approval moves to dedicated Status Change Approval module; application tab details are student-facing read-only.
**Migration**: Use Workflow Log for history; future approval module will provide approve/reject actions.

#### Scenario: Admin approval in detail (removed)
- **WHEN** user opens programme transfer Details as admin
- **THEN** inline approval form is not displayed

### Requirement: Edit Section VII from detail modal during approval
**Reason**: Section VII is administrative data entry, not part of student application detail view.
**Migration**: Section VII remains on create/edit form for mock demo; full admin editing deferred to approval module.

#### Scenario: Section VII editable in detail (removed)
- **WHEN** user opens Details during Academic Affairs approval stage
- **THEN** Section VII fields are not shown or editable in the detail modal
