## ADDED Requirements

### Requirement: Student records application lists expose workflow log action
The system SHALL provide a Workflow Log action on every row of programme transfer, deferment, resumption, and withdrawal application history tables, visible regardless of application status.

#### Scenario: Workflow log button on every row
- **WHEN** user views any application in the four student records movement modules
- **THEN** the Actions column includes a Workflow Log link or button in addition to status-specific actions such as Details or Edit

#### Scenario: Workflow log opens separate modal
- **WHEN** user clicks Workflow Log on a row
- **THEN** the system opens a dedicated modal showing approval log entries in a table with Stage, Actor, Action, Date and Time, and Comment columns
- **AND** the modal displays a subtitle with application ID, student ID, and student name

#### Scenario: Empty workflow log
- **WHEN** user clicks Workflow Log on a record with no approval log entries
- **THEN** the modal opens and displays a no-data message

### Requirement: Application detail modals do not embed approval log
The system SHALL NOT display the approval log timeline inside application detail modals for programme transfer, deferment, resumption, or withdrawal.

#### Scenario: Detail modal without log section
- **WHEN** user opens Details for any application in the four modules
- **THEN** the detail modal shows application sections and pending approval controls only
- **AND** does not show an inline approval log list

#### Scenario: Log accessible from list only
- **WHEN** user needs to view approval history
- **THEN** the user accesses it via the Workflow Log action on the list row, not from the detail modal
