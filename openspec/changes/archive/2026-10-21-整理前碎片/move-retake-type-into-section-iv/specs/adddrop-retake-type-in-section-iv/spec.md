## ADDED Requirements

### Requirement: Retake type sits first in SECTION IV

When the student selects need-retake yes, the retake-type required select SHALL appear as the first field inside the Course Retake (SECTION IV) block, not in the common application-info grid above student information.

#### Scenario: Need retake reveals type inside section IV

- **WHEN** need-retake is yes
- **THEN** SECTION IV is shown and its first row is the retake-type dropdown
- **AND** the common application-info area does not show the retake-type control
