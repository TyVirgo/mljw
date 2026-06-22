## MODIFIED Requirements

### Requirement: Undeveloped movement and study plan pages
The system SHALL show the in-app under-construction page for menu items that are not yet developed.

#### Scenario: Undeveloped movement submenu
- **WHEN** user selects Status Change Inquiry or Status Change Statistics
- **THEN** the system shows the under-construction page with a back action to Student Basic Information

#### Scenario: Change category is developed
- **WHEN** user selects Change Category in the sidebar
- **THEN** the system displays the movement category configuration list page instead of the under-construction page

#### Scenario: Informed consent form is developed
- **WHEN** user selects Informed Consent Form in the sidebar
- **THEN** the system displays the consent form configuration list page instead of the under-construction page

#### Scenario: Status change maintenance is developed
- **WHEN** user selects Status Change Maintenance in the sidebar
- **THEN** the system displays the movement maintenance list page instead of the under-construction page

#### Scenario: Undeveloped study plan submenu
- **WHEN** user selects Personal Curriculum Plan
- **THEN** the system shows the under-construction page with a back action to Student Basic Information

## ADDED Requirements

### Requirement: Movement maintenance registered as developed page
The system SHALL register `sr-movement-maintenance` as a developed student-records page.

#### Scenario: Sidebar navigation
- **WHEN** user selects Status Change Maintenance under Student Status Change
- **THEN** the sidebar highlights Status Change Maintenance
- **AND** the main content renders MovementMaintenanceView

#### Scenario: Breadcrumb
- **WHEN** user is on the Status Change Maintenance page
- **THEN** the breadcrumb displays the Student Status Change group label and the Status Change Maintenance page label
