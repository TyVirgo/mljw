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

## MODIFIED Requirements

### Requirement: Movement query search with collapse
The system SHALL provide a two-row search area with collapse support. The first row SHALL include Academic Session, Programme Code, status, and Movement Type. The Movement Reason search field SHALL NOT be shown.

#### Scenario: Primary search row always visible
- **WHEN** the query page loads
- **THEN** the first search row shows Academic Session, Programme Code, status, and Movement Type fields with Search and Reset actions

#### Scenario: No movement reason search
- **WHEN** user views the query search area
- **THEN** the system does not display a Movement Reason search input

#### Scenario: Filter by programme code
- **WHEN** user enters a programme code keyword and clicks Search
- **THEN** the list shows only rows whose resolved programme code matches the keyword

#### Scenario: Movement type on first row
- **WHEN** user views the query search area
- **THEN** the Movement Type dropdown appears after Status on the first row

#### Scenario: Filter by movement type
- **WHEN** user selects Deferment and clicks Search
- **THEN** the list shows only deferment application rows

#### Scenario: All movement types
- **WHEN** user leaves Movement Type at All and clicks Search
- **THEN** the list is not filtered by movement type

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

### Requirement: Movement query list aligned with maintenance display
The system SHALL display a streamlined query table matching the maintenance list column set, column order, passport/IC masking, and implemented Y/N display defined in movement maintenance §8.

#### Scenario: Streamlined table columns match maintenance
- **WHEN** the query list is displayed
- **THEN** the table shows the same streamlined columns as the maintenance list including status, approval stage, implemented flag as Y/N, student identifiers, movement date, masked passport/IC, student type, intake, sessions, movement category, and movement reason
- **AND** the table does not show columns for CGPA, English name, expected graduation time, movement number, remark, or current/new school and programme fields

#### Scenario: Passport/IC masked on query list
- **WHEN** a query row displays passport/IC in the list
- **THEN** the value is partially masked using the shared maskPassportIc helper

#### Scenario: Implemented displayed as Y/N on query list
- **WHEN** a query row displays the implemented flag in the list
- **THEN** the column shows Y or N using the same formatImplementedYn helper as the maintenance list

#### Scenario: Query details mask sensitive fields
- **WHEN** user opens Details on a query row
- **THEN** the read-only review view enables maskSensitiveFields
- **AND** passport/IC and parent NRIC/passport fields in the detail view are masked
- **AND** current and new school/programme fields remain visible in the detail view

#### Scenario: No sortable header decoration on query list
- **WHEN** the query table headers are rendered
- **THEN** data column headers do not show sortable visual styling

### Requirement: Movement query export with maintenance defaults and optional extended fields
The system SHALL export query results using the maintenance export default field set with masking and Y/N formatting, and SHALL offer additional optional export-only extended fields.

#### Scenario: Export default fields match maintenance
- **WHEN** user opens ExportModal on the query page
- **THEN** the default selected export fields match movementMaintenanceExportColumnMeta
- **AND** passport/IC values in the export file are masked when exported
- **AND** implemented values in the export file use Y/N

#### Scenario: Optional extended export fields
- **WHEN** user opens ExportModal on the query page
- **THEN** optional export fields are available for current/new school and programme, English name, CGPA, movement number, and remark
- **AND** those optional fields are not selected by default
- **AND** those optional fields are not shown as list table columns

### Requirement: Query list status badges match application styling
The system SHALL render status badges on the query list using the same pill styling and color tokens as the four movement application list pages.

#### Scenario: Status badge uses shared stylesheet
- **WHEN** the query list displays a status badge
- **THEN** the badge uses movement-status-badge.css with pill border radius and light-background color tokens matching application lists

#### Scenario: Expired status styling on query list
- **WHEN** a query row has status Expired
- **THEN** the badge uses the status-expired class

#### Scenario: No white-text override on query badges
- **WHEN** the query list renders status badges
- **THEN** scoped page styles do not force white text on status badges

## REMOVED Requirements

### Requirement: Wide table prototype columns on query list
**Reason**: §9 aligns query list with maintenance §8 streamlined table; extended school/programme and trailing maintenance fields are export-only optional fields.
**Migration**: Use Movement query list aligned with maintenance display and Movement query export with maintenance defaults and optional extended fields.

#### Scenario: Wide table columns match prototype
- **REMOVED** — superseded by Streamlined table columns match maintenance

#### Scenario: Non-applicable extended columns on list
- **REMOVED** — programme-transfer extended columns are no longer list columns; optional in export only

#### Scenario: Decorative sortable headers
- **REMOVED** — superseded by No sortable header decoration on query list
