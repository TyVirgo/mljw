## MODIFIED Requirements

### Requirement: Consent form list page
The system SHALL display a paginated informed consent form configuration table under the Informed Consent Form menu with columns: selection checkbox, serial number, form name, applicable movement type, Student Type, Education Level, remark, and Actions including Edit and Version Snapshot only.

#### Scenario: Initial list with seed data
- **WHEN** user opens Informed Consent Form for the first time
- **THEN** the system displays pre-seeded template rows covering multiple movement types, Student Types, and Education Levels
- **AND** each seed row has a distinct non-empty remark for demonstration

#### Scenario: Search filters list
- **WHEN** user filters by applicable movement type, form name, Student Type, or Education Level and clicks Search
- **THEN** the list shows only matching rows and resets to page 1

#### Scenario: Reset search
- **WHEN** user clicks Reset
- **THEN** all search fields clear and the full list is restored

#### Scenario: Version Snapshot action label
- **WHEN** user views the Actions column on a consent form list row
- **THEN** the actions show Edit and Version Snapshot only
- **AND** no View action is displayed

### Requirement: Create and edit consent form templates
The system SHALL provide separate Create and Edit behaviors in the consent form modal. Create SHALL collect form name, applicable movement type, Student Type, Education Level, and optional remark in a two-row two-column layout without effective academic session or file upload fields. Edit SHALL allow changing only form name and remark.

#### Scenario: Open create form layout
- **WHEN** user clicks Create on the list page
- **THEN** the system opens the modal with five fields: form name, applicable movement type, Student Type, Education Level, and remark arranged in two rows and two columns plus remark
- **AND** the modal does not show effective academic session dropdown
- **AND** the modal does not show student or parent consent file upload controls

#### Scenario: Create does not require consent files or academic session
- **WHEN** user submits Create with all required metadata fields
- **THEN** the system saves the configuration row successfully without creating a version snapshot entry

#### Scenario: Create leaves versions empty
- **WHEN** user saves a new consent form configuration successfully
- **THEN** the configuration row has an empty versions array
- **AND** the user can open Version Snapshot to add the first version

#### Scenario: Open edit form limited fields
- **WHEN** user clicks Edit on a consent form list row
- **THEN** the system opens the modal with editable form name and remark only

#### Scenario: Edit save does not append version snapshot
- **WHEN** user saves edits to form name or remark only
- **THEN** the system updates the configuration row metadata only
- **AND** does not append a new version snapshot entry

#### Scenario: Unique movement type student type and education level
- **WHEN** user saves a template that duplicates the same applicable movement type, Student Type, and Education Level combination
- **THEN** the system prevents save and shows a validation message

### Requirement: Consent form version history by academic session
The system SHALL provide a Version Snapshot action on each consent form list row that opens a modal for maintaining version snapshots scoped to that row's movement type, Student Type, and Education Level. The Add Version control SHALL appear above the snapshot table on the left. Each version snapshot SHALL have an effective academic session in YYYY/MM format, student and parent consent file metadata, update metadata, and a globally exclusive Apply control implemented as a YnSwitch toggle.

#### Scenario: Open version snapshot from list row
- **WHEN** user clicks Version Snapshot on a consent form list row
- **THEN** the system opens a snapshot modal showing the row's movement type, Student Type, and Education Level as subtitle context
- **AND** displays an Add Version button above the table on the left
- **AND** lists version entries with effective academic session, changed by, attachments, updated at, and Apply YnSwitch

#### Scenario: Attachments column shows files with preview
- **WHEN** a version snapshot entry has student or parent consent file metadata
- **THEN** the attachments column displays each file name with a preview control

#### Scenario: Add version from snapshot modal
- **WHEN** user clicks Add Version in the version snapshot modal
- **THEN** the system opens a sub-modal with effective academic session, required student consent upload, optional parent consent upload, and an Apply Immediately toggle defaulting to off

#### Scenario: Apply immediately on add version
- **WHEN** user saves Add Version with Apply Immediately turned on
- **THEN** the new version entry is saved with isApplied true
- **AND** all other version entries on the same row have isApplied false

#### Scenario: Apply immediately off by default on add version
- **WHEN** user saves Add Version without turning on Apply Immediately
- **THEN** the new version entry is saved with isApplied false even when no other version is currently applied

#### Scenario: Student consent required when adding version
- **WHEN** user submits Add Version without a student consent file
- **THEN** the system prevents save and shows validation feedback

#### Scenario: Duplicate effective academic session on same row
- **WHEN** user adds a version whose effective academic session already exists on the same configuration row
- **THEN** the system prevents save and shows a validation message

#### Scenario: One globally applied version per configuration row
- **WHEN** user turns Apply on for a version snapshot entry using the table YnSwitch
- **THEN** the system sets isApplied true for that entry
- **AND** sets isApplied false for every other version entry on the same configuration row

## REMOVED Requirements

### Requirement: View consent form template
**Reason**: Product removed the list View action; configuration and attachments are maintained via Edit and Version Snapshot.
**Migration**: Remove View from list Actions and drop ConsentFormViewModal usage from ConsentFormView.

### Requirement: Save-driven version audit log on consent form save
**Reason**: Version snapshots are created only via Add Version in the snapshot modal; Create no longer seeds versions.
**Migration**: Remove appendVersionLog; createConsentForm writes empty versions array.

### Requirement: Read-only version history modal without file maintenance
**Reason**: Replaced by writable Version Snapshot modal with Add Version, attachment preview, and YnSwitch Apply column.
**Migration**: ConsentFormVersionHistoryModal with table-toolbar Add Version and YnSwitch.

#### Scenario: Effective academic session required on create
**Reason**: Effective academic session moved exclusively to Add Version sub-modal.
**Migration**: Remove effectiveAcademicSession from Create form and validateConsentFormForm create mode.

#### Scenario: Create seeds first version snapshot
**Reason**: Create only persists configuration metadata; versions start empty.
**Migration**: createConsentForm sets versions to empty array.

#### Scenario: New version default not applied when another is applied
**Reason**: Superseded by explicit Apply Immediately toggle defaulting off on Add Version.
**Migration**: addConsentFormVersion uses applyImmediately flag only.

## ADDED Requirements

### Requirement: Add consent form version from snapshot modal
The system SHALL allow administrators to add a new version snapshot entry from the Version Snapshot modal with a user-selected effective academic session, required student consent file upload, optional parent consent file upload, and an Apply Immediately toggle defaulting to off.

#### Scenario: Open add version sub-modal
- **WHEN** user clicks Add Version above the snapshot table
- **THEN** the system opens a sub-modal with effective academic session, student and parent consent uploads, and Apply Immediately toggle default off

#### Scenario: Save new version with files
- **WHEN** user selects effective academic session, uploads a student consent file, and saves Add Version
- **THEN** the system appends a new entry to the configuration row versions array
- **AND** refreshes the snapshot table to show the new row
