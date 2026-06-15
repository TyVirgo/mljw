## ADDED Requirements

### Requirement: Movement approval page is registered and accessible
The system SHALL register the Status Change Approval page (`sr-movement-approval`) as a developed student-records page and render it from the sidebar under Student Status Change.

#### Scenario: Navigate to approval page
- **WHEN** user opens Student Status Change Approval from the sidebar
- **THEN** the system displays the movement approval workspace instead of the under-construction placeholder

### Requirement: Approval list uses three role-aware tabs
The system SHALL provide three tabs classifying applications from the current mock approver role perspective: Submitted, Pending, and History.

#### Scenario: Submitted tab
- **WHEN** user selects the Submitted tab
- **THEN** the list shows In Progress applications whose current workflow stage is not the current role's active stage and on which the current role has not yet acted in the current submission cycle

#### Scenario: Pending tab
- **WHEN** user selects the Pending tab
- **THEN** the list shows In Progress applications whose current approval stage matches the current role's active stage

#### Scenario: History tab
- **WHEN** user selects the History tab
- **THEN** the list shows applications the current role has already acted on in the current cycle, applications cancelled by the student, or terminal outcomes where the role participated

### Requirement: Unified approval table shows common columns only
The system SHALL display a single paginated table for all four movement types with common columns: Status, Approval Stage, Implemented, Student ID, Student Name, Application Session, Effective Session, Movement Category, and Movement Reason.

#### Scenario: Movement category column
- **WHEN** a row represents programme transfer, deferment, resumption, or withdrawal
- **THEN** the Movement Category column displays the localized movement type label

#### Scenario: Type-specific fields not in table
- **WHEN** user views the approval list
- **THEN** type-specific application fields are not shown as table columns and are available only through View

### Requirement: View behavior depends on tab context
The system SHALL open View with read-only application content for Submitted and History tabs, and with read-only application content plus approval controls for the Pending tab.

#### Scenario: View from Submitted
- **WHEN** user clicks View on a Submitted row
- **THEN** the system opens read-only application details without approval actions

#### Scenario: View from Pending
- **WHEN** user clicks View on a Pending row
- **THEN** the system opens the approval detail with read-only application sections and approval action, comment, and submit controls

#### Scenario: Programme transfer Section VII on approval only
- **WHEN** user approves a programme transfer at the final approval stage from Pending
- **THEN** Section VII administrative fields are available in the approval detail but not in application-side read-only details

### Requirement: Batch approve from Pending tab only
The system SHALL allow batch Approve only on the Pending tab for rows sharing the same movement type and approval stage.

#### Scenario: Approve disabled on Submitted
- **WHEN** user is on the Submitted or History tab
- **THEN** batch Approve is hidden or disabled

#### Scenario: Batch approve validation
- **WHEN** user selects rows with different movement types or approval stages and clicks Approve
- **THEN** the system prevents batch approval and shows a validation message

### Requirement: Approval log accessible from list
The system SHALL provide Approval log on every row across all tabs using the shared approval log modal.

#### Scenario: Open approval log
- **WHEN** user clicks Approval log on any row
- **THEN** the system opens ApprovalLogModal with stage, actor, action, date, and comment history

### Requirement: Recall from History when allowed
The system SHALL support Recall on History items when the current role's last approval advanced the workflow but the next stage has not yet recorded any action.

#### Scenario: Successful recall
- **WHEN** user recalls an eligible History item
- **THEN** the application returns to Pending for the current role and the approval stage rolls back to that role's stage

#### Scenario: Recall blocked on cancelled application
- **WHEN** application status is Cancelled
- **THEN** Recall is not offered

### Requirement: Movement approval workflows follow type and student category
The system SHALL advance approval stages according to workflow definitions for deferment, resumption, withdrawal, and programme transfer, including International/China-only stages such as ISAO where defined in design.

#### Scenario: International deferment includes ISAO
- **WHEN** a deferment application has student category China or International
- **THEN** the workflow includes International Student Affairs Office after AA HOD before downstream office stages

#### Scenario: Local resumption skips ISAO
- **WHEN** a resumption application has student category Local
- **THEN** the workflow does not require International Student Affairs Office

## MODIFIED Requirements

### Requirement: Student records separates application and approval modules
The system SHALL keep student application CRUD in Status Change Application and approval decisions in Status Change Approval without embedding approval controls in application detail modals.

#### Scenario: Application detail remains read-only
- **WHEN** user opens Details from the application module
- **THEN** no inline approval form is shown

#### Scenario: Approval updates shared mock data
- **WHEN** an approver submits a decision from the approval module
- **THEN** the corresponding movement record in the shared data store updates status, approval stage, and approval log visible in both modules' lists and logs
