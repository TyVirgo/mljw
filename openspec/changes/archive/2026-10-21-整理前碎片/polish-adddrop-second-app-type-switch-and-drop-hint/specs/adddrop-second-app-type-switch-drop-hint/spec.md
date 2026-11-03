## ADDED Requirements

### Requirement: Second-application lock leaves only primary type switchable

When the selected primary application type is blocked by a self-submitted pending application of the same primary type, the form SHALL keep the primary-type control switchable and SHALL disable other form controls in the modal body (including need-drop radios and course pick actions). Submit SHALL remain disabled while the blocked type is selected.

#### Scenario: Switch away from blocked primary type

- **WHEN** the student has a self-submitted pending Add (or AddDrop) application and the form primary type is Add
- **THEN** the primary-type select remains usable
- **AND** need-drop and course pick controls are not usable
- **AND** when the student switches primary type to Drop (with no pending Drop), the pending-blocked message clears and form ops and submit become available again

### Requirement: Second-application gate uses three primary types

The second-application mutual exclusion SHALL treat primary types as Add, Drop, and Retake only. Linked AddDrop counts as Add; RetakeDrop counts as Retake; standalone Drop does not share the gate with Add or Retake.

#### Scenario: Pending Add does not block Drop

- **WHEN** the student has a self-submitted pending AddDrop application and selects primary type Drop
- **THEN** the same-primary-type pending blocked message is not shown for Drop
- **AND** Drop form ops are not disabled solely because of the pending AddDrop

### Requirement: Drop form hides approval-queue hint callout

When the form action is standalone Drop, the student application modal MUST NOT show the drop-form approval-queue hint callout (former `dropFormApprovalHint` banner).

#### Scenario: Drop primary has no approval hint banner

- **WHEN** the student selects primary type Drop in the application modal
- **THEN** the blue callout text about entering the approval queue after drop submit is not displayed
