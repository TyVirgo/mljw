## ADDED Requirements

### Requirement: Three independent supplementary notes

Add/drop/retake form sections SHALL show distinct labels「退课补充说明」「加课补充说明」「重修补充说明」bound to independent fields (`dropReason`, `addNotes`, `retakeNotes`). Editing one MUST NOT change another.

#### Scenario: Fill add and retake notes separately
- **WHEN** the student enters text in 加课补充说明 and different text in 重修补充说明
- **THEN** both values persist independently on submit and detail

### Requirement: Retake detail shows retake notes under section IV summary
Detail SECTION IV SHALL display 重修补充说明 under retake type / billable credits (not only after the fee box). Legacy retake-only apps with only `addNotes` MAY show that value as the retake notes.

#### Scenario: Combined application with retakeNotes
- **WHEN** viewing an application that has `retakeNotes`
- **THEN** SECTION IV shows that text under the retake summary fields

### Requirement: Second-application tip under estimate tip and scrollable body
When a pending application blocks a new submit, the blocked message SHALL appear on the line below the credit-strip pending-estimate tip. The form body SHALL remain vertically scrollable while inputs stay non-editable.

#### Scenario: Blocked form still scrolls
- **WHEN** `primaryTypePendingBlocked` is true
- **THEN** the user can scroll the form content and see the blocked tip under the estimate tip
