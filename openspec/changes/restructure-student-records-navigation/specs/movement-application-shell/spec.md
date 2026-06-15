## ADDED Requirements

### Requirement: Movement application shell hosts four embedded views
The system SHALL embed the existing ProgrammeTransferView, DefermentView, ResumptionView, and WithdrawalView inside a single parent shell component without duplicating their business logic.

#### Scenario: Single shell component
- **WHEN** the application renders Status Change Application
- **THEN** a dedicated shell component manages tab state and renders exactly one embedded movement view at a time

#### Scenario: No duplicate data modules
- **WHEN** the shell embeds movement views
- **THEN** each tab reuses the existing data layer files (`programmeTransfers.js`, `deferments.js`, `resumptions.js`, `withdrawals.js`) without forking new mock stores

### Requirement: Movement application tab keys
The system SHALL use stable internal tab keys for the four movement types.

#### Scenario: Tab key mapping
- **WHEN** the shell initializes tabs
- **THEN** tab keys are `programme-transfer`, `deferment`, `resumption`, and `withdrawal` mapped to their respective embedded views

### Requirement: Movement application layout fits admin shell
The system SHALL layout the movement application shell within the Student Records main content area without breaking page scrolling or pagination.

#### Scenario: Full height content
- **WHEN** user views any tab inside Status Change Application
- **THEN** the embedded movement list fills the available main content height similarly to when it was a standalone page

#### Scenario: Optional embedded layout mode
- **WHEN** a movement view is rendered with embedded layout mode enabled
- **THEN** outer padding and height calculations are adjusted to avoid double margins or nested scroll conflicts
