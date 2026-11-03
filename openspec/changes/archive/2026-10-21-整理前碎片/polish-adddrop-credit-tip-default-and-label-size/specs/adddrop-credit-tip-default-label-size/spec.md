## ADDED Requirements

### Requirement: Credit situation tip shows by default

When the add/drop term credit strip is visible, the situation tip SHALL be shown without requiring an application type or intent flag to be selected.

#### Scenario: Open form before choosing intents

- **WHEN** the student opens the application modal with the credit strip rendered
- **THEN** the programme study-plan situation tip is visible even if all intents are no

### Requirement: Mandatory tip uses cumulative programme remaining near thirty

The situation tip mandatory unfinished credits SHALL be based on programme cumulative remaining (prior earned plus strip mandatory selected), and the demo baseline SHALL present approximately 30 unfinished mandatory credits in the default state.

#### Scenario: Default tip mandatory around thirty

- **WHEN** the tip is shown with the default demo credit baseline and no form lines
- **THEN** the mandatory unfinished credit figure is approximately 30 rather than the mid-60s

### Requirement: Strip label text larger without wrapping

Credit-strip cell label text SHALL use a larger font than 10px while remaining on a single line (nowrap).

#### Scenario: Labels stay single line

- **WHEN** the two-row credit strip is displayed
- **THEN** label text is larger than before and does not wrap within the cell
