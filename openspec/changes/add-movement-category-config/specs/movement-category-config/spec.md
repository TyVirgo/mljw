## ADDED Requirements

### Requirement: Movement category list page
The system SHALL display a paginated movement category configuration table under the Change Category menu with columns: selection checkbox, serial number, category code, category name, Student Status, Category, Student Type, and Actions.

#### Scenario: Initial list with seed data
- **WHEN** user opens Change Category for the first time
- **THEN** the system displays twelve pre-seeded rows (four category groups × three Student Types: Local, Chinese, International)

#### Scenario: Search filters list
- **WHEN** user filters by category name, category code, or Student Status and clicks Search
- **THEN** the list shows only matching rows and resets to page 1

#### Scenario: Reset search
- **WHEN** user clicks Reset
- **THEN** all search fields clear and the full list is restored

### Requirement: Create movement category as a single row
The system SHALL create exactly one list row on Create, including the user-selected Student Type (Local, Chinese, or International).

#### Scenario: Open create form
- **WHEN** user clicks Create on the list page
- **THEN** the system opens the Create/Edit modal showing all six base form fields, three implementation switches, and Student Type

#### Scenario: Submit create form
- **WHEN** user completes all required fields including Student Type and confirms Save
- **THEN** the system inserts one row with the submitted values
- **AND** the new row has an empty reasons array

#### Scenario: Chinese student type display
- **WHEN** a row has Student Type Chinese
- **THEN** data is stored as Chinese
- **AND** the Chinese UI displays the label as 中国

### Requirement: Edit and delete movement category rows
The system SHALL support editing a single list row and deleting one or more selected rows with confirmation.

#### Scenario: Edit single row
- **WHEN** user clicks Edit on a row
- **THEN** the system opens the form modal prefilled for that row only
- **AND** Student Type is read-only
- **AND** saving updates only that row

#### Scenario: Bulk delete rows
- **WHEN** user selects one or more rows and clicks Delete
- **THEN** the system shows a confirmation dialog
- **AND** confirmed deletion removes only the selected rows from storage

#### Scenario: Delete is not blocked by downstream references
- **WHEN** user deletes a category row
- **THEN** the system removes the row without checking movement application references (out of scope for this change)

### Requirement: Category options depend on student status
The system SHALL filter Category dropdown options based on the selected Student Status using the product mapping table (Offered through Expel).

#### Scenario: Category filtered on status change
- **WHEN** user changes Student Status in the create or edit form
- **THEN** the Category dropdown offers only categories allowed for that status

#### Scenario: Clear invalid category on status change
- **WHEN** user changes Student Status and the previously selected Category is not allowed for the new status
- **THEN** the system clears the Category selection

### Requirement: Movement category form fields
The system SHALL require category code, category name, Student Status, Category, Student Type, and allow-student-apply on create; on edit Student Type SHALL be read-only.

#### Scenario: Required field validation
- **WHEN** user submits the form with missing required fields
- **THEN** the system prevents save and shows validation feedback

#### Scenario: Allow student application default
- **WHEN** user opens the create form
- **THEN** allow-student-apply defaults to Yes

#### Scenario: Duplicate code and student type
- **WHEN** user creates or edits a row that would duplicate the same category code and Student Type pair
- **THEN** the system prevents save and shows a validation message

#### Scenario: Form footer actions
- **WHEN** the create or edit form modal is open
- **THEN** the footer shows Cancel and Save buttons

### Requirement: Configure reasons per category row
The system SHALL provide a Set Reason action that opens a modal to manage reasons for the selected category row.

#### Scenario: Open set reason modal
- **WHEN** user clicks Set Reason on a list row
- **THEN** the system opens the reason modal scoped to that row's reasons list

#### Scenario: Reason list columns
- **WHEN** the reason modal is open
- **THEN** the table shows selection checkbox, serial number, reason name, and Edit action per row

#### Scenario: Create reason via small edit modal
- **WHEN** user clicks Create in the reason modal
- **THEN** the system opens a small edit modal with a required reason name field
- **AND** saving appends the reason to the current category row

#### Scenario: Edit reason via small edit modal
- **WHEN** user clicks Edit on a reason row
- **THEN** the system opens the small edit modal prefilled with the reason name
- **AND** saving updates that reason in the current category row

#### Scenario: Delete reasons in bulk
- **WHEN** user selects one or more reasons and clicks Delete in the reason modal
- **THEN** the system confirms and removes the selected reasons from the current category row

#### Scenario: Close reason modal
- **WHEN** user clicks Cancel on the reason modal
- **THEN** the modal closes and reason changes remain persisted in mock storage

### Requirement: Movement category page pagination
The system SHALL paginate both the main category list and the reason list inside the reason modal using the same pagination pattern as other student-records list pages.

#### Scenario: Main list pagination
- **WHEN** more category rows exist than the page size
- **THEN** the main list shows pagination controls

#### Scenario: Reason modal pagination
- **WHEN** more reasons exist than the reason modal page size
- **THEN** the reason modal shows pagination controls

### Requirement: Movement category implementation behavior switches
The system SHALL provide three independent toggle switches on the create and edit category form, stored per list row (per Student Type).

#### Scenario: Form shows three implementation switches
- **WHEN** user opens the create or edit category modal
- **THEN** the form displays toggles for modify student status, modify student type, and auto implement
- **AND** the labels are distinct from the Student Status and Student Type dropdown configuration fields

#### Scenario: Switches default off on create
- **WHEN** user opens the create category form
- **THEN** modify student status, modify student type, and auto implement default to off (false)

#### Scenario: Implementation switch hints
- **WHEN** the create or edit category modal shows the three implementation switches
- **THEN** modify student status displays a hint that enabling means this movement updates student profile status on implementation
- **AND** modify student type displays a hint that enabling means this movement updates student profile student type on implementation
- **AND** auto implement displays the hint: 开启后，该异动审批通过后将自动标记为已实施 (Chinese UI)

#### Scenario: Persist switches on save
- **WHEN** user saves the category form with toggled switch values
- **THEN** the system persists modifyStudentStatus, modifyStudentType, and autoImplement on that category row only

#### Scenario: Edit row scoped switches
- **WHEN** user edits one category row
- **THEN** only that row's three switch values are updated
- **AND** other Student Type rows for the same category code may have different switch values

### Requirement: Extended movement category seed data
The system SHALL seed twelve movement category rows covering all four movement types × three Student Types.

#### Scenario: Initial seed includes withdrawal and resumption
- **WHEN** user opens Change Category for the first time after this extension
- **THEN** the list includes PT001, DEF001, WDR001, and RES001 groups
- **AND** each group has Local, Chinese, and International rows

#### Scenario: Resumption category target status
- **WHEN** a RES001 seed row is displayed
- **THEN** its configured Student Status is Active and Category is Normal

### Requirement: Resolve category config for movement pipeline
The system SHALL expose a lookup helper that maps a movement source key and student category to the matching category configuration row.

#### Scenario: Lookup by source key and student type
- **WHEN** the pipeline resolves config for programme-transfer and student category Local
- **THEN** the system returns the PT001 row with studentType Local

#### Scenario: China maps to Chinese for lookup
- **WHEN** student category is China
- **THEN** lookup uses Chinese as the configuration studentType

#### Scenario: Missing config fallback
- **WHEN** no matching category row exists
- **THEN** the pipeline treats all three switches as false

## MODIFIED Requirements

### Requirement: Movement category list page
The system SHALL display a paginated movement category configuration table under the Change Category menu with columns: selection checkbox, serial number, category code, category name, Student Status, Category, and Actions.

#### Scenario: Initial list with seed data
- **WHEN** user opens Change Category for the first time
- **THEN** the system displays four pre-seeded rows (PT001, DEF001, WDR001, RES001 — one row per category code)

#### Scenario: Search filters list
- **WHEN** user filters by category name, category code, or Student Status and clicks Search
- **THEN** the list shows only matching rows and resets to page 1

#### Scenario: Reset search
- **WHEN** user clicks Reset
- **THEN** all search fields clear and the full list is restored

### Requirement: Create movement category as a single row
The system SHALL create exactly one list row on Create with category code, category name, Student Status, Category, allow-student-apply, and the three implementation switches.

#### Scenario: Open create form
- **WHEN** user clicks Create on the list page
- **THEN** the system opens the Create/Edit modal with category code, category name, Student Status, Category, allow-student-apply, and embedded implementation switches
- **AND** the form does not include a Student Type field

#### Scenario: Submit create form
- **WHEN** user completes all required fields and confirms Save
- **THEN** the system inserts one row with the submitted values
- **AND** the new row has an empty reasons array

### Requirement: Edit and delete movement category rows
The system SHALL support editing a single list row and deleting one or more selected rows with confirmation.

#### Scenario: Edit single row
- **WHEN** user clicks Edit on a row
- **THEN** the system opens the form modal prefilled for that row only
- **AND** saving updates only that row

#### Scenario: Bulk delete rows
- **WHEN** user selects one or more rows and clicks Delete
- **THEN** the system shows a confirmation dialog
- **AND** confirmed deletion removes only the selected rows from storage

#### Scenario: Delete is not blocked by downstream references
- **WHEN** user deletes a category row
- **THEN** the system removes the row without checking movement application references (out of scope for this change)

### Requirement: Movement category form fields
The system SHALL require category code, category name, Student Status, Category, and allow-student-apply on create and edit.

#### Scenario: Required field validation
- **WHEN** user submits the form with missing required fields
- **THEN** the system prevents save and shows validation feedback

#### Scenario: Allow student application default
- **WHEN** user opens the create form
- **THEN** allow-student-apply defaults to Yes

#### Scenario: Duplicate category code
- **WHEN** user creates or edits a row that would duplicate an existing category code
- **THEN** the system prevents save and shows a validation message

#### Scenario: Form footer actions
- **WHEN** the create or edit form modal is open
- **THEN** the footer shows Cancel and Save buttons

### Requirement: Movement category implementation behavior switches
The system SHALL provide three independent toggle switches on the create and edit category form, stored per category code row.

#### Scenario: Switches embedded in form layout
- **WHEN** user opens the create or edit category modal
- **THEN** modify student status appears on its own form row with label in the standard label column and switch left-aligned in the control area, with hint below the switch
- **AND** modify student type appears on its own form row with the same layout
- **AND** the Student Status and Category dropdown rows contain only their selects (no nested switch rows)
- **AND** auto implement appears on a subsequent row with label in the standard label column and switch left-aligned in the control area, with hint on the next line

#### Scenario: Modify switches on dedicated rows
- **WHEN** user opens the create or edit category modal
- **THEN** modify student status and modify student type each occupy a separate grid row aligned with category code label column
- **AND** neither switch is right-aligned inside the Student Status or Category control area

#### Scenario: Form label column alignment
- **WHEN** user opens the create or edit category modal
- **THEN** Student Status, Category, and auto implement use the same left label column (132px, right-aligned) as category code and category name
- **AND** Student Status and Category labels appear on the same row as their dropdowns (label left, control right)
- **AND** the form does not use spacer labels or inline bold labels inside the control area for those field names

#### Scenario: Switches default off on create
- **WHEN** user opens the create category form
- **THEN** modify student status, modify student type, and auto implement default to off (false)

#### Scenario: Implementation switch hints
- **WHEN** the create or edit category modal shows the implementation switches
- **THEN** modify student status displays a hint that enabling means this movement updates student profile status on implementation
- **AND** modify student type displays a hint that enabling means this movement updates student profile track category on implementation
- **AND** auto implement displays the hint: 开启后，该异动审批通过后将自动标记为已实施 (Chinese UI)

#### Scenario: Persist switches on save
- **WHEN** user saves the category form with toggled switch values
- **THEN** the system persists modifyStudentStatus, modifyStudentType, and autoImplement on that category row

#### Scenario: One row per category code
- **WHEN** user edits a category row
- **THEN** that row's three switch values apply to all movement applications resolved to the same category code

### Requirement: Extended movement category seed data
The system SHALL seed four movement category rows covering PT001, DEF001, WDR001, and RES001.

#### Scenario: Initial seed after layout revision
- **WHEN** user opens Change Category for the first time after this revision
- **THEN** the list includes exactly four rows (one per category code)

#### Scenario: Resumption category target status
- **WHEN** the RES001 seed row is displayed
- **THEN** its configured Student Status is Active and Category is Normal
- **AND** auto implement may be true for pipeline demonstration

### Requirement: Resolve category config for movement pipeline
The system SHALL expose a lookup helper that maps a movement source key to the matching category configuration row by category code.

#### Scenario: Lookup by source key only
- **WHEN** the pipeline resolves config for programme-transfer
- **THEN** the system returns the PT001 row regardless of the applicant student category

#### Scenario: Missing config fallback
- **WHEN** no matching category row exists for the source key
- **THEN** the pipeline treats all three switches as false

### Requirement: Independent category dropdown
The system SHALL offer the full track category option list in the Category dropdown without filtering or clearing based on Student Status.

#### Scenario: Category always selectable
- **WHEN** user opens create or edit and has not selected Student Status
- **THEN** the Category dropdown remains enabled with all track category options

#### Scenario: No clear on status change
- **WHEN** user changes Student Status after selecting a Category
- **THEN** the system retains the selected Category value

### Requirement: Category reasons drive movement application options
The system SHALL expose movement category reasons as the single source of truth for reason dropdown options on deferment, withdrawal, and programme transfer application forms.

#### Scenario: Deferment reason options from category config
- **WHEN** user opens the deferment create or edit form
- **THEN** the main reason dropdown lists only reasons configured on the DEF001 category row

#### Scenario: Withdrawal reason options from category config
- **WHEN** user opens the withdrawal create or edit form
- **THEN** the main reason dropdown lists only reasons configured on the WDR001 category row

#### Scenario: Programme transfer reason options from category config
- **WHEN** user opens the programme transfer create or edit form
- **THEN** the transfer reason control is a dropdown listing reasons configured on the PT001 category row

#### Scenario: Reason options update after admin CRUD
- **WHEN** an administrator adds, edits, or deletes reasons on a category row via Set Reason
- **THEN** the corresponding application form reason dropdown reflects the updated list on next open

#### Scenario: Empty reasons block submission
- **WHEN** a category row has no configured reasons and user opens the matching application form
- **THEN** the reason dropdown has no options
- **AND** the system prevents submit until a valid reason is selected after reasons are configured

#### Scenario: Seed reasons for mock categories
- **WHEN** user opens Change Category for the first time after this revision
- **THEN** DEF001, WDR001, and PT001 rows include pre-seeded reasons aligned with prior hardcoded demo options

#### Scenario: Resolve reason label for display
- **WHEN** the approval, query, or maintenance pipeline displays movement reason for deferment, withdrawal, or programme transfer
- **THEN** the system resolves the label from the stored reasonId via the matching category configuration row

#### Scenario: Resumption unchanged
- **WHEN** the pipeline displays movement reason for resumption
- **THEN** the system continues to show semester transition text rather than a configured reason list

## REMOVED Requirements

### Requirement: Category options depend on student status
**Reason**: Product requires Student Status and Category to be independently selectable.
**Migration**: Use `trackCategoryOptions` full list; remove `getCategoriesForStatus` from form logic.

### Requirement: Student Type field and column
**Reason**: Movement category module no longer uses Student Type as a configuration dimension.
**Migration**: Remove from form, list, data model, validation, and lookup; consolidate mock to four rows.

### Requirement: Create movement category as a single row
**Reason**: Product defers category row creation in this phase; four movement types are pre-seeded only.
**Migration**: Hide Create toolbar button; retain `createMovementCategory` for a future phase.

#### Scenario: Open create form
- **REMOVED** — no Create entry on the list page in this phase

#### Scenario: Submit create form
- **REMOVED** — superseded by fixed four-row seed

### Requirement: Edit and delete movement category rows (bulk delete)
**Reason**: Product defers category row deletion in this phase.
**Migration**: Hide Delete toolbar and list checkboxes; retain `deleteMovementCategories` for a future phase.

#### Scenario: Bulk delete rows
- **REMOVED** — no Delete action on the list page in this phase

#### Scenario: Delete is not blocked by downstream references
- **REMOVED** — delete UI unavailable in this phase

## MODIFIED Requirements

### Requirement: Movement category list page (fixed four types, read-only structure)
The system SHALL display exactly four pre-seeded movement category rows (PT001, DEF001, WDR001, RES001) with list actions limited to Edit and Set Reason in this phase. The list SHALL NOT show Create or Delete toolbar buttons or a selection checkbox column.

#### Scenario: No create or delete on list
- **WHEN** user opens Change Category
- **THEN** the toolbar does not show Create or Delete
- **AND** the table does not include a selection checkbox column

#### Scenario: Row actions limited to edit and set reason
- **WHEN** user views a category row
- **THEN** actions show Edit and Set Reason only

#### Scenario: Fixed four seed rows
- **WHEN** user opens Change Category
- **THEN** the list shows four rows matching the four movement application types

### Requirement: Edit movement category row
The system SHALL support editing a single list row via the Edit action. Category code SHALL be read-only in the edit form.

#### Scenario: Edit single row
- **WHEN** user clicks Edit on a row
- **THEN** the system opens the form modal prefilled for that row only
- **AND** category code is read-only
- **AND** saving updates only that row

### Requirement: Configure reasons per category row
The system SHALL continue to provide Set Reason with full reason CRUD inside the reason modal in this phase.

#### Scenario: Reason CRUD unchanged in set reason modal
- **WHEN** user opens Set Reason on a row
- **THEN** the reason modal still supports create, edit, and delete for reasons on that category row

### Requirement: Edit form field layout and switch-dropdown linkage (§20)
The system SHALL present the movement category edit form in this field order: row 1 — category code (read-only) and category name; row 2 — modify student status and modify student type switches with hints; row 3 — Student Status and Category dropdowns; row 4 — auto implement switch and allow student apply.

#### Scenario: Switches appear above dropdowns
- **WHEN** user opens Edit on a category row
- **THEN** modify student status and modify student type switches appear above the Student Status and Category dropdowns respectively

#### Scenario: Modify student status locks status dropdown
- **WHEN** modify student status is enabled
- **THEN** the Student Status dropdown is disabled and retains its current value
- **AND** when modify student status is disabled the dropdown is editable

#### Scenario: Modify student type locks category dropdown
- **WHEN** modify student type is enabled
- **THEN** the Category dropdown is disabled and retains its current value
- **AND** when modify student type is disabled the dropdown is editable

#### Scenario: Required status and category on save
- **WHEN** user saves the edit form
- **THEN** Student Status and Category remain required regardless of switch state

### Requirement: Movement category course handling options (§20–§22)
The system SHALL show an optional course-handling section with three independently selectable checkboxes when editing any of the four pre-seeded movement category rows (PT001, DEF001, WDR001, RES001): delete original course list (excluding graded courses), preset new programme batch list, and exclude graded courses from preset. As of §21, the three checkboxes SHALL NOT disable, clear, or otherwise depend on one another. As of §22, the section SHALL NOT be limited to PT001.

#### Scenario: Course options visible for all four category types (§22)
- **WHEN** user clicks Edit on PT001, DEF001, WDR001, or RES001
- **THEN** the form shows the three course-handling checkboxes below auto implement and allow student apply
- **AND** the same labels and layout apply to all four types

#### Scenario: Course handling checkboxes are independent (§21)
- **WHEN** user toggles any course-handling checkbox on any category row
- **THEN** the other two checkboxes remain enabled and retain their current checked state
- **AND** the system does not auto-clear exclude graded from preset when preset new programme batch list is unchecked

#### Scenario: Course handling label aligns with first option (§21)
- **WHEN** user edits any category row and the course-handling section is visible
- **THEN** the course-handling label appears on the same row as the first checkbox, vertically centered with that checkbox
- **AND** the second and third checkboxes align with the first checkbox's left edge
- **AND** the label and checkbox labels use the same font size as other fields in the modal (13px)

#### Scenario: Non–programme-transfer defaults (§22)
- **WHEN** user opens Edit on DEF001, WDR001, or RES001 for the first time after seed
- **THEN** all three course-handling checkboxes default to unchecked

#### Scenario: Course options are optional mock config
- **WHEN** user saves any category row with any combination of the three checkboxes
- **THEN** the values persist on the category row
- **AND** no real course-selection API is invoked in this phase

## REMOVED Requirements (§22)

### Requirement: Course handling visible for PT001 only (§20–§21)
**Reason**: Product requires the same three course-handling options on Edit for all four movement category types.
**Migration**: Remove `isProgrammeTransfer` / PT001-only `v-if`; show course-handling block for every Edit form.

## REMOVED Requirements (§21)

### Requirement: Exclude graded from preset depends on preset batch (§20)
**Reason**: Product requires three course-handling options to be independently selectable with no UI linkage.
**Migration**: Remove watch and disabled state on exclude graded from preset; update course-handling layout per §21.
