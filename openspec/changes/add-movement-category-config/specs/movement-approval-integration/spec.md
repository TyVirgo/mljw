## ADDED Requirements

### Requirement: Auto implement on final approval
The system SHALL read the movement category autoImplement flag when a movement application reaches final Approved status and set the initial implemented value accordingly.

#### Scenario: Manual implement category
- **WHEN** final approval completes and the resolved category configuration has autoImplement false
- **THEN** the application record implemented field is Pending

#### Scenario: Auto implement category
- **WHEN** final approval completes and the resolved category configuration has autoImplement true
- **THEN** the application record implemented field is Implemented
- **AND** no manual Implement action is required in maintenance

#### Scenario: No cancel implementation
- **WHEN** a record is Implemented (manually or automatically)
- **THEN** the system does not provide an action to revert to Pending

### Requirement: Apply student profile updates on implementation
The system SHALL apply mock student profile updates when a movement record is implemented, according to the category modifyStudentStatus and modifyStudentType flags.

#### Scenario: Modify student status on implement
- **WHEN** implementation runs and modifyStudentStatus is true for the resolved category
- **THEN** the system updates the linked student profile status in mock storage

#### Scenario: Modify student type on implement
- **WHEN** implementation runs and modifyStudentType is true for the resolved category
- **THEN** the system updates the linked student profile student category in mock storage

#### Scenario: Skip profile update when flags off
- **WHEN** implementation runs and both modify flags are false
- **THEN** the student profile mock record is unchanged

## MODIFIED Requirements

### Requirement: Auto implement on final approval
The system SHALL resolve category configuration by movement source key only (one row per category code) when reading autoImplement on final approval.

#### Scenario: Auto implement independent of applicant student category
- **WHEN** final approval completes for deferment regardless of whether the applicant is Local, China, or International
- **THEN** the system uses the single DEF001 configuration row for autoImplement

### Requirement: Movement reason display uses category reasons
The system SHALL resolve movement reason labels for deferment, withdrawal, and programme transfer from the category configuration reason list using the stored application reasonId.

#### Scenario: Display reason from reasonId
- **WHEN** an approval, query, or maintenance row shows movement reason for deferment, withdrawal, or programme transfer
- **THEN** the displayed text matches the reasonName of the reasonId on the corresponding category row
