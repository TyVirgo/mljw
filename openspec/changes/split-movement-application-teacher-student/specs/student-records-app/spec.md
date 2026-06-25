## MODIFIED Requirements

### Requirement: Student Records sidebar movement application entry
The system SHALL register two developed sidebar entries for movement application instead of a single undifferentiated entry.

#### Scenario: Teacher entry developed
- **WHEN** user clicks the staff status change application menu item
- **THEN** the system navigates to `sr-movement-application-teacher` and renders the movement application shell in teacher mode

#### Scenario: Student entry developed
- **WHEN** user clicks the student status change application menu item
- **THEN** the system navigates to `sr-movement-application-student` and renders the movement application shell in student mode

#### Scenario: Breadcrumb for teacher entry
- **WHEN** user is on the staff movement application page
- **THEN** breadcrumb shows Student Status Change group followed by the management-side menu label (学籍异动申请（管理端） in Chinese UI)

#### Scenario: Breadcrumb for student entry
- **WHEN** user is on the student movement application page
- **THEN** breadcrumb shows Student Status Change group followed by the student menu label

## REMOVED Requirements

### Requirement: Single movement application sidebar page id
**Reason**: Split into teacher and student portals with distinct page identifiers and labels.
**Migration**: Replace `sr-movement-application` in menu config, App.vue routing, and developed pages with `sr-movement-application-teacher` and add `sr-movement-application-student`.

#### Scenario: Legacy page id not used in sidebar
- **WHEN** user views the Student Records sidebar
- **THEN** there is no undifferentiated single menu item labeled only "Status Change Application" without staff/student qualifier
