## ADDED Requirements

### Requirement: Application type label uses slash separators

Student list, detail, and approval list/detail SHALL display composite application types as intent flags joined by `/` in order drop, add, retake (e.g. `退课/加课/重修`).

#### Scenario: Combined drop and retake label

- **WHEN** an application includes drop and retake intents
- **THEN** the type column shows `退课/重修` (or locale equivalent) with a slash, not a plus

### Requirement: Demo covers one two and three intent combinations

Demo student applications SHALL include rows for single intents, each two-intent combination, and the three-intent combination.

#### Scenario: Seed includes AddRetake and AddDropRetake

- **WHEN** demo add/drop applications are seeded for the current student
- **THEN** there is at least one AddRetake and one AddDropRetake application among the seed rows

### Requirement: Second-submit gate ignores demo seed apps

Pending demo seed applications SHALL NOT trigger the second-submit block; only self-submitted applications from the initiate-application flow SHALL count.

#### Scenario: Demo pending does not block new submit

- **WHEN** only adr-xmum demo pending applications exist for the student
- **THEN** the student can still open and submit a new application via initiate application
