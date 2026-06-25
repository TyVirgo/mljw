## ADDED Requirements

### Requirement: Movement chain displays dates as dd.Mmm.YYYY
The system SHALL display calendar date fields across the student status change movement chain using the format dd.Mmm.YYYY with a zero-padded day, English three-letter month abbreviation, and four-digit year (e.g. `29.Sep.2025`) for list columns, readonly form and detail fields, approval views, maintenance and query tables, export files, and approval log entries.

#### Scenario: Application list application date
- **WHEN** user views the application date column on any of the four movement application list pages
- **THEN** each date is displayed as dd.Mmm.YYYY

#### Scenario: Form and detail readonly dates
- **WHEN** user views readonly date fields such as date of application, visa expiry, or last date of attendance on movement form or detail modals
- **THEN** values are displayed as dd.Mmm.YYYY

#### Scenario: Approval list application date
- **WHEN** user views the Application Date column on the movement approval list
- **THEN** dates are displayed as dd.Mmm.YYYY using the same formatting rules as the corresponding movement application list

#### Scenario: Maintenance and query movement date
- **WHEN** user views the movement date column on maintenance or query lists
- **THEN** dates are displayed as dd.Mmm.YYYY

#### Scenario: Approval log date column
- **WHEN** user opens Approval log for any movement record
- **THEN** each log entry dateTime is displayed as dd.Mmm.YYYY without a time component, including legacy seed values stored as DD.MM.YYYY HH:mm

#### Scenario: Export date columns
- **WHEN** user exports movement application, approval, maintenance, or query results including date fields to xlsx
- **THEN** exported date cell values use dd.Mmm.YYYY consistent with on-screen display

#### Scenario: Application academic session is excluded
- **WHEN** user views Application Academic Session (`applicationSession`) fields or columns
- **THEN** those values continue to use YYYY/MM academic session format and are not formatted as dd.Mmm.YYYY

### Requirement: Shared movement date formatter
The system SHALL centralize movement date display formatting in a shared helper used by movement application data modules, approval queue formatters, maintenance date display, export formatters, and approval log UI.

#### Scenario: Single formatter entry point
- **WHEN** any movement module needs to display a calendar date to the user
- **THEN** the module uses the shared formatMovementDate helper rather than ad hoc formatters

#### Scenario: ISO storage compatibility
- **WHEN** a movement record stores a date as an ISO date string or ISO datetime
- **THEN** formatMovementDate produces dd.Mmm.YYYY for display while storage values remain ISO-compatible

#### Scenario: Engine log storage uses ISO
- **WHEN** the approval engine appends a new approval log entry
- **THEN** the stored dateTime value uses YYYY-MM-DD via formatMovementDateIso for cycle comparison

### Requirement: Effective session column displays as YYYY/MM
The system SHALL display the Effective Session (`effectiveSession`) column across approval, maintenance, and query lists and exports using the academic session format YYYY/MM (e.g. `2025/09`), consistent within the column for all movement types.

#### Scenario: Programme transfer and deferment session values
- **WHEN** user views the Effective Session column for programme transfer or deferment records whose source fields use YYYY/MM (e.g. `startSemester`, `defermentPeriod`)
- **THEN** values are displayed as YYYY/MM unchanged

#### Scenario: Withdrawal derives session from attendance date
- **WHEN** user views the Effective Session column for a withdrawal record whose effective value is derived from `lastDateOfAttendance` stored as YYYY-MM-DD (e.g. `2025-09-20`)
- **THEN** the column displays `2025/09` rather than dd.Mmm.YYYY

#### Scenario: Export effective session column
- **WHEN** user exports approval, maintenance, or query results including the Effective Session column
- **THEN** exported cell values use YYYY/MM consistent with on-screen list formatting

#### Scenario: Movement date column uses dd.Mmm.YYYY
- **WHEN** user views the Movement Date column for the same withdrawal record
- **THEN** that column displays the calendar date as dd.Mmm.YYYY and is not converted to YYYY/MM

### Requirement: Academic session fields use YYYY/02, YYYY/04, or YYYY/09 only
The system SHALL treat Intake, Application Academic Session, and Effective Session as academic session values (not calendar dates), normalizing display and export to YYYY/MM where MM is one of 02, 04, or 09.

#### Scenario: List columns show valid session codes
- **WHEN** user views Intake, Application Academic Session, or Effective Session on approval, maintenance, or query lists
- **THEN** each value is displayed as YYYY/02, YYYY/04, or YYYY/09, or `—` when empty

#### Scenario: Application session does not fall back to calendar date
- **WHEN** a movement record has no applicationSession but has dateOfApplication
- **THEN** the Application Academic Session column does not display the calendar date

#### Scenario: Effective session from attendance date maps to semester code
- **WHEN** Effective Session is derived from lastDateOfAttendance stored as YYYY-MM-DD
- **THEN** the displayed value maps to YYYY/02, YYYY/04, or YYYY/09 rather than a calendar month such as YYYY/08

#### Scenario: Session chronological order
- **WHEN** intake, applicationSession, and effectiveSession are all present on a movement record
- **THEN** intake is not later than applicationSession and applicationSession is not later than effectiveSession

#### Scenario: Form submit validates session order
- **WHEN** staff or student submits a movement application with session fields that violate chronological order
- **THEN** submit validation fails with a field-level error
