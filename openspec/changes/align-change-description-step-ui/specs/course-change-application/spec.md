## MODIFIED Requirements

### Requirement: Change description annotations
The system SHALL allow marking each change component as Major Changes or Minor / No Changes on step 1, using a three-column table layout aligned with the UI prototype.

#### Scenario: Three-column table layout
- **WHEN** user views the Change Description step in create or edit mode
- **THEN** each component section (MAIN COMPONENTS and OTHER COMPONENTS) displays a table with columns: Component Name, Major Changes, and Minor / No Changes
- **AND** a table header row labels the Major Changes and Minor / No Changes columns
- **AND** section headings display a blue vertical accent bar on the left

#### Scenario: Major and minor criteria per component
- **WHEN** user views a component row
- **THEN** the Major Changes column displays a pill toggle (N/Y) and bullet-list criteria describing what constitutes a major change for that component
- **AND** the Minor / No Changes column displays a pill toggle (N/Y) and bullet-list criteria describing what constitutes a minor or no change for that component
- **AND** criteria text matches the prototype definitions for each component

#### Scenario: Mutually exclusive toggle selection
- **WHEN** user clicks the toggle in the Major Changes column for a component
- **THEN** that column toggle shows Y (blue/active) and the Minor / No Changes column toggle shows N (grey/inactive)
- **AND** the stored value for that component is `major`

#### Scenario: Select minor changes
- **WHEN** user clicks the toggle in the Minor / No Changes column for a component
- **THEN** that column toggle shows Y (blue/active) and the Major Changes column toggle shows N (grey/inactive)
- **AND** the stored value for that component is `minor`

#### Scenario: Main components
- **WHEN** user views MAIN COMPONENTS on Change Description step
- **THEN** the system lists Course Name, Credit Value, Course Classification, and CLO
- **AND** each row allows selecting Major Changes or Minor / No Changes via the two-column toggle pattern

#### Scenario: Other components
- **WHEN** user views OTHER COMPONENTS on Change Description step
- **THEN** the system lists Synopsis, Pre-requisite / co-requisite, Teaching Methods, Course Content, Assessment Methods, and References
- **AND** each row allows selecting Major Changes or Minor / No Changes via the two-column toggle pattern

#### Scenario: Default annotation
- **WHEN** user first loads Change Description for a new application
- **THEN** all components default to Minor / No Changes unless user changes them

#### Scenario: Readonly detail view
- **WHEN** user views Change Description step in detail (readonly) mode
- **THEN** the same three-column table layout is displayed with toggles shown in disabled state reflecting the saved major/minor selection

## ADDED Requirements

### Requirement: Change description criteria content
The system SHALL display component-specific criteria bullet lists that guide teachers in selecting the correct change level.

#### Scenario: Course Name criteria
- **WHEN** user views the Course Name row
- **THEN** Major Changes criteria include "Change course name to reflect the change in course content."
- **AND** Minor / No Changes criteria include "Improve the grammar of the course name." and "No change."

#### Scenario: Credit Value criteria
- **WHEN** user views the Credit Value row
- **THEN** Major Changes criteria include "Add or reduce the credit value of the course."
- **AND** Minor / No Changes criteria include "Change credit value to meet MQA/EAC standards." and "No change."

#### Scenario: Course Classification criteria
- **WHEN** user views the Course Classification row
- **THEN** Major Changes criteria include "Change course classification, e.g. from major to elective."
- **AND** Minor / No Changes criteria include "Change course classification to meet MQA/EAC standards." and "No change."

#### Scenario: CLO criteria
- **WHEN** user views the CLO row
- **THEN** Major Changes criteria include "Add or remove CLOs."
- **AND** Minor / No Changes criteria include "Improve the grammar of the CLOs.", "Rearrange the sequence of the CLOs.", "Combine the CLOs.", and "No change."

#### Scenario: Synopsis criteria
- **WHEN** user views the Synopsis row
- **THEN** Major Changes criteria include "Revise the synopsis to reflect the change in course content."
- **AND** Minor / No Changes criteria include "Rephrase the synopsis.", "Improve the grammar of the synopsis.", and "No change."

#### Scenario: Pre-requisite criteria
- **WHEN** user views the Pre-requisite / co-requisite row
- **THEN** Major Changes criteria include "Add, remove, or revise the pre-requisite / co-requisite of the course."
- **AND** Minor / No Changes criteria include "No change."

#### Scenario: Teaching Methods criteria
- **WHEN** user views the Teaching Methods row
- **THEN** Major Changes criteria include "Add or reduce the number of lectures (L), tutorials (T), practical (P).", "Revise the teaching strategy, e.g. from classroom delivery (CD) to podcast.", and "No change."
- **AND** Minor / No Changes criteria include "No change."

#### Scenario: Course Content criteria
- **WHEN** user views the Course Content row
- **THEN** Major Changes criteria include "Add or reduce topic in the course content."
- **AND** Minor / No Changes criteria include "Rearrange the topics.", "Update the topics.", "Add or reduce subtopics in the topics.", and "No change."

#### Scenario: Assessment Methods criteria
- **WHEN** user views the Assessment Methods row
- **THEN** Major Changes criteria include "Change the percentage of continuous assessment and final assessment."
- **AND** Minor / No Changes criteria include "Revise the coursework components, e.g. test, assignment, etc.", "Revise the exam hours.", and "No change."

#### Scenario: References criteria
- **WHEN** user views the References row
- **THEN** Major Changes criteria include "Add or reduce the main or additional references."
- **AND** Minor / No Changes criteria include "Update the publication year or edition of the references.", "Revise the referencing system, e.g. from MLA to APA.", and "No change."
