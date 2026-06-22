## ADDED Requirements

### Requirement: Movement maintenance list page
The system SHALL display a paginated wide-table list of approved movement applications merged from all four movement types under the Status Change Maintenance menu.

#### Scenario: List shows approved records only
- **WHEN** user opens Status Change Maintenance
- **THEN** the list includes only records with status Approved from programme transfer, deferment, resumption, and withdrawal stores
- **AND** draft and in-progress applications are excluded

#### Scenario: Search filters list
- **WHEN** user filters by academic session, movement reason, status, student ID, or student name and clicks Search
- **THEN** the list shows only matching rows and resets to page 1

#### Scenario: Reset search
- **WHEN** user clicks Reset
- **THEN** all search fields clear and the full maintenance list is restored

#### Scenario: Wide table columns
- **WHEN** the maintenance list is displayed
- **THEN** the table shows core columns from the prototype including status, approval stage, implemented flag, student identifiers, sessions, movement category, movement reason, and movement date
- **AND** extended columns for passport/IC, student type, intake, current/new school and programme fields where applicable
- **AND** trailing columns for English name, CGPA, expected graduation time, movement number, remark, and actions

#### Scenario: Non-applicable extended columns
- **WHEN** a row is not a programme transfer application
- **THEN** programme-transfer-specific extended columns display an em dash placeholder

### Requirement: Implement approved movement records
The system SHALL allow batch marking of selected pending-implement rows as implemented.

#### Scenario: Implement pending rows
- **WHEN** user selects one or more rows with implemented status Pending and clicks Implement
- **THEN** the system shows a confirmation dialog
- **AND** on confirm sets implemented to Implemented on the selected store records

#### Scenario: Implement disabled for already implemented
- **WHEN** all selected rows are already Implemented
- **THEN** the Implement action is disabled or shows no eligible rows message

### Requirement: Modify movement numbers
The system SHALL provide a Modify Movement Number action for selected rows.

#### Scenario: Open modify movement number modal
- **WHEN** user selects rows and clicks Modify Movement Number
- **THEN** the system opens a modal listing each selected row with an editable movement number field

#### Scenario: Save movement numbers
- **WHEN** user saves movement numbers in the modal
- **THEN** the system persists movementNumber on each corresponding store record

### Requirement: Export and delete maintenance rows
The system SHALL support export and delete actions on the maintenance list.

#### Scenario: Export maintenance list
- **WHEN** user clicks Export
- **THEN** the system triggers a mock export consistent with other student-records list pages

#### Scenario: Delete selected rows
- **WHEN** user selects rows and clicks Delete
- **THEN** the system shows a confirmation dialog
- **AND** on confirm removes the selected records from the corresponding movement store lists

### Requirement: Maintenance row actions
The system SHALL provide Edit, Details, and Approval log actions per maintenance row.

#### Scenario: Edit maintenance fields
- **WHEN** user clicks Edit on a row
- **THEN** the system opens an edit modal for maintenance fields including movement number, remark, CGPA, and expected graduation time
- **AND** programme transfer rows also allow editing new school and programme fields where configured

#### Scenario: View details
- **WHEN** user clicks Details on a row
- **THEN** the system opens the same read-only application review view used on the approval page without approval controls

#### Scenario: View approval log
- **WHEN** user clicks Approval log on a row
- **THEN** the system opens the approval log modal with that record's approval history

#### Scenario: Edit modal footer
- **WHEN** the maintenance edit modal is open
- **THEN** the footer shows Cancel and Save buttons

### Requirement: Student type display on maintenance list
The system SHALL display student type on the maintenance list using Local, Chinese, and International values with Chinese UI label 中国 for Chinese.

#### Scenario: Chinese student type label
- **WHEN** a maintenance row student category maps to Chinese
- **THEN** the Chinese UI displays 中国 in the student type column

### Requirement: Maintenance list pagination
The system SHALL paginate the maintenance list using the same pagination pattern as other student-records list pages.

#### Scenario: Pagination controls
- **WHEN** more maintenance rows exist than the page size
- **THEN** the list shows pagination controls
