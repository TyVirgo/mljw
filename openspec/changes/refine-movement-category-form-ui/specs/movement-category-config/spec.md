## MODIFIED Requirements

### Requirement: Movement category list page (fixed four types, read-only structure)
The system SHALL display exactly four pre-seeded movement category rows (PT001, DEF001, WDR001, RES001) with list actions limited to Edit and Set Reason in this phase. The list SHALL NOT show Create or Delete toolbar buttons or a selection checkbox column. The list table SHALL include Student Status and Track Category (学籍类型) columns that display stored values regardless of whether the corresponding modify switches are enabled on the row.

#### Scenario: List shows track category column label as student record type
- **WHEN** user opens Change Category
- **THEN** the column previously labeled Category displays the localized label Track Category (Chinese: 学籍类型)
- **AND** column values continue to show the configured track category for each row

#### Scenario: List values independent of edit form visibility
- **WHEN** a category row has modifyStudentStatus or modifyStudentType set to false
- **THEN** the list still displays that row's stored studentStatus and category values
- **AND** editing the row hides the corresponding dropdown without clearing stored values

### Requirement: Movement category form fields
The system SHALL require category code, category name, and allow-student-apply on create and edit. Student Status SHALL be required only when modify student status is enabled. Track Category (学籍类型) SHALL be required only when modify student type is enabled.

#### Scenario: Conditional student status required
- **WHEN** user saves the category form with modify student status enabled and no student status selected
- **THEN** the system prevents save and shows a validation message

#### Scenario: Conditional track category required
- **WHEN** user saves the category form with modify student type enabled and no track category selected
- **THEN** the system prevents save and shows a validation message

#### Scenario: Hidden fields not required when switch off
- **WHEN** user saves the category form with modify student status disabled
- **THEN** the system does not require student status even if the dropdown is hidden
- **AND** the previously stored student status value is retained on the row

#### Scenario: Hidden track category not required when switch off
- **WHEN** user saves the category form with modify student type disabled
- **THEN** the system does not require track category even if the dropdown is hidden
- **AND** the previously stored category value is retained on the row

### Requirement: Movement category implementation behavior switches
The system SHALL provide three independent toggle switches on the create and edit category form, stored per category code row. Each switch label SHALL include a question-mark hint control that reveals explanatory text in a tooltip on hover or focus-within. The system SHALL NOT display persistent hint text below the switch control area.

#### Scenario: Hint tooltip on modify student status
- **WHEN** the create or edit category modal shows modify student status
- **THEN** a question-mark icon appears immediately after the field label text and before the label colon
- **AND** hovering or focusing the icon shows a tooltip explaining that enabling means this movement updates student profile status on implementation
- **AND** no hint paragraph appears below the switch

#### Scenario: Hint tooltip on modify student type
- **WHEN** the create or edit category modal shows modify student type
- **THEN** a question-mark icon appears after the field label with the same tooltip interaction
- **AND** the tooltip explains that enabling means this movement updates student profile track category on implementation

#### Scenario: Hint tooltip on auto implement
- **WHEN** the create or edit category modal shows auto implement
- **THEN** a question-mark icon appears after the field label with the same tooltip interaction
- **AND** the tooltip displays: 开启后，该异动审批通过后将自动标记为已实施 (Chinese UI)

#### Scenario: Switch layout label question colon control
- **WHEN** user views any of the three implementation switches
- **THEN** the layout order is field name, question-mark hint icon, colon, and switch in the control column
- **AND** the switch remains left-aligned in the control area at 32px row height

#### Scenario: Persist switches on save
- **WHEN** user saves the category form with toggled switch values
- **THEN** the system persists modifyStudentStatus, modifyStudentType, and autoImplement on that category row

### Requirement: Edit form field layout and switch-dropdown linkage
The system SHALL present the movement category edit form in this field order: row 1 — category code (read-only) and category name; row 2 — modify student status and modify student type switches with label tooltips; row 3 — conditionally visible Student Status and Track Category (学籍类型) dropdowns with adaptive single- or two-column layout; row 4 — auto implement switch with label tooltip and allow student apply.

#### Scenario: Switches appear above conditional dropdowns
- **WHEN** user opens Edit on a category row
- **THEN** modify student status and modify student type switches appear on row 2 above the conditional dropdown row

#### Scenario: Modify student status shows status dropdown when enabled
- **WHEN** modify student status is enabled
- **THEN** the Student Status dropdown is visible and editable
- **AND** the user must select a value before save

#### Scenario: Modify student status hides status dropdown when disabled
- **WHEN** modify student status is disabled
- **THEN** the Student Status dropdown is not rendered
- **AND** the stored studentStatus value on the row is unchanged on save

#### Scenario: Modify student type shows track category dropdown when enabled
- **WHEN** modify student type is enabled
- **THEN** the Track Category (学籍类型) dropdown is visible and editable with the full trackCategoryOptions list
- **AND** the user must select a value before save

#### Scenario: Modify student type hides track category dropdown when disabled
- **WHEN** modify student type is disabled
- **THEN** the Track Category dropdown is not rendered
- **AND** the stored category value on the row is unchanged on save

#### Scenario: Row three hidden when both modify switches off
- **WHEN** both modify student status and modify student type are disabled
- **THEN** row 3 is not rendered in the form

#### Scenario: Row three single column when one dropdown visible
- **WHEN** exactly one of modify student status or modify student type is enabled
- **THEN** the visible dropdown occupies a single full-width column in the form grid
- **AND** the form does not reserve an empty second column cell

#### Scenario: Row three two columns when both dropdowns visible
- **WHEN** both modify student status and modify student type are enabled
- **THEN** Student Status and Track Category dropdowns appear side by side in two columns

#### Scenario: Track category field label in form
- **WHEN** user opens the create or edit category modal
- **THEN** the dropdown previously labeled Category displays the localized label Track Category (Chinese: 学籍类型)

### Requirement: Independent category dropdown
The system SHALL offer the full track category option list in the Track Category (学籍类型) dropdown without filtering or clearing based on Student Status when the dropdown is visible.

#### Scenario: Track category selectable when visible
- **WHEN** modify student type is enabled and the Track Category dropdown is shown
- **THEN** the dropdown remains enabled with all track category options

#### Scenario: No clear on status change
- **WHEN** user changes Student Status after selecting a Track Category while both dropdowns are visible
- **THEN** the system retains the selected Track Category value

## REMOVED Requirements

### Requirement: Edit form field layout and switch-dropdown linkage (§20 lock-on-enable)
**Reason**: Product requires modify switches to control dropdown visibility and editability; ON shows editable target value, OFF hides dropdown while retaining stored values.
**Migration**: Remove `:disabled="form.modifyStudentStatus"` and `:disabled="form.modifyStudentType"`; replace always-visible dropdowns with conditional `v-if`; update validation to conditional required.

#### Scenario: Modify student status locks status dropdown
- **REMOVED** — replaced by show/hide when enabled/disabled

#### Scenario: Modify student type locks category dropdown
- **REMOVED** — replaced by show/hide when enabled/disabled

#### Scenario: Required status and category on save regardless of switch state
- **REMOVED** — replaced by conditional required when corresponding switch is on

### Requirement: Movement category implementation behavior switches (persistent hints below switch)
**Reason**: Product requires hint text in label tooltips instead of persistent paragraphs below switches.
**Migration**: Remove `<p class="field-hint">` under switch rows; add question-mark tooltip on labels for modify student status, modify student type, and auto implement.

#### Scenario: Switches embedded in form layout with hint below the switch
- **REMOVED** — hints move to label question-mark tooltips

#### Scenario: Auto implement appears with hint on the next line below switch
- **REMOVED** — hint moves to label question-mark tooltip
