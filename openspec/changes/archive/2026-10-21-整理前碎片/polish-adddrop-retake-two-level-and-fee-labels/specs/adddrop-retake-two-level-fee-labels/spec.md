## ADDED Requirements

### Requirement: Retake selection is two-level from original transcript courses

For failed or grade-improvement retake types, the form SHALL list matching transcript original courses and provide an action to open a picker of only the retake offerings allowed for that original course.

#### Scenario: Pick retake from a failing original

- **WHEN** retake type is failed and the student clicks select-retake-course on a failing transcript row
- **THEN** the course picker shows only retake candidates linked to that original (same course and/or group substitutes)

### Requirement: Retake lines table has no latest-grade column

The application form retake lines table SHALL NOT include a latest-grade column.

### Requirement: Separate add and retake fee short fields without SST inputs

The add section SHALL show an add-only estimated fee label and SHALL NOT show an SST input field. The retake section SHALL show a retake-only estimated fee label, rename total retake credits to include billing wording, and SHALL NOT show an SST input field.

### Requirement: Single fee estimate box lists add retake and SST totals

A single fee estimate panel SHALL list add fee total, retake fee total, and SST with the SST tip, plus a payable total.
