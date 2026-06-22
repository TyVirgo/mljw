## MODIFIED Requirements

### Requirement: Undeveloped movement and study plan pages
The system SHALL show the in-app under-construction page for menu items that are not yet developed.

#### Scenario: Undeveloped movement submenu
- **WHEN** user selects Informed Consent Form, Status Change Maintenance, Status Change Inquiry, or Status Change Statistics
- **THEN** the system shows the under-construction page with a back action to Student Basic Information

#### Scenario: Change category is developed
- **WHEN** user selects Change Category in the sidebar
- **THEN** the system displays the movement category configuration list page instead of the under-construction page

#### Scenario: Undeveloped study plan submenu
- **WHEN** user selects Personal Curriculum Plan
- **THEN** the system shows the under-construction page with a back action to Student Basic Information

## ADDED Requirements

### Requirement: Change category registered as developed page
The system SHALL register `sr-movement-category` as a developed student-records page alongside Student Basic Information, Status Change Application, and Status Change Approval.

#### Scenario: Sidebar navigation
- **WHEN** user selects Change Category under Student Status Change
- **THEN** the sidebar highlights Change Category
- **AND** the main content renders MovementCategoryView

#### Scenario: Breadcrumb
- **WHEN** user is on the Change Category page
- **THEN** the breadcrumb displays the Student Status Change group label and the Change Category page label
