## ADDED Requirements

### Requirement: Portal displays Student Status Management card as available
The system SHALL show the student records portal card without an "under development" badge.

#### Scenario: Chinese portal label
- **WHEN** user views the Academic Portal with Chinese locale
- **THEN** the student records card title displays「学籍管理」

#### Scenario: English portal label
- **WHEN** user views the Academic Portal with English locale
- **THEN** the student records card title displays "Student Status Management"

#### Scenario: Card is available
- **WHEN** user views the student records card on the portal home
- **THEN** the card does not show the under-development badge

### Requirement: Portal opens Student Records Application shell
The system SHALL navigate from the portal into a dedicated Student Records admin shell when the user clicks the student records card.

#### Scenario: Open from portal
- **WHEN** user clicks the student records card on the Academic Portal
- **THEN** the system leaves the portal view and displays the Student Records Application layout with header, sidebar, breadcrumb, and main content area

#### Scenario: Default landing page
- **WHEN** user opens the Student Records Application from the portal
- **THEN** the main content area displays the Student Profile list page

#### Scenario: Return to portal
- **WHEN** user clicks "Back to Portal" in the Student Records Application header
- **THEN** the system returns to the Academic Portal home screen

### Requirement: Student Records Application shows module title
The system SHALL display the Student Records module name in the application header.

#### Scenario: Header module title
- **WHEN** user is inside the Student Records Application
- **THEN** the header title displays the localized Student Status Management module name (not Basic Data)

### Requirement: Student Records sidebar flat menu
The system SHALL provide a flat sidebar menu matching the prototype with six top-level items.

#### Scenario: Menu items listed
- **WHEN** user opens the Student Records Application
- **THEN** the sidebar lists Student Profile, Family Info, Programme Transfer, Deferment, Resumption, and Withdrawal in that order

#### Scenario: Student Profile navigation
- **WHEN** user selects Student Profile in the sidebar
- **THEN** the system displays the Student Profile list page

#### Scenario: Undeveloped menu page
- **WHEN** user selects Family Info, Programme Transfer, Deferment, Resumption, or Withdrawal
- **THEN** the system shows the in-app under-construction page with a back action to Student Profile

### Requirement: Student Records app matches Basic Data shell styling
The system SHALL reuse the same admin shell components and visual patterns as the Basic Data application.

#### Scenario: Shared layout components
- **WHEN** user is in the Student Records Application
- **THEN** the layout uses the same HeaderBar, Sidebar, and PageBreadcrumb components as Basic Data with student-records menu configuration

#### Scenario: Sidebar active state styling
- **WHEN** user selects a menu item in the Student Records sidebar
- **THEN** the active item uses the same highlight styling as Basic Data sidebar items

### Requirement: Student Records app is isolated from Basic Data menu
The system SHALL NOT show Basic Data menu items when the user is in the Student Records Application.

#### Scenario: Sidebar isolation
- **WHEN** `appView` is student-records
- **THEN** the sidebar renders only student-records menu items from `studentRecordsMenu.js`, not items from `menu.js`
