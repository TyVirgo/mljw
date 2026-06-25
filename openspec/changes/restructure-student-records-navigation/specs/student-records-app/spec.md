## MODIFIED Requirements

### Requirement: Student Records sidebar grouped menu
The system SHALL provide a grouped sidebar menu with two top-level expandable sections: Student Records Management and Student Status Change. The Personal Study Plan section SHALL NOT be displayed in the current phase.

#### Scenario: Management group items
- **WHEN** user expands the Student Records Management group in the sidebar
- **THEN** the system lists Student Basic Information as the only child item

#### Scenario: Movement group items
- **WHEN** user expands the Student Status Change group in the sidebar
- **THEN** the system lists Change Category, Informed Consent Form, Status Change Application, Status Change Approval, Status Change Maintenance, Status Change Inquiry, and Status Change Statistics in that order

#### Scenario: Personal study plan group not shown
- **WHEN** user opens the Student Records Application sidebar
- **THEN** the system does not display a Personal Study Plan group or Personal Curriculum Plan menu item

#### Scenario: Family Info removed
- **WHEN** user opens the Student Records Application sidebar
- **THEN** the system does not display a Family Info menu item

#### Scenario: Four movement types not in sidebar
- **WHEN** user opens the Student Records Application sidebar
- **THEN** Programme Transfer, Deferment, Resumption, and Withdrawal are not listed as separate sidebar items

### Requirement: Student basic information menu label
The system SHALL display the student profile list page under the menu label Student Basic Information.

#### Scenario: Chinese menu label
- **WHEN** user sets the application language to Chinese
- **THEN** the Student Records Management child menu displays「学生基本信息」

#### Scenario: English menu label
- **WHEN** user sets the application language to English
- **THEN** the Student Records Management child menu displays "Student Basic Information"

#### Scenario: Navigation to profile list
- **WHEN** user selects Student Basic Information in the sidebar
- **THEN** the system displays the existing Student Profile list page

### Requirement: Default landing unchanged
The system SHALL continue to land on the student profile list page when opening the Student Records Application from the portal.

#### Scenario: Portal open
- **WHEN** user opens the Student Records Application from the Academic Portal
- **THEN** the main content displays the Student Profile list page and the Student Basic Information menu item is active

### Requirement: Sidebar uses expandable groups like Basic Data
The system SHALL render student-records sidebar groups with expand/collapse behavior consistent with the Basic Data application.

#### Scenario: Default expanded groups
- **WHEN** user first opens the Student Records Application
- **THEN** the Student Records Management and Student Status Change sidebar groups are expanded by default

#### Scenario: Breadcrumb for grouped leaf
- **WHEN** user selects Status Change Application
- **THEN** the breadcrumb shows the module name, the Student Status Change group label, and the Status Change Application page label

### Requirement: Undeveloped movement pages
The system SHALL show the in-app under-construction page for menu items that are not yet developed.

#### Scenario: Undeveloped movement submenu
- **WHEN** user selects Change Category, Informed Consent Form, Status Change Approval, Status Change Maintenance, Status Change Inquiry, or Status Change Statistics
- **THEN** the system shows the under-construction page with a back action to Student Basic Information

## REMOVED Requirements

### Requirement: Undeveloped study plan submenu
**Reason**: Personal Curriculum Plan is out of scope for the current phase; the entire Personal Study Plan group is removed from the sidebar.
**Migration**: Reintroduce via a future change when the personal curriculum feature is implemented.

## ADDED Requirements

### Requirement: Status change application page with top tabs
The system SHALL provide a Status Change Application page that hosts Programme Transfer, Deferment, Resumption, and Withdrawal as horizontal tabs at the top of the content area.

#### Scenario: Open from sidebar
- **WHEN** user selects Status Change Application in the sidebar
- **THEN** the system displays the movement application shell with four tabs: Programme Transfer, Deferment, Resumption, and Withdrawal

#### Scenario: Default tab is deferment
- **WHEN** user opens Status Change Application for the first time in a session
- **THEN** the Deferment tab is active by default

#### Scenario: Switch tab to programme transfer
- **WHEN** user clicks the Programme Transfer tab
- **THEN** the system displays the existing Programme Transfer list and workflows within the same page without navigating away from Status Change Application

#### Scenario: Switch tab to resumption
- **WHEN** user clicks the Resumption tab
- **THEN** the system displays the existing Resumption list and workflows within the same page

#### Scenario: Switch tab to withdrawal
- **WHEN** user clicks the Withdrawal tab
- **THEN** the system displays the existing Withdrawal list and workflows within the same page

#### Scenario: Tab state preserved when switching
- **WHEN** user switches from Deferment to another tab and back to Deferment without leaving Status Change Application
- **THEN** the Deferment list state from the current session is preserved

#### Scenario: Movement modules retain existing behavior
- **WHEN** user performs create, edit, approve, cancel, or workflow log actions within any tab
- **THEN** the embedded movement module behaves the same as before this navigation restructure

### Requirement: Status change application tab styling
The system SHALL style movement application tabs to match the production reference with a horizontal tab bar and active tab underline.

#### Scenario: Active tab indicator
- **WHEN** a tab is selected
- **THEN** the active tab displays a visible underline or equivalent active state distinct from inactive tabs

#### Scenario: Tabs above module content
- **WHEN** user views Status Change Application
- **THEN** the tab bar appears above the embedded movement module content area
