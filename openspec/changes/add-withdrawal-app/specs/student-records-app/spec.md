## MODIFIED Requirements

### Requirement: Student Records sidebar flat menu
The system SHALL provide a flat sidebar menu matching the prototype with six top-level items.

#### Scenario: Menu items listed
- **WHEN** user opens the Student Records Application
- **THEN** the sidebar lists Student Profile, Family Info, Programme Transfer, Deferment, Resumption, and Withdrawal in that order

#### Scenario: Student Profile navigation
- **WHEN** user selects Student Profile in the sidebar
- **THEN** the system displays the Student Profile list page

#### Scenario: Programme Transfer navigation
- **WHEN** user selects Programme Transfer in the sidebar
- **THEN** the system displays the Programme Transfer Application list page

#### Scenario: Deferment navigation
- **WHEN** user selects Deferment in the sidebar
- **THEN** the system displays the Deferment History list page

#### Scenario: Resumption navigation
- **WHEN** user selects Resumption in the sidebar
- **THEN** the system displays the Resumption History list page

#### Scenario: Withdrawal navigation
- **WHEN** user selects Withdrawal in the sidebar
- **THEN** the system displays the Withdrawal History list page

#### Scenario: Undeveloped menu page
- **WHEN** user selects Family Info
- **THEN** the system shows the in-app under-construction page with a back action to Student Profile

### Requirement: Withdrawal list aligns with student records workflow log pattern
The system SHALL apply the same Workflow Log externalization pattern used in programme transfer, deferment, and resumption to the Withdrawal module.

#### Scenario: Withdrawal participates in four-module log consistency
- **WHEN** user compares Withdrawal with Programme Transfer, Deferment, or Resumption list pages
- **THEN** each module exposes Workflow Log on every row via the shared ApprovalLogModal component
- **AND** none of the four modules embed approval log in the detail modal
