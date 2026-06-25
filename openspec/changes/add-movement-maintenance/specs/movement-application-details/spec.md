## ADDED Requirements

### Requirement: Movement records carry maintenance fields
The system SHALL store maintenance-specific fields on movement application records in the shared movement store so maintenance, approval, and application views read the same underlying record.

#### Scenario: Maintenance fields on approved records
- **WHEN** a movement application record is approved and eligible for maintenance
- **THEN** the record may include movementNumber, cgpa, expectedGraduationTime, maintenanceRemark, movementDate, and implemented status

#### Scenario: Maintenance edit updates shared store
- **WHEN** user saves maintenance edits for a row
- **THEN** the updated fields are persisted on the same store record used by the application and approval modules

#### Scenario: Details view reads updated maintenance context
- **WHEN** user opens Details from the maintenance list after editing maintenance fields
- **THEN** the read-only application review view reflects the underlying store record without approval actions

## MODIFIED Requirements

### Requirement: Movement records carry maintenance fields
The system SHALL store maintenance-specific fields on movement application records in the shared movement store so maintenance, approval, and application views read the same underlying record. The implemented field SHALL support values Pending, Scheduled, and Implemented.

#### Scenario: Scheduled implement state on record
- **WHEN** a user or auto-implement flow queues deferred implementation
- **THEN** the store record sets implemented to Scheduled without mutating student profile fields
- **AND** the record remains eligible for the mock implementation processor until current session reaches effective session
