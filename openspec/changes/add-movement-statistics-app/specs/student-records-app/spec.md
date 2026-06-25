## MODIFIED Requirements

### Requirement: Undeveloped movement and study plan pages
The system SHALL show the in-app under-construction page for menu items that are not yet developed.

#### Scenario: Change category is developed
- **WHEN** user selects Change Category in the sidebar
- **THEN** the system displays the movement category configuration list page instead of the under-construction page

#### Scenario: Status change inquiry is developed
- **WHEN** user selects Status Change Inquiry in the sidebar
- **THEN** the system displays the movement query list page instead of the under-construction page

#### Scenario: Status change statistics menu hidden
- **WHEN** user views the Student Status Change sidebar group
- **THEN** Status Change Statistics is not shown as a menu item in this release

#### Scenario: Undeveloped study plan submenu
- **WHEN** user selects Personal Curriculum Plan
- **THEN** the system shows the under-construction page with a back action to Student Basic Information

## REMOVED Requirements

### Requirement: Status change statistics registered as developed page
**Reason**: Product deferred the statistics menu entry for this release; implementation remains in codebase for a future enablement change.
**Migration**: Remove `sr-movement-statistics` from sidebar menu and `studentRecordsDevelopedPages`; keep MovementStatisticsView source files.
