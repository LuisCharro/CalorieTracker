# CalorieTracker_Plan

This folder is the **planning and research hub** for CalorieTracker.
It contains non-repo project knowledge, research artifacts, and decision documents.

## Folder Structure

## 99_local_secrets/
Local-only credentials and environment values for demo setup on this laptop.

Use this only for local demo operations. If deployment scope changes, rotate and migrate secrets to a proper secret manager.

## 01_research_foundation/
Early-stage research and synthesis focused on product learnings from the calorie-app space.

Contents:
- `00_README.md` — original research pack intro and scope
- `01_video_index.md` — chronological source index
- `02_learnings_synthesis.md` — consolidated learnings
- `03_product_decisions_checklist.md` — pre-build product checklist
- `04_risks_and_unknowns.md` — known risks and open questions
- `05_next_research_questions.md` — follow-up research queue

Use this folder when you want to understand **why** we made early assumptions.

## 02_architecture_gdpr/
Architecture, compliance, and execution-level planning docs (including Codex critical review).

### Core planning docs (active)
- `06_backend_architecture_options.md`
- `07_gdpr_for_calorietracker.md`
- `08_reuse_from_pdfextractorai.md`
- `09_recommended_stack_and_controls.md`
- `10_implementation_readiness_checklist.md`
- `11_codex_review_summary.md`
- `12_corrected_decisions_and_tradeoffs.md`
- `13_gaps_and_required_validations.md`
- `14_final_planning_brief_for_execution.md`

### FINAL canonical planning set (current)
- `25_FINAL_product_navigation_and_user_flows.md` — canonical MVP navigation, states, route guards, and flow contracts.
- `26_FINAL_data_model_and_database_plan_local_first.md` — canonical local-first, cloud-portable data model and DB rules.
- `27_FINAL_backend_hosting_and_portability_strategy.md` — canonical backend/hosting strategy and scaling triggers.
- `28_FINAL_execution_readiness_checklist.md` — canonical pre-coding go/no-go gate and readiness checklist.


### Recent execution logs
- `29_EXECUTION_LOG_phase1_local_setup_2026-02-15.md`
- `31_EXECUTION_LOG_phase2_backend_2026-02-15.md`
- `32_EXECUTION_LOG_phase3_e2e_integration_2026-02-15.md`
- `34_EXECUTION_LOG_phase4_ui_implementation_2026-02-15.md`
- `35_EXECUTION_LOG_phase5_e2e_validation_2026-02-15.md`
- `36_EXECUTION_LOG_quality_gate_alignment_2026-02-17.md`
- `37_EXECUTION_LOG_repo_state_sync_2026-02-17.md`
- `38_EXECUTION_LOG_loop_sync_2026-02-17.md`
- `39_EXECUTION_LOG_cycle2_backend_2026-02-17.md`
- `40_EXECUTION_LOG_cycle3_backend_2026-02-17.md`
- `41_EXECUTION_LOG_cycle3_frontend_2026-02-17.md`
- `42_EXECUTION_LOG_cycle4_backend_2026-02-17.md`
- `43_EXECUTION_LOG_cycle4_frontend_2026-02-17.md`
- `44_EXECUTION_LOG_cycle5_backend_2026-02-17.md`
- `45_EXECUTION_LOG_cycle5_frontend_2026-02-17.md`
- `46_EXECUTION_LOG_cycle6_backend_2026-02-17.md`
- `47_EXECUTION_LOG_cycle6_frontend_2026-02-17.md`
- `48_EXECUTION_LOG_cycle-7-backend_2026-02-17.md`
- `49_EXECUTION_LOG_cycle-7-frontend_2026-02-17.md`
- `50_EXECUTION_LOG_cycle-8-backend_2026-02-17.md`
- `51_EXECUTION_LOG_cycle-8-frontend_2026-02-17.md`
- `52_EXECUTION_LOG_cycle-9-backend_2026-02-17.md`
- `53_EXECUTION_LOG_cycle-9-frontend_2026-02-17.md`
- `54_EXECUTION_LOG_cycle-10-backend_2026-02-17.md`
- `55_EXECUTION_LOG_cycle-10-frontend_2026-02-17.md`
- `56_EXECUTION_LOG_cycle-11-backend_2026-02-17.md`
- `57_DRYRUN_TEST_cycle_gemini-3-flash_2026-02-17.md` (dry run validation for Google Anthropic gemini-3-flash fallback)
- `58_EXECUTION_LOG_cycle-12-preflight_2026-02-18.md`
- `59_EXECUTION_LOG_cycle-12-postcheck_2026-02-18.md`
- `60_EXECUTION_LOG_cycle-13-preflight_2026-02-18.md`
- `61_EXECUTION_LOG_cycle-14-preflight_2026-02-18.md`
- `62_EXECUTION_LOG_cycle-14-postcheck_2026-02-18.md`
- `63_EXECUTION_LOG_cycle-15-preflight_2026-02-18.md`
- `64_EXECUTION_LOG_cycle-16-preflight_2026-02-18.md`
- `65_EXECUTION_LOG_cycle-17-backend_2026-02-18.md`
- `66_EXECUTION_LOG_cycle-18-full_2026-02-18.md`
- `67_EXECUTION_LOG_cycle-19-full_2026-02-18.md`
- `68_EXECUTION_LOG_cycle-20-full_2026-02-18.md`
- `69_EXECUTION_LOG_cycle-21-full_2026-02-18.md`
- `70_EXECUTION_LOG_cycle-22-full_2026-02-18.md`
- `71_EXECUTION_LOG_cycle-23-full_2026-02-18.md`
- `72_EXECUTION_LOG_cycle-21-pay-true-recovery-preflight_2026-02-19.md`
- `73_EXECUTION_LOG_cycle-21-pay-true-recovery-final_2026-02-19.md`
- `74_EXECUTION_LOG_cycle-24-full_2026-02-19.md`
- `75_EXECUTION_LOG_cycle-25-full_2026-02-19.md`
- `76_EXECUTION_LOG_cycle-26-full_2026-02-19.md`
- `80_EXECUTION_LOG_cycle-30-validation_2026-02-19.md`

### Historical iterations (archived)
- `02_architecture_gdpr/archive/` contains working-history documents `15–24`.
- These are preserved for traceability and auditability, but are **not** the canonical planning baseline.

Use this folder when deciding **how to build** and **what must be validated before coding**.

## 03_video_research/
Per-video source material and extracted learnings.

### transcripts/
Raw extracted transcripts from selected YouTube videos.

### learnings/
Structured markdown summaries and technical/product takeaways derived from each transcript.

### onboarding_reference/
Local onboarding screenshot sequence from a reference app used to inform first-run flow design.

Contents:
- `README.md` — how the evidence set is organized
- `00_filename_mapping.csv` — source export name to integrated ordered filename mapping
- `01_first_run_onboarding_sequence.md` — sequence policy and usage guidance
- `02_screen_by_screen_observations.md` — detailed textual per-screen behavior notes (including branch and system modal details)
- `screenshots/` — ordered local-only image files (`IMG_5643_onboarding_00.jpeg` ... `IMG_5664_onboarding_21.jpeg`)

Use this folder as the **evidence base** for product and architecture conclusions.

## 04_local_run_scripts/
Local automation scripts to start/stop/check the full stack (database, backend, frontend) from this planning workspace.

Contents:
- `01_start_db.sh` — starts PostgreSQL via Docker Compose in backend repo
- `02_start_backend.sh` — installs deps if needed, runs migrations, starts backend
- `03_start_frontend.sh` — installs deps if needed, starts frontend
- `10_start_all.sh` — starts all services in sequence
- `20_status.sh` — checks health and port status
- `30_stop_all.sh` — stops services and Docker database
- `README.md` — usage details

Use this folder when you want to **run the app locally quickly** without retyping all startup commands.

## 05_quality_automation/
Quality gates, smoke matrices, E2E expectations, and AI-agent runbook to catch backend/frontend/database inconsistencies automatically.

Contents:
- `00_quality_gates.md` — mandatory release/merge quality gates
- `01_backend_smoke_matrix.md` — required backend endpoint + health-after-error checks
- `02_frontend_e2e_matrix.md` — critical UI journeys and error-surfacing expectations
- `03_contract_drift_checks.md` — schema/API/contract drift prevention rules
- `04_agent_runbook.md` — step-by-step AI execution loop (test -> fix -> retest)

Use this folder as the **mandatory pre-merge process** for AI-assisted implementation and bug fixing.

## Recommended Reading Order

1. `02_architecture_gdpr/25_FINAL_product_navigation_and_user_flows.md`
2. `02_architecture_gdpr/26_FINAL_data_model_and_database_plan_local_first.md`
3. `02_architecture_gdpr/27_FINAL_backend_hosting_and_portability_strategy.md`
4. `02_architecture_gdpr/28_FINAL_execution_readiness_checklist.md`
5. `01_research_foundation/02_learnings_synthesis.md`
6. Video-specific details in `03_video_research/learnings/`
7. Onboarding sequence policy in `03_video_research/onboarding_reference/01_first_run_onboarding_sequence.md`
8. Onboarding detailed behavior notes in `03_video_research/onboarding_reference/02_screen_by_screen_observations.md`
9. `06_execution_plan.md` — consolidated next batch of backend/frontend tasks + automation housekeeping.

## Notes

- This directory is intentionally separate from code repos.
- Keep research, decisions, and external docs here.
- The current canonical workspace is `/Users/luis/Repos/CalorieTracker`. It contains:
  - `backend/` (formerly `CalorieTracker_BackEnd/`)
  - `frontend/` (formerly `CalorieTracker_FrontEnd/`)
  - `plan/` (this folder)
- When you encounter legacy references to `CalorieTracker_BackEnd`, `CalorieTracker_FrontEnd`, or `CalorieTracker_Plan` in these documents, treat them as historical; substitute the corresponding subfolder under `/Users/luis/Repos/CalorieTracker` when running commands today.
- Use `scripts/start_calorietracker.sh` from the aggregator root to start Postgres, backend, and frontend in one go—the script prints the LAN URLs and handles the env setup.

## Maintenance Rules (Important)

To keep this knowledge base usable over time:

1. **Always place new docs in the right category folder** (do not dump files in root).
2. **Keep this README as the master index**:
   - add new files to the corresponding folder section,
   - update the description of what each file is for,
   - adjust recommended reading order when needed.
3. **Use clear filenames with numeric prefixes** when order matters (e.g., `31_...`, `32_...`).
4. **Separate source evidence from synthesis**:
   - raw inputs (transcripts/data) in evidence folders,
   - interpreted conclusions in learnings/decision docs.
5. **When adding a new category**, update this README with:
   - purpose of the folder,
   - expected file types,
   - how to use it.

This ensures documentation stays organized and easy to navigate as the project grows.
- Next steps note for cycle 2026-02-19_000857: next_steps_cycle_2026-02-19_000857.md
- Next steps note for cycle 2026-02-19_001105: next_steps_cycle_2026-02-19_001105.md
- Next steps note for cycle 2026-02-19_001750: next_steps_cycle_2026-02-19_001750.md
- Next steps note for cycle 2026-02-19_064912: next_steps_cycle_2026-02-19_064912.md
- Next steps note for cycle 2026-02-19_064954: next_steps_cycle_2026-02-19_064954.md
- Next steps note for cycle 2026-02-19_080704: next_steps_cycle_2026-02-19_080704.md
- Next steps note for cycle 2026-02-19_081205: next_steps_cycle_2026-02-19_081205.md
- Next steps note for cycle 2026-02-19_081210: next_steps_cycle_2026-02-19_081210.md
- Next steps note for cycle 2026-02-19_083738: next_steps_cycle_2026-02-19_083738.md
- Next steps note for cycle 2026-02-19_083753: next_steps_cycle_2026-02-19_083753.md
- Next steps note for cycle 2026-02-19_084550: next_steps_cycle_2026-02-19_084550.md
- Next steps note for cycle 2026-02-19_091931: next_steps_cycle_2026-02-19_091931.md
- Next steps note for cycle 2026-02-19_091937: next_steps_cycle_2026-02-19_091937.md
- Next steps note for cycle 2026-02-19_094408: next_steps_cycle_2026-02-19_094408.md
- Next steps note for cycle 2026-02-19_094411: next_steps_cycle_2026-02-19_094411.md
- Next steps note for cycle 2026-02-19_094500: next_steps_cycle_2026-02-19_094500.md
- Next steps note for cycle 2026-02-19_094801: next_steps_cycle_2026-02-19_094801.md
- Next steps note for cycle 2026-02-19_102556: next_steps_cycle_2026-02-19_102556.md
- Next steps note for cycle 2026-02-19_102612: next_steps_cycle_2026-02-19_102612.md
- Next steps note for cycle 2026-02-19_113750: next_steps_cycle_2026-02-19_113750.md
- Next steps note for cycle 2026-02-19_122255: next_steps_cycle_2026-02-19_122255.md
- Next steps note for cycle 2026-02-19_122258: next_steps_cycle_2026-02-19_122258.md
- Next steps note for cycle 2026-02-19_124130: next_steps_cycle_2026-02-19_124130.md
- Next steps note for cycle 2026-02-19_124152: next_steps_cycle_2026-02-19_124152.md
- Next steps note for cycle 2026-02-19_145235: next_steps_cycle_2026-02-19_145235.md
- Next steps note for cycle 2026-02-19_150600: next_steps_cycle_2026-02-19_150600.md
- Next steps note for cycle 2026-02-19_150609: next_steps_cycle_2026-02-19_150609.md
- Next steps note for cycle 2026-02-19_152817: next_steps_cycle_2026-02-19_152817.md
- Next steps note for cycle 2026-02-19_152821: next_steps_cycle_2026-02-19_152821.md
- Next steps note for cycle 2026-02-19_161553: next_steps_cycle_2026-02-19_161553.md
- Next steps note for cycle 2026-02-19_161607: next_steps_cycle_2026-02-19_161607.md
- Next steps note for cycle 2026-02-19_164511: next_steps_cycle_2026-02-19_164511.md
- Next steps note for cycle 2026-02-19_164517: next_steps_cycle_2026-02-19_164517.md
- Next steps note for cycle 2026-02-19_175749: next_steps_cycle_2026-02-19_175749.md
- Next steps note for cycle 2026-02-19_175905: next_steps_cycle_2026-02-19_175905.md
- Next steps note for cycle 2026-02-19_175920: next_steps_cycle_2026-02-19_175920.md
- Next steps note for cycle 2026-02-20_080401: next_steps_cycle_2026-02-20_080401.md
- Next steps note for cycle 2026-02-20_080406: next_steps_cycle_2026-02-20_080406.md
- Next steps note for cycle 2026-02-20_102631: next_steps_cycle_2026-02-20_102631.md
- Next steps note for cycle 2026-02-20_102652: next_steps_cycle_2026-02-20_102652.md
- Next steps note for cycle 2026-02-20_113038: next_steps_cycle_2026-02-20_113038.md
- Next steps note for cycle 2026-02-20_113138: next_steps_cycle_2026-02-20_113138.md
- Next steps note for cycle 2026-02-21_162800: next_steps_cycle_2026-02-21_162800.md
- Next steps note for cycle 2026-02-21_162804: next_steps_cycle_2026-02-21_162804.md
- Next steps note for cycle 2026-02-21_163439: next_steps_cycle_2026-02-21_163439.md
