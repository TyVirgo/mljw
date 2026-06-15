## MODIFIED Requirements

### Requirement: Student Records sidebar flat menu
The system SHALL provide a flat sidebar menu matching the prototype with six top-level items.

#### Scenario: Menu items listed
- **WHEN** user opens the Student Records Application
- **THEN** the sidebar lists Student Profile, Family Info, Programme Transfer, Deferment, Resumption, and Withdrawal in that order

#### Scenario: Deferment navigation
- **WHEN** user selects Deferment in the sidebar
- **THEN** the system displays the Deferment History list page

#### Scenario: Undeveloped menu page
- **WHEN** user selects Family Info
- **THEN** the system shows the in-app under-construction page with a back action to Student Profile

### Requirement: Deferment list aligns with student records workflow log pattern
The system SHALL apply the same Workflow Log externalization pattern used in programme transfer to the Deferment module.

#### Scenario: Deferment participates in four-module log consistency
- **WHEN** user compares Deferment with Programme Transfer, Resumption, or Withdrawal list pages
- **THEN** each module exposes Workflow Log on every row via the shared ApprovalLogModal component
- **AND** none of the four modules embed approval log in the detail modal
