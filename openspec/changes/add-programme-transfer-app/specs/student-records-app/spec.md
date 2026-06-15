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

#### Scenario: Undeveloped menu page
- **WHEN** user selects Family Info, Deferment, Resumption, or Withdrawal
- **THEN** the system shows the in-app under-construction page with a back action to Student Profile
