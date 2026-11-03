## ADDED Requirements

### Requirement: Student add-drop list has no bill search filter

The student add/drop application list search panel SHALL NOT include a bill status filter.

#### Scenario: Bill filter absent on student list

- **WHEN** a student opens the add/drop application list
- **THEN** there is no bill status dropdown in the search area

### Requirement: Term accumulated credits emphasize the numeric score

On My Courses, the term accumulated credits label SHALL be bold and one font size larger than before, and the numeric credits portion SHALL use red text.

#### Scenario: Score portion is red

- **WHEN** the toolbar shows term accumulated credits
- **THEN** the credits number and unit are displayed in red while the label prefix remains bold with the enlarged size

### Requirement: Retake type first hint is not shown

The add/drop application form SHALL NOT show the hint telling users to select retake type before selecting courses.

#### Scenario: Hint removed from retake section

- **WHEN** the student opens the application form with retake intent
- **THEN** the retake-type-first hint paragraph is not visible

### Requirement: Application common fields use four columns in one row

SECTION I application common fields (academic session and three intent flags) SHALL display as four fields in one row with reasonable gaps when viewport allows.

#### Scenario: Four fields share one row

- **WHEN** viewing the application form on a wide viewport
- **THEN** academic session, need drop, need add, and need retake appear on the same row
