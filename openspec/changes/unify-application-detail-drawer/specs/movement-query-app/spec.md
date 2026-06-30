## MODIFIED Requirements

### Requirement: Query list row actions are read-only
The system SHALL provide only read-appropriate row actions on the movement query list. Details SHALL open the unified drawer combining approval timeline and application detail content.

#### Scenario: Query row actions
- **WHEN** user views Actions on a movement query list row
- **THEN** only Details is available for viewing application content and approval history
- **AND** Approval Log is not a separate action

#### Scenario: Query details in drawer with masking
- **WHEN** user opens Details from movement query
- **THEN** the drawer opens with timeline and read-only detail fields
- **AND** sensitive passport or IC fields are masked in the detail section

#### Scenario: No full-page review from query
- **WHEN** user opens Details from movement query
- **THEN** the query list remains visible behind the drawer
