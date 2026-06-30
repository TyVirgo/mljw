## MODIFIED Requirements

### Requirement: Movement application modules expose unified Details with workflow history
Each movement application module (programme transfer, deferment, resumption, withdrawal) SHALL expose a single Details list action that opens a right-side drawer containing approval/workflow timeline and application detail content.

#### Scenario: Student list Actions
- **WHEN** user views Actions on any movement application list row in student or teacher applicant mode
- **THEN** Details opens the unified drawer
- **AND** Workflow Log is not a separate action

#### Scenario: Other student actions unchanged
- **WHEN** a row supports Edit, Delete, or Cancel Application
- **THEN** those actions remain in the list Actions column
