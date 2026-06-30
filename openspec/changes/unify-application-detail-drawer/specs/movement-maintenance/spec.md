## MODIFIED Requirements

### Requirement: Maintenance list row actions
The maintenance list SHALL provide Details as a unified drawer action combining approval timeline and application detail content. Edit and other maintenance-specific toolbar actions SHALL remain outside the drawer as before.

#### Scenario: Maintenance row actions
- **WHEN** user views Actions on a movement maintenance list row
- **THEN** Details opens the unified drawer
- **AND** Approval Log is not a separate row action
- **AND** Edit remains available on the list row when applicable

#### Scenario: Maintenance details read-only in drawer
- **WHEN** user opens Details from maintenance list
- **THEN** the drawer shows timeline and read-only application content without approval actions in the footer
