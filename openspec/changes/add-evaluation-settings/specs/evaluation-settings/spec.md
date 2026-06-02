## ADDED Requirements

### Requirement: Evaluation Settings page layout matches configuration prototype
The system SHALL display Evaluation Settings as a single-page configuration form without search, filter, or pagination controls.

#### Scenario: Page sections
- **WHEN** user navigates to Evaluation Settings
- **THEN** the system shows, in order: a global information banner, a New Lecturer section, a Change in Lecturer Category section, a "+ Create" control, and a bottom-right Save button

#### Scenario: No query or search
- **WHEN** user views Evaluation Settings
- **THEN** the system does not display search fields, query buttons, or list/table retrieval controls

### Requirement: Global evaluation information banner
The system SHALL display a prominent information banner describing that new lecturer hire or lecturer category change can trigger teacher evaluation requirements.

#### Scenario: English banner
- **WHEN** locale is English
- **THEN** the banner text reads equivalent to: "New lecturer or lecturer category change triggers the requirement for a prompt teacher evaluation."

#### Scenario: Chinese banner
- **WHEN** locale is Chinese
- **THEN** the banner text reads equivalent to: "新入职教师或教师类型变更会触发教师评估需求。"

### Requirement: New Lecturer global evaluation toggle
The system SHALL provide a New Lecturer section with a descriptive label and a global enable/disable toggle controlling whether new lecturers without any teaching record require evaluation.

#### Scenario: New lecturer definition
- **WHEN** evaluation rules are applied in mock/demo mode
- **THEN** a lecturer qualifies as "new lecturer" only if they have a join date (`dateOfJoining`) and have no teaching record (`hasTeachingRecord` is false or equivalent mock field)

#### Scenario: Section content English
- **WHEN** locale is English
- **THEN** the section title is "New Lecturer" and the description reads equivalent to: "New lecturers without any teaching experience are required to undergo teacher evaluation."

#### Scenario: Section content Chinese
- **WHEN** locale is Chinese
- **THEN** the section title is "新入职教师" and the description reads equivalent to: "新入职且无教学经验的教师，需进行教师评估。"

#### Scenario: Toggle placement
- **WHEN** the New Lecturer section is rendered
- **THEN** the enable/disable toggle appears on the right side of the section row

### Requirement: Category change evaluation rules
The system SHALL allow administrators to define one or more lecturer category change rules. Each rule SHALL include: source category (Category change from / 教师由), target category (to / 变更为), a Delete action, and an enable/disable toggle for that rule.

#### Scenario: Rule row English template
- **WHEN** locale is English and a rule row is displayed
- **THEN** the row reads equivalent to: "Category change from [dropdown] to [dropdown] requires teacher evaluation for providing information." with Delete and a rule toggle on the right

#### Scenario: Rule row Chinese template
- **WHEN** locale is Chinese and a rule row is displayed
- **THEN** the row reads equivalent to: "教师由 [dropdown] 变更为 [dropdown] ，需进行评估。" with 删除 and a rule toggle on the right

#### Scenario: Category dropdown options
- **WHEN** user opens a category dropdown in a rule row
- **THEN** options match lecturer Category values (Full-time Lecturer, China Seconded Lecturer, Student Teaching Assistant, Part-time Lecturer)

#### Scenario: Default mock rules
- **WHEN** user opens Evaluation Settings for the first time with no saved configuration
- **THEN** the system preloads sample rules matching the prototype: Part-time Lecturer → Full-time Lecturer (enabled) and Student Teaching Assistant → Full-time Lecturer (enabled)

### Requirement: Create and delete category change rules
The system SHALL allow adding new category change rules via "+ Create" / "+ 新增" and removing existing rules via Delete / 删除.

#### Scenario: Add rule
- **WHEN** user clicks "+ Create"
- **THEN** the system appends a new editable rule row with empty from/to selections and enabled toggle defaulting to on

#### Scenario: Delete rule with confirmation
- **WHEN** user clicks Delete on a rule row
- **THEN** the system shows a confirmation dialog before removing that rule from the pending configuration

#### Scenario: Cancel delete
- **WHEN** user clicks Delete and then cancels the confirmation dialog
- **THEN** the rule row remains unchanged

### Requirement: Save evaluation settings
The system SHALL persist evaluation settings when the user clicks Save / 保存 and provide success feedback.

#### Scenario: Validation on save
- **WHEN** user clicks Save and any enabled rule has missing from/to, identical from and to, or duplicates another enabled rule pair
- **THEN** the system blocks save and displays a validation message

#### Scenario: Successful save
- **WHEN** user clicks Save with valid configuration
- **THEN** the system persists settings (mock/local storage in v1) and shows a success indication

#### Scenario: Save button placement
- **WHEN** the page is rendered
- **THEN** the Save button appears as a primary action aligned to the bottom-right of the page card

### Requirement: Apply rules to lecturer evaluation flags (lightweight demo)
The system MAY apply saved evaluation settings to lecturer `requiresEvaluation` flags using simplified mock logic so Lecturer Information can demonstrate the effect; full rule-engine accuracy is not required in v1.

#### Scenario: New lecturer rule applied
- **WHEN** New Lecturer evaluation is enabled, settings are saved, and a lecturer has a join date with no teaching record
- **THEN** that lecturer may be marked `requiresEvaluation: true` in mock data

#### Scenario: Category change rule applied
- **WHEN** an enabled category change rule matches a lecturer's mock `previousCategory` → current `category` pair
- **THEN** that lecturer may be marked `requiresEvaluation: true`

#### Scenario: Rules reflected in list
- **WHEN** user navigates to Lecturer Information after saving settings
- **THEN** lecturers marked in mock data show the Requires Evaluation tag and appear when the evaluation filter toggle is enabled
