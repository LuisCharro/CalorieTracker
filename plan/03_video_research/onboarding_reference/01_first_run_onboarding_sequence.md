# 01 — First-Run Onboarding Sequence (Visual Reference)

Purpose: keep a stable, reproducible onboarding screenshot sequence from the latest export and pair it with written behavioral analysis.

## Current Source of Truth

- Export folder: `/Users/luis/exportOnBoarding`
- Ordered input files: `IMG_5643.png` to `IMG_5664.png`
- Integration output files: `IMG_5643_onboarding_00.jpeg` to `IMG_5664_onboarding_21.jpeg`
- Mapping file: `00_filename_mapping.csv`
- Detailed behavioral interpretation: `02_screen_by_screen_observations.md`

## Sequence Handling Rule

- Keep screenshot filenames neutral and ordered.
- Store semantic meaning in markdown, not in image names.
- If interpretation changes, update `02_screen_by_screen_observations.md` without renaming raw evidence files.

## Planning Usage

1. Use order index (`00..21`) for deterministic references in discussions and tickets.
2. Use `02_screen_by_screen_observations.md` to understand:
- core vs branch screens,
- system modal vs in-app UI,
- permission and paywall interactions.
3. Align resulting product decisions with:
- `02_architecture_gdpr/25_FINAL_product_navigation_and_user_flows.md`
- `05_quality_automation/02_frontend_e2e_matrix.md`

## Testing Implication

When creating E2E scenarios, include at least:
1. Apple Health pre-permission screen -> native modal -> return flow.
2. Location/Notifications opt-in and opt-out variants.
3. Branch entry/exit around widget and paywall screens.
