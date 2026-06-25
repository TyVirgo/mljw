## ADDED Requirements

### Requirement: Movement statistics aggregated list page
The system SHALL display a paginated aggregated statistics table under the Status Change Statistics menu, where each row represents one School Code + Programme Code + Intake group and columns show counts per movement type.

#### Scenario: Rows show groups with movement activity only
- **WHEN** user opens Status Change Statistics
- **THEN** the list shows only groups where at least one count column is greater than zero
- **AND** groups with no matching movement records after filtering are excluded

#### Scenario: Dimension columns match prototype
- **WHEN** the statistics table is displayed
- **THEN** each row shows serial number, School Code, Programme Code, and Intake
- **AND** count columns include Programme Transfer, Deferment, Withdrawal, Resumption, Outbound Mobility, Expel, Incomplete, Completion, Completion without Graduation, Inbound Mobility, and IEP

#### Scenario: Wide table horizontal scroll
- **WHEN** the statistics table is rendered
- **THEN** all count columns are visible via horizontal scrolling
- **AND** the table matches prototype figures 1 and 2 column order

#### Scenario: Count cells are numeric
- **WHEN** a group has zero records for a movement type column
- **THEN** the cell displays 0
- **AND** non-zero counts display as integers

### Requirement: Movement statistics data scope and aggregation
The system SHALL aggregate non-draft movement applications and statistics supplement seeds using consistent filtering rules.

#### Scenario: Exclude draft applications from aggregation
- **WHEN** statistics rows are built from the four movement stores
- **THEN** draft applications are excluded from counting
- **AND** the scope matches the movement query list (all non-draft statuses)

#### Scenario: First four columns from four-tab source keys
- **WHEN** a non-draft programme transfer application matches filters
- **THEN** its group increments the Programme Transfer count
- **AND** deferment, withdrawal, and resumption applications increment their respective columns

#### Scenario: Extended seven columns from supplement seeds
- **WHEN** statistics rows are built
- **THEN** Outbound Mobility through IEP counts come from statistics supplement seeds only
- **AND** supplement seeds do not modify the four movement store lists

#### Scenario: Academic session filter uses application session
- **WHEN** user filters by Academic Session and clicks Search
- **THEN** only applications and supplement entries whose applicationSession matches participate in counts
- **AND** the list resets to page 1

### Requirement: Movement statistics search with collapse
The system SHALL provide a two-row search area consistent with the movement query page.

#### Scenario: Primary search row always visible
- **WHEN** the statistics page loads
- **THEN** the first search row shows Academic Session, movement reason, and status with Search and Reset actions

#### Scenario: Secondary search row collapsible and expanded by default
- **WHEN** the statistics page loads
- **THEN** the second search row showing Student ID and Student Name is visible
- **WHEN** user toggles collapse
- **THEN** the second row is hidden or shown and the toggle label updates

#### Scenario: Search filters aggregated results
- **WHEN** user applies search criteria and clicks Search
- **THEN** counts are recomputed from filtered source records and supplement seeds only
- **AND** the list resets to page 1

#### Scenario: Reset search
- **WHEN** user clicks Reset
- **THEN** all search fields clear and full statistics are restored

### Requirement: Read-only statistics page actions
The system SHALL not provide data mutation or row drill-down actions on the statistics page.

#### Scenario: Toolbar export only
- **WHEN** user views the statistics page toolbar
- **THEN** only Export is available
- **AND** implement, modify movement number, delete, create, and edit actions are not shown

#### Scenario: No row actions column
- **WHEN** user views the statistics table
- **THEN** no Details, Edit, or Approval log actions are shown per row

### Requirement: Movement statistics export via ExportModal
The system SHALL export statistics results to Excel using the same ExportModal interaction as movement maintenance and query.

#### Scenario: Open export modal
- **WHEN** user clicks Export and filtered results exist
- **THEN** the system opens ExportModal with selectable statistics export fields

#### Scenario: Export current page to xlsx
- **WHEN** user confirms export with scope current page
- **THEN** the system downloads an xlsx file containing only the current page rows and selected fields

#### Scenario: Export all results to xlsx
- **WHEN** user confirms export with scope all results
- **THEN** the system downloads an xlsx file containing all filtered group rows and selected fields

#### Scenario: Export selected rows to xlsx
- **WHEN** user selects rows and confirms export with scope selected rows
- **THEN** the system downloads an xlsx file containing only selected group rows and selected fields

#### Scenario: Export blocked when no data
- **WHEN** user clicks Export with no filtered results
- **THEN** the system shows a no-data message and does not open the export modal

### Requirement: Movement statistics pagination
The system SHALL paginate the statistics list using the same pagination pattern as other student-records list pages.

#### Scenario: Pagination controls
- **WHEN** more statistics group rows exist than the page size
- **THEN** the list shows pagination controls

## MODIFIED Requirements

### Requirement: Movement statistics search with collapse
The system SHALL provide a two-row search area consistent with the movement query page. The first row SHALL include Academic Session, Programme Code, and status. The Movement Reason search field SHALL NOT be shown.

#### Scenario: Primary search row always visible
- **WHEN** the statistics page loads
- **THEN** the first search row shows Academic Session, Programme Code, and status with Search and Reset actions

#### Scenario: No movement reason search
- **WHEN** user views the statistics search area
- **THEN** the system does not display a Movement Reason search input

#### Scenario: Filter aggregated rows by programme code
- **WHEN** user enters a programme code and clicks Search
- **THEN** application records and supplement seeds that do not match the programme code are excluded before aggregation

#### Scenario: Secondary search row collapsible and expanded by default
- **WHEN** the statistics page loads
- **THEN** the second search row showing Student ID and Student Name is visible
- **WHEN** user toggles collapse
- **THEN** the second row is hidden or shown and the toggle label updates

#### Scenario: Search filters aggregated results
- **WHEN** user applies search criteria and clicks Search
- **THEN** counts are recomputed from filtered source records and supplement seeds only
- **AND** the list resets to page 1

#### Scenario: Reset search
- **WHEN** user clicks Reset
- **THEN** all search fields clear and full statistics are restored
