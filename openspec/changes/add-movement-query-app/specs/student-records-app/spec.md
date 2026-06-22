## MODIFIED Requirements

### Requirement: Undeveloped movement and study plan pages
The system SHALL show the in-app under-construction page for menu items that are not yet developed.

#### Scenario: Undeveloped movement submenu
- **WHEN** user selects Status Change Statistics
- **THEN** the system shows the under-construction page with a back action to Student Basic Information

#### Scenario: Change category is developed
- **WHEN** user selects Change Category in the sidebar
- **THEN** the system displays the movement category configuration list page instead of the under-construction page

#### Scenario: Status change inquiry is developed
- **WHEN** user selects Status Change Inquiry in the sidebar
- **THEN** the system displays the movement query list page instead of the under-construction page

#### Scenario: Undeveloped study plan submenu
- **WHEN** user selects Personal Curriculum Plan
- **THEN** the system shows the under-construction page with a back action to Student Basic Information

## ADDED Requirements

### Requirement: Status change inquiry registered as developed page
The system SHALL register `sr-movement-query` as a developed student-records page.

#### Scenario: Sidebar navigation
- **WHEN** user selects Status Change Inquiry under Student Status Change
- **THEN** the sidebar highlights Status Change Inquiry
- **AND** the main content renders MovementQueryView

#### Scenario: Breadcrumb
- **WHEN** user is on the Status Change Inquiry page
- **THEN** the breadcrumb displays the Student Status Change group label and the inquiry page label
