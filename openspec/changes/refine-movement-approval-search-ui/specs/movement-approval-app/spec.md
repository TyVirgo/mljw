## MODIFIED Requirements

### Requirement: Approval list uses three role-aware tabs
The system SHALL provide three tabs classifying applications from the current approver role perspective: Submitted, Pending, and History. The approver role SHALL be determined by the system default (v1: `Pending Review`) and SHALL NOT be exposed as a page-level selector on the approval list.

#### Scenario: Submitted tab
- **WHEN** user selects the Submitted tab
- **THEN** the list shows In Progress applications whose current workflow stage is not the current role's active stage and on which the current role has not yet acted in the current submission cycle

#### Scenario: Pending tab
- **WHEN** user selects the Pending tab
- **THEN** the list shows In Progress applications whose current approval stage matches the current role's active stage

#### Scenario: History tab
- **WHEN** user selects the History tab
- **THEN** the list shows applications the current role has already acted on in the current cycle, applications cancelled by the student, or terminal outcomes where the role participated

#### Scenario: No role selector on list page
- **WHEN** user views the movement approval list page
- **THEN** the system does not display a Current approver role dropdown or equivalent role-switching control

### Requirement: Approval search area uses responsive field layout
The system SHALL display all five search fields—Academic Session, Movement Reason, Status, Student ID, and Student Name—in a single responsive search area without a More/Collapse expand control.

#### Scenario: All search fields visible
- **WHEN** user opens the movement approval list page
- **THEN** all five search fields are visible without requiring the user to expand additional filters

#### Scenario: Adaptive field wrapping
- **WHEN** the viewport width changes
- **THEN** search fields reflow using a responsive grid or flex-wrap layout so labels and inputs remain readable without horizontal overflow

#### Scenario: Search actions alignment
- **WHEN** search fields are displayed
- **THEN** Search and Reset actions appear aligned to the right of the search field area on wide viewports and remain accessible when fields wrap on narrow viewports

## REMOVED Requirements

### Requirement: Mock approver role selector on approval page
**Reason**: Product design no longer includes an in-page role dropdown; approver context is implicit via system default until authentication is implemented.
**Migration**: Remove UI binding; retain `DEFAULT_APPROVER_ROLE` for engine calls.
