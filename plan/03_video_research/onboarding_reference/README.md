# onboarding_reference

Local visual reference set for first-run onboarding flow from the external app studied in `03_video_research`.

## Source

- Canonical export folder: `/Users/luis/exportOnBoarding`
- Files: `IMG_5643.png` through `IMG_5664.png`
- Ordering rule: filename ascending (trusted export order)

## Contents

- `00_filename_mapping.csv`: source export file -> integrated screenshot filename mapping.
- `01_first_run_onboarding_sequence.md`: sequence policy and usage guidance.
- `02_screen_by_screen_observations.md`: detailed textual description of each screen and interaction behavior.
- `screenshots/`: converted JPEG files named with source and order:
  - `IMG_5643_onboarding_00.jpeg` ... `IMG_5664_onboarding_21.jpeg`

## What To Trust for Planning

1. Trust filename order for deterministic sequence indexing.
2. Trust `02_screen_by_screen_observations.md` for step meaning, behavior, and branching notes.
3. Do not infer semantics from screenshot filename suffixes outside these docs.

## Git Policy

Screenshot image files are intentionally ignored in git to keep repository size small.
Markdown and mapping files are committed as planning artifacts.
