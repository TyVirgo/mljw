## ADDED Requirements

### Requirement: Picker credit strip reflects all three intent lists

While any course picker (add, drop, or retake) is open, the term credit strip projection SHALL include form drop lines, form add lines, and form retake lines together, with the active picker's selection replacing only that picker's side of the form lists.

#### Scenario: Add picker includes form retakes

- **WHEN** the student has retake lines on the form and opens the add course picker
- **THEN** the picker credit strip counts those retake credits as added alongside the currently selected add courses and subtracts form drop lines

#### Scenario: Retake picker includes form adds

- **WHEN** the student has add lines on the form and opens the retake course picker
- **THEN** the picker credit strip counts those add credits alongside currently selected retake courses and subtracts form drop lines

#### Scenario: Drop picker includes form adds and retakes

- **WHEN** the student has add and/or retake lines on the form and opens the drop picker
- **THEN** the picker credit strip subtracts the currently selected drops and still adds form add and retake credits

### Requirement: Term credit gate uses three-way linkage

Term credit max and GE term cap checks in the picker SHALL treat form lines from the other add-side (add vs retake) as already committed add credits when evaluating a candidate row.

#### Scenario: Form retake blocks excess add under term max

- **WHEN** form retake credits plus a candidate add would exceed the term credit max without whitelist bypass
- **THEN** that candidate add row is blocked in the add picker
