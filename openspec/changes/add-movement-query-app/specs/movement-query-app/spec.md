## ADDED Requirements

### Requirement: Movement query list page
The system SHALL display a paginated read-only wide-table list of movement applications merged from all four movement types under the Status Change Inquiry menu.

#### Scenario: List excludes draft records
- **WHEN** user opens Status Change Inquiry
- **THEN** the list includes all non-draft records from programme transfer, deferment, resumption, and withdrawal stores
- **AND** draft applications are excluded

#### Scenario: Wide table columns match prototype
- **WHEN** the query list is displayed
- **THEN** the table shows core columns including status, approval stage, implemented flag, student identifiers, sessions, movement category, movement reason, and movement date
- **AND** extended columns for passport/IC, student type, intake, current/new school and programme fields where applicable
- **AND** trailing columns for English name, CGPA, expected graduation time, movement number, remark, and actions

#### Scenario: Non-applicable extended columns
- **WHEN** a row is not a programme transfer application
- **THEN** programme-transfer-specific extended columns display an em dash placeholder

#### Scenario: Decorative sortable headers
- **WHEN** the query table headers are rendered
- **THEN** data column headers show sortable visual styling
- **AND** clicking headers does not reorder rows in the first version

### Requirement: Movement query search with collapse
The system SHALL provide a two-row search area with collapse support.

#### Scenario: Primary search row always visible
- **WHEN** the query page loads
- **THEN** the first search row shows Academic Session, movement reason, and status fields with Search and Reset actions

#### Scenario: Secondary search row collapsible
- **WHEN** user toggles collapse
- **THEN** the second search row showing Student ID and Student Name is shown or hidden
- **AND** the toggle label switches between collapse and expand text

#### Scenario: Search filters list
- **WHEN** user applies search criteria and clicks Search
- **THEN** the list shows only matching rows and resets to page 1

#### Scenario: Reset search
- **WHEN** user clicks Reset
- **THEN** all search fields clear and the full query list is restored

### Requirement: Read-only query actions
The system SHALL not provide any data mutation actions on the query page.

#### Scenario: No edit or maintenance toolbar
- **WHEN** user views the query page toolbar
- **THEN** only Export is available
- **AND** implement, modify movement number, delete, and create actions are not shown

#### Scenario: Row actions are read-only
- **WHEN** user views a query row actions column
- **THEN** only Details and Approval log actions are available
- **AND** Edit is not available

#### Scenario: View details
- **WHEN** user clicks Details on a row
- **THEN** the system opens the same read-only application review view used on the approval page without approval controls

#### Scenario: View approval log
- **WHEN** user clicks Approval log on a row
- **THEN** the system opens the approval log modal with that record's approval history

### Requirement: Movement query export via ExportModal
The system SHALL export query results to Excel using the shared ExportModal component.

#### Scenario: Open export modal
- **WHEN** user clicks Export and filtered results exist
- **THEN** the system opens ExportModal with selectable export fields

#### Scenario: Export current page to xlsx
- **WHEN** user confirms export with scope current page
- **THEN** the system downloads an xlsx file containing only the current page rows and selected fields

#### Scenario: Export all results to xlsx
- **WHEN** user confirms export with scope all results
- **THEN** the system downloads an xlsx file containing all filtered rows and selected fields

#### Scenario: Export selected rows to xlsx
- **WHEN** user selects rows and confirms export with scope selected rows
- **THEN** the system downloads an xlsx file containing only selected rows and selected fields

#### Scenario: Export blocked when no data
- **WHEN** user clicks Export with no filtered results
- **THEN** the system shows a no-data message and does not open the export modal

### Requirement: Student type display on query list
The system SHALL display student type on the query list using Local, Chinese, and International values with Chinese UI label 中国 for Chinese.

#### Scenario: Chinese student type label
- **WHEN** a query row student category maps to Chinese
- **THEN** the Chinese UI displays 中国 in the student type column

### Requirement: Movement query pagination
The system SHALL paginate the query list using the same pagination pattern as other student-records list pages.

#### Scenario: Pagination controls
- **WHEN** more query rows exist than the page size
- **THEN** the list shows pagination controls
