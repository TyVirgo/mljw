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
