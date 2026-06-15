## MODIFIED Requirements

### Requirement: Approval search area uses responsive field layout
The system SHALL display all five search fields—Academic Session, Movement Reason, Status, Student ID, and Student Name—in a single responsive search area without a More/Collapse expand control. Each search field SHALL render its label and input control on the same horizontal line without wrapping the label above the control.

#### Scenario: All search fields visible
- **WHEN** user opens the movement approval list page
- **THEN** all five search fields are visible without requiring the user to expand additional filters

#### Scenario: Inline label and control per field
- **WHEN** user views any search field on the movement approval page
- **THEN** the field label and its input or select control appear on one row with the label not stacked above the control

#### Scenario: Adaptive field wrapping
- **WHEN** the viewport width changes
- **THEN** complete search field groups may wrap to additional rows, but each group keeps its label and control on the same line

#### Scenario: Search actions alignment
- **WHEN** search fields are displayed
- **THEN** Search and Reset actions appear aligned to the right of the search field area on wide viewports and remain accessible when field groups wrap on narrow viewports

#### Scenario: Consistent list-page search styling
- **WHEN** the movement approval search bar is rendered
- **THEN** it uses the shared list-page search layout conventions (inline label+control, shared spacing and control widths) consistent with other approval/list pages in the application
