# 02 — Screen-by-Screen Observations (from `/Users/luis/exportOnBoarding`)

Purpose: preserve detailed onboarding behavior in text so implementation planning can continue even when screenshot files are not committed.

Legend:
- `Core`: primary onboarding/profile path.
- `Branch`: optional/conditional path.
- `System Modal`: native iOS permission sheet shown over app UI.

## Ordered Observations

1. `IMG_5643_onboarding_00.jpeg`
- Type: Core (entry)
- Visible UI: "Welcome to Amy", primary CTA "Get Started", secondary "Already have an account? Sign in"
- Behavior notes: clear split between sign-up start and existing-user login.

2. `IMG_5644_onboarding_01.jpeg`
- Type: Branch (Apple Health intro card)
- Visible UI: in-app Apple Health explanation, toggle "Sync with Apple Health", insights carousel, "Continue"
- Behavior notes: appears to be an in-app pre-permission step before native Health permission modal.

3. `IMG_5645_onboarding_02.jpeg`
- Type: System Modal (Apple Health)
- Visible UI: iOS "Health Access" sheet, write permissions toggles (off), disabled "Allow" button
- Behavior notes: app cannot style this; copy and permission scopes come from HealthKit request configuration.

4. `IMG_5646_onboarding_03.jpeg`
- Type: System Modal (Apple Health, edited state)
- Visible UI: write/read toggles enabled, "Allow" active
- Behavior notes: confirms multi-scope Health permissions; indicates user can toggle granular scopes before confirming.

5. `IMG_5647_onboarding_04.jpeg`
- Type: Core (profile)
- Visible UI: "What's your birthday?", date field with age preview, Next button
- Behavior notes: privacy reassurance text included below field.

6. `IMG_5648_onboarding_05.jpeg`
- Type: Core (profile)
- Visible UI: "What's your gender?" with choices (Male/Female/Other/Prefer not to say)
- Behavior notes: single-select list; chosen option highlighted.

7. `IMG_5649_onboarding_06.jpeg`
- Type: Branch (Apple Health detailed preferences)
- Visible UI: expanded list of Health sync toggles (Steps, Workouts, Burned Calories, etc.)
- Behavior notes: this is app-level toggle management; separate from iOS permission modal.

8. `IMG_5650_onboarding_07.jpeg`
- Type: Core (profile duplicate capture)
- Visible UI: same birthday screen as step 04
- Behavior notes: likely duplicate shot of same step/state; keep as evidence of repeated capture, not a separate product requirement.

9. `IMG_5651_onboarding_08.jpeg`
- Type: Core (profile)
- Visible UI: "What's your height?" with large editable value, Next
- Behavior notes: tap-to-change inline editor affordance.

10. `IMG_5652_onboarding_09.jpeg`
- Type: Core (profile)
- Visible UI: "What's your weight?" with current weight, goal weight, optional target date
- Behavior notes: combines current state + goal setup in one step.

11. `IMG_5653_onboarding_10.jpeg`
- Type: Core (profile)
- Visible UI: "What's your activity level?" with sedentary to very active options
- Behavior notes: impacts calorie calculation; selected option highlighted.

12. `IMG_5654_onboarding_11.jpeg`
- Type: Core (preferences)
- Visible UI: "Any special considerations?" chips (High Protein, Low Carb, Athlete, etc.) + free-text field
- Behavior notes: multi-select + optional free text.

13. `IMG_5655_onboarding_12.jpeg`
- Type: Core (preferences)
- Visible UI: "How should Amy handle calorie uncertainty?" slider and explanation card
- Behavior notes: user chooses estimation bias from under/over/no-bias style scale.

14. `IMG_5656_onboarding_13.jpeg`
- Type: Core/Branch gateway (device permission prep)
- Visible UI: "Enable Location?" with in-app toggle
- Behavior notes: likely triggers native location permission prompt after toggle/continue.

15. `IMG_5657_onboarding_14.jpeg`
- Type: Core/Branch gateway (device permission prep)
- Visible UI: "Enable Notifications?" with in-app toggle
- Behavior notes: likely triggers native push notification permission prompt after toggle/continue.

16. `IMG_5658_onboarding_15.jpeg`
- Type: Core (results summary)
- Visible UI: "Your Personalized Goals" with weight trajectory graph and macro/calorie targets
- Behavior notes: first strong value-delivery screen before monetization.

17. `IMG_5659_onboarding_16.jpeg`
- Type: Branch (paywall)
- Visible UI: "Unlock the full Amy experience" + feature bullets + "Learn More"
- Behavior notes: paywall entry point; close icon present.

18. `IMG_5660_onboarding_17.jpeg`
- Type: Branch (habit reinforcement)
- Visible UI: widget setup instructions, Home/Lock screen toggle tabs
- Behavior notes: educational onboarding inside app; non-system instructions.

19. `IMG_5661_onboarding_18.jpeg`
- Type: Core/Branch merge (account creation)
- Visible UI: "Save Your Progress" with Apple, Google, email options
- Behavior notes: account wall appears late, after delivering value screens.

20. `IMG_5662_onboarding_19.jpeg`
- Type: Branch (habit reinforcement)
- Visible UI: widget setup instructions for lock screen variant
- Behavior notes: second tab/state of same widget feature.

21. `IMG_5663_onboarding_20.jpeg`
- Type: Branch (paywall details)
- Visible UI: "How your Amy free trial works" timeline + "Continue"
- Behavior notes: subscription mechanics and charge timing transparency.

22. `IMG_5664_onboarding_21.jpeg`
- Type: Branch (paywall reassurance)
- Visible UI: "24 hours, on me" explanation + "Sounds good!"
- Behavior notes: emotional reassurance + no-credit-card messaging.

## Key Interaction Patterns Extracted

1. In-app pre-permission screen before system modal.
2. Native iOS permission sheets are separate UI layers and must be documented as platform behavior.
3. Core profile questions are short and mostly single-input/single-choice steps.
4. Value demonstration appears before final account save step.
5. Monetization and retention (paywall/widget) are branch-like and can appear around/after value delivery.

## Planning Implications for Our MVP

1. Keep native/system permission behavior explicitly out of frontend component ownership.
2. Separate "permission intent" (our UI) from "permission result" (OS callback state).
3. Model onboarding as a state machine with optional branches and re-entry to core path.
4. Add test scenarios for:
- permission allowed vs denied,
- branch opened vs skipped,
- account-save success/failure after goals preview.
