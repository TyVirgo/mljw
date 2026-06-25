## ADDED Requirements

### Requirement: Movement maintenance list page
The system SHALL display a paginated list of approved movement applications merged from all four movement types under the Status Change Maintenance menu.

#### Scenario: List shows approved records only
- **WHEN** user opens Status Change Maintenance
- **THEN** the list includes only records with status Approved from programme transfer, deferment, resumption, and withdrawal stores
- **AND** draft and in-progress applications are excluded

### Requirement: Implement approved movement records
The system SHALL allow batch marking of selected pending-implement rows as implemented, applying student profile changes immediately only when the current application session equals the row effective session; otherwise the system SHALL queue the row for deferred implementation until the effective session is reached.

#### Scenario: Implement pending rows at effective session
- **WHEN** user selects one or more rows with implemented status Pending and clicks Implement
- **AND** the current application session equals the row effective session for each selected row
- **THEN** the system shows a confirmation dialog
- **AND** on confirm applies student profile changes per movement category config and sets implemented to Implemented

#### Scenario: Schedule implement before effective session
- **WHEN** user confirms Implement on a Pending row whose effective session is not the current application session
- **THEN** the system sets implemented to Scheduled on the store record
- **AND** does not apply student profile changes or other application field mutations at confirm time
- **AND** the Implemented column continues to display N

#### Scenario: Deferred implement runs when session due
- **WHEN** the mock implementation processor runs and the current application session equals or follows the row effective session for a Scheduled record
- **THEN** the system applies student profile changes and sets implemented to Implemented

#### Scenario: Implement disabled for already implemented
- **WHEN** all selected rows are already Implemented or Scheduled
- **THEN** the Implement action is disabled or shows no eligible rows message

### Requirement: Maintenance list row selection for bulk actions (§11)
The system SHALL allow row checkboxes only for rows with implemented status Pending. Rows with Implemented or Scheduled status SHALL NOT be selectable. The header select-all control SHALL select only selectable rows on the current page.

#### Scenario: Implemented rows not selectable
- **WHEN** a maintenance row displays Implemented (Y)
- **THEN** its row checkbox is disabled and cannot be added to the selection

#### Scenario: Scheduled rows not selectable
- **WHEN** a maintenance row has implemented status Scheduled
- **THEN** its row checkbox is disabled

#### Scenario: Select all pending only
- **WHEN** user checks the header checkbox on a page containing both Pending and Implemented rows
- **THEN** only Pending rows on that page are selected

#### Scenario: Selection cleared on ineligible rows
- **WHEN** user searches or changes page after selecting rows
- **THEN** any previously selected Implemented or Scheduled row keys are removed from the selection

### Requirement: Auto implement respects effective session (§11)
When a movement category has auto implement enabled and an application is approved, the system SHALL use the same effective-session gate as manual maintenance implement: immediate profile apply only when current session equals effective session, otherwise Scheduled.

#### Scenario: Auto implement deferred
- **WHEN** an approved application belongs to a category with auto implement enabled
- **AND** current application session does not equal effective session
- **THEN** the record is set to implemented Scheduled without immediate profile changes

### Requirement: Export and delete maintenance rows
The system SHALL support export and delete actions on the maintenance list.

#### Scenario: Export maintenance list
- **WHEN** user clicks Export
- **THEN** the system triggers an export consistent with other student-records list pages

#### Scenario: Delete selected rows
- **WHEN** user selects rows and clicks Delete
- **THEN** the system shows a confirmation dialog
- **AND** on confirm removes the selected records from the corresponding movement store lists

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

## MODIFIED Requirements

### Requirement: Movement maintenance search
The system SHALL provide search filters for the maintenance list using Academic Session as a dropdown of distinct application session values, Programme Code, status, student ID, and student name. The Movement Reason search field SHALL NOT be shown. In Chinese UI the academic session label SHALL display 学年学期.

#### Scenario: Academic session dropdown on maintenance
- **WHEN** user views the maintenance search area
- **THEN** Academic Session is a dropdown populated from distinct application session values on the maintenance queue

#### Scenario: Search filters list
- **WHEN** user filters by academic session, programme code, status, student ID, or student name and clicks Search
- **THEN** the list shows only matching rows and resets to page 1

#### Scenario: No movement reason search
- **WHEN** user views the maintenance search area
- **THEN** the system does not display a Movement Reason search input

#### Scenario: Programme code next to academic session
- **WHEN** user views the maintenance search area
- **THEN** the Programme Code input appears immediately after the Academic Session input

#### Scenario: Filter by programme code
- **WHEN** user enters a programme code keyword and clicks Search
- **THEN** the list shows only rows whose resolved programme code matches the keyword

#### Scenario: Reset search
- **WHEN** user clicks Reset
- **THEN** all search fields clear and the full maintenance list is restored

#### Scenario: Academic session search label in Chinese
- **WHEN** user views the maintenance search area in Chinese UI
- **THEN** the academic session field label displays 学年学期

### Requirement: Maintenance list table columns and read-only actions
The system SHALL display a streamlined maintenance table without Edit or Modify Movement Number actions. The Implemented column SHALL display Y or N (Scheduled displays N until Implemented). Passport/IC values in the list SHALL be masked. The table SHALL NOT show columns for CGPA, English name, expected graduation time, movement number, remark, or current/new school and programme fields; those programme fields SHALL remain visible in Details. The toolbar SHALL provide Implement, Export, and Delete only. Row actions SHALL provide Details and Approval log only.

#### Scenario: No edit or modify number
- **WHEN** user views the maintenance list
- **THEN** the toolbar does not show Modify Movement Number and row actions do not include Edit

#### Scenario: Implemented Y/N on list
- **WHEN** user views the Implemented column
- **THEN** Implemented status displays Y
- **AND** Pending and Scheduled statuses display N

#### Scenario: Masked passport in list
- **WHEN** user views the Passport/IC column
- **THEN** values are partially masked using the shared maskPassportIc helper

#### Scenario: Programme fields in details only
- **WHEN** user opens Details for a programme transfer row
- **THEN** current and new school/programme fields are visible in the read-only detail view even though they are not list columns

#### Scenario: Masked passport in maintenance details
- **WHEN** user opens Details from the maintenance list
- **THEN** student and parent NRIC/Passport fields in the detail view use the same masking as the list

#### Scenario: Masked passport in maintenance export
- **WHEN** user exports from the maintenance list
- **THEN** Passport/IC column values in the export file are masked and Implemented uses Y/N

#### Scenario: View details
- **WHEN** user clicks Details on a row
- **THEN** the system opens the same read-only application review view used on the approval page without approval controls

#### Scenario: View approval log
- **WHEN** user clicks Approval log on a row
- **THEN** the system opens the approval log modal with that record's approval history

## REMOVED Requirements

### Requirement: Modify movement numbers
**Reason**: Product removed movement number editing from the maintenance workspace.
**Migration**: Remove toolbar button, number modal wiring, and movement number list column.

### Requirement: Edit maintenance fields from list
**Reason**: Maintenance module is read-only except Implement and Delete.
**Migration**: Remove Edit row action and edit modal wiring from MovementMaintenanceView.

### Requirement: Wide table extended and trailing columns on list
**Reason**: §8 streamlined table; school/programme columns are details-only; CGPA, English, movement number, and remark removed from list.
**Migration**: Update table template and maintenance export field list.

### Requirement: Implemented text labels on maintenance list
**Reason**: Product requires Y/N display aligned with approval History tab.
**Migration**: Use formatImplementedYn in list and maintenance export.

### Requirement: Maintenance list status badges match application styling
The system SHALL render status badges on the maintenance list using the same pill styling and color tokens as the four movement application list pages.

#### Scenario: Status badge uses shared stylesheet
- **WHEN** the maintenance list displays a status badge
- **THEN** the badge uses movement-status-badge.css with pill border radius and light-background color tokens matching application lists

#### Scenario: Expired status styling
- **WHEN** a maintenance row has status Expired
- **THEN** the badge uses the status-expired class

#### Scenario: No white-text override on maintenance badges
- **WHEN** the maintenance list renders status badges
- **THEN** scoped page styles do not force white text on status badges
