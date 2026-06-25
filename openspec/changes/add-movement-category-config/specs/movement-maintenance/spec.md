## MODIFIED Requirements

### Requirement: Implement approved movement records
The system SHALL allow batch marking of selected pending-implement rows as implemented. Rows that were auto-implemented on approval SHALL remain visible in the maintenance list with implemented status Implemented and SHALL NOT be eligible for the Implement action.

#### Scenario: Implement pending rows
- **WHEN** user selects one or more rows with implemented status Pending and clicks Implement
- **THEN** the system shows a confirmation dialog
- **AND** on confirm sets implemented to Implemented on the selected store records

#### Scenario: Implement disabled for already implemented
- **WHEN** all selected rows are already Implemented
- **THEN** the Implement action is disabled or shows no eligible rows message

#### Scenario: Auto-implemented rows visible in maintenance list
- **WHEN** a movement application was approved with auto implement enabled on its category configuration
- **THEN** the record appears in the maintenance list with implemented status Implemented
- **AND** the Implement toolbar action does not apply to that row

## MODIFIED Requirements

### Requirement: Apply student profile updates on implementation
The system SHALL apply mock student profile updates when a movement record is implemented, according to the category modifyStudentStatus and modifyStudentType flags resolved by source key.

#### Scenario: Modify track category on implement
- **WHEN** implementation runs and modifyStudentType is true for the resolved category
- **THEN** the system updates the linked student profile track category using the configuration row Category value (not a removed Student Type field)

### Requirement: Movement reason column uses category reasons
The system SHALL display movement reason in the maintenance list using the category configuration reason label resolved from the application reasonId for deferment, withdrawal, and programme transfer records.

#### Scenario: Maintenance reason matches application selection
- **WHEN** a maintenance row represents a deferment, withdrawal, or programme transfer with a valid reasonId
- **THEN** the movement reason column shows the matching reasonName from the category configuration
