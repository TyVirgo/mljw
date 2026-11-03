## ADDED Requirements

### Requirement: Picker term-cap gate uses pending-ledger net credits

When the student has self-submitted pending add/drop applications, the course picker term credit gate SHALL evaluate selectable/over-cap using net term credits equal to confirmed enrolled credits adjusted by those pending drop and add lines, matching the credit-strip pending baseline. Current-form drop/add lines remain separate gate inputs and MUST NOT double-apply pending lines already reflected in the net current credits.

#### Scenario: Second application after pending drops

- **WHEN** the student has a self-submitted pending application that dropped courses so the credit strip term total is T
- **AND** the student opens the course picker for a Retake (or Add) on a subsequent application
- **THEN** selecting a course with C credits evaluates net as approximately T + C (plus any current-form lines), not confirmed enrolled + C ignoring the pending drops
- **AND** over-cap messaging SHALL be consistent with that net relative to the term credit max

### Requirement: Submit term-cap uses the same pending-adjusted credits

Submit-time term credit over-cap checks and form validation that accept `currentCredits` SHALL use the same pending-adjusted net credits as the picker gate.

#### Scenario: Submit after pending ledger

- **WHEN** the student submits a second application while earlier self-submitted applications remain pending
- **THEN** the term over-cap check uses pending-adjusted current credits plus the new form lines
