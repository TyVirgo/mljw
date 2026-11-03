## ADDED Requirements

### Requirement: Whitelist allows three-flag combined application types

When a whitelist entry has active `supplement` and the corresponding atomic permissions, `allowedActions` SHALL include combined types used by a single merged application: `AddRetake` when `canAdd` and `canRetake` are active; `AddDropRetake` when `canAdd`, `canDrop`, and `canRetake` are all active. Submitting such a combined application SHALL NOT fail solely because the type string is a combination.

#### Scenario: Add plus retake with canAdd and canRetake
- **WHEN** the student is outside the window with active whitelist `canAdd` and `canRetake`
- **AND** the form action is `AddRetake`
- **THEN** `canStudentSubmitAddDrop` allows the submit

#### Scenario: Add drop retake with all three permissions
- **WHEN** the whitelist has active `canAdd`, `canDrop`, and `canRetake`
- **AND** the form action is `AddDropRetake`
- **THEN** the action is included in `allowedActions`
