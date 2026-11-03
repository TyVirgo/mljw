## ADDED Requirements

### Requirement: Student form uses three intent flags instead of primary-type select

The student add/drop application modal SHALL NOT require choosing an application-type dropdown. It SHALL present yes/no controls for drop, add, and retake intents. Selecting yes for an intent SHALL reveal the corresponding form section; selecting no SHALL hide that section and clear its course lines when toggled off.

#### Scenario: Combined intents on one application

- **WHEN** the student sets need-drop, need-add, and need-retake all to yes and fills each section
- **THEN** submit creates one application containing Drop, Add, and Retake items under one application number
- **AND** the term credit strip reflects all selected lines together

#### Scenario: At least one intent required

- **WHEN** all three intents are no
- **THEN** submit is rejected with a validation error requiring at least one yes

### Requirement: Detail and approval still show application type from intents

Detail drawers and approval views SHALL continue to show an application-type field. The displayed value SHALL be derived from the application's drop/add/retake intents (or item actions), such as `退课`, `加课+重修`, or `退课+加课+重修`, not removed.

#### Scenario: Approval list type column for combined app

- **WHEN** an application includes drop and add items
- **THEN** the type column shows a label reflecting both drop and add intents

### Requirement: Second submit blocked while any self-submitted application is pending

While the student has any self-submitted add/drop application in Pending or In Review, the student SHALL NOT submit another application. The UI MAY show a tip and allow viewing existing applications; canceling the pending application SHALL allow a new submit. This gate is not limited to the same former primary type.

#### Scenario: Pending combined application blocks new submit

- **WHEN** the student has a self-submitted pending application of any intent combination
- **THEN** a new application submit is blocked with the second-submit tip
- **AND** after canceling that pending application, submit is allowed again
