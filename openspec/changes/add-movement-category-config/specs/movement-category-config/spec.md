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
