# AI usage record — Daniel (MediFamily, Phase 1)

Factual record of the AI-assisted work on Daniel's part of the project, kept for the module's AI documentation. It lists what was generated, what changed and what was actually checked. It is not the assessed report.

- **Tool:** Claude Code (Claude desktop app, Code tab), model Claude Opus 5.5.
- **Date:** 25 October 2026, one working session.
- **Branch:** `daniel` in `Danzzer011/MediFamily_Project`.
- **Baseline given to the AI:** `AGENTS.md`, `package.json`, and the final documents in `docs/` (functional requirements FR01–FR09, architecture plan, data-storage plan, data model, use case and activity diagrams). The AI was told not to redesign the requirements or architecture and not to rewrite the documents.

## 1. What Daniel asked for, in order

1. Inspect the repository, the Expo version and the docs, then propose the smallest shared foundation. No code changes in this step.
2. Build that foundation on a clearly labelled demo-data adapter behind the repositories (Supabase deferred to Phase 2).
3. Give Login the MediFamily visual identity, with a given palette and design direction.
4. Restyle the code to look like the module labs (https://mobdev.vercel.app, Lab 01 and Lab 02).
5. Build Register.
6. Complete Family Profiles (FR01), Health Information (FR02) and Sharing and Invitations (FR09). Verify in the browser, commit in chunks, push, and keep this record.

Each commit and push happened after Daniel asked for it in the conversation.

## 2. What the AI generated

All code under `src/` was written by the AI in this session. Daniel reviewed the results and directed the steps.

| Layer | Files |
| --- | --- |
| Routes (thin) | `src/app/_layout.tsx`, `(auth)/_layout.tsx`, `(auth)/login.tsx`, `(auth)/register.tsx`, `(app)/_layout.tsx`, `(app)/index.tsx`, `(app)/profiles/new.tsx`, `(app)/profiles/[profileId]/index.tsx`, `edit.tsx`, `health.tsx`, `sharing.tsx` |
| Views | `views/auth/LoginScreen.tsx`, `RegisterScreen.tsx`; `views/profiles/ProfilesScreen.tsx`, `ProfileFormScreen.tsx`, `ProfileDetailsScreen.tsx`; `views/health/HealthInfoScreen.tsx`; `views/sharing/SharingScreen.tsx` |
| ViewModels | `viewmodels/auth/useLoginViewModel.ts`, `useRegisterViewModel.ts`; `viewmodels/profiles/useProfilesViewModel.ts`, `useProfileFormViewModel.ts`, `useProfileDetailsViewModel.ts`; `viewmodels/health/useHealthInfoViewModel.ts`; `viewmodels/sharing/useSharingViewModel.ts`; `viewmodels/shared/useReloadOnFocus.ts` |
| Models and rules | `models/common.ts`, `Account.ts`, `FamilyProfile.ts`, `Sharing.ts`, `errors.ts`, `validation.ts`, `dates.ts` |
| Repositories | `repositories/authRepository.ts`, `profileRepository.ts`, `sharingRepository.ts`, each with its interface and one line that selects the adapter |
| Demo adapter | `repositories/demo/demoDatabase.ts`, `demoAuthRepository.ts`, `demoProfileRepository.ts`, `demoSharingRepository.ts`. In-memory tables shaped like the data-storage plan, with permission and version checks. Labelled as demo data in code and in the UI. |
| Shared state | `context/SessionContext.tsx`, `context/SelectedProfileContext.tsx` |
| Shared UI | `components/Button`, `TextField`, `Screen`, `BrandHeader`, `ErrorBanner`, `DemoDataNotice`, `LoadingView`, `ErrorView`, `ConfirmDialog`, `ProfileCard`, `ChoiceChip`, `SplashScreenController`; `theme/index.ts` |
| Config | `eslint.config.js` (created by `npx expo lint`); `tsconfig.json` excludes the git-ignored `example/` folder; `.claude/launch.json` (web preview); `.gitattributes` (keeps PDFs and images binary) |

## 3. Decisions the AI made and why

- **Demo adapter first** (Daniel's choice). The repository interfaces are what Views and ViewModels use, so the Supabase adapter can replace the demo one later without changing screens.
- **Expo SDK 57 docs checked before coding:**
  - Protected routes use `Stack.Protected guard` for the logged-in and logged-out page groups. `redirectTo` was avoided because it needs SDK 58.
  - The splash screen stays up until the session is known.
  - The Supabase guide was read for the later adapter (`@supabase/supabase-js` with `expo-sqlite` storage).
- **Lab-style code** (Daniel's request, after reading Lab 01 and Lab 02):
  - `export default function` components, one per file
  - `StyleSheet.create` at the bottom of each file
  - `type` instead of `interface`, and relative imports
  - Context written as `createContext(null)`, a provider with `.Provider`, and a `useX()` hook that throws outside the provider
  - form handlers written as plain `function save()`
  - MVVM kept: Views contain UI only, ViewModels hold screen logic, repositories hold data access.
- **Confirmation dialogs** use a `Modal` (`ConfirmDialog`) because React Native's `Alert` does nothing on web, and the browser preview is used for testing.
- **Password rule:** the demo repository had none, so a minimum of 6 characters (the Supabase Auth default) was added and shared by the form and the repository.
- **Date of birth** is typed as `YYYY-MM-DD` and validated as a real date: not in the future and not before 1900. No date-picker library was added.
- **Incoming invitations** appear on the Family Profiles page, before a profile is chosen, following the activity diagram.
- **Leaving a profile** is on the Sharing page; **deleting the whole profile** is on the profile page (creator only).
- **Screens reload their data whenever they are shown again** (`useReloadOnFocus`), so edits made on one screen or by another account appear on the others.

## 4. What was actually verified

**Static checks** (final run on the last commit):
- `npx tsc --noEmit`: passed, after regenerating the route types (see limitation 2).
- `npx expo lint`: passed.
- `npx expo-doctor`: 21/21 checks passed.

**Browser checks** (Expo web preview, phone viewport 375×812). Some steps used real clicks and typing in the browser; long multi-account flows used small in-page helper functions that fill inputs and press buttons by label. Both are listed.

| Area | What was checked | How |
| --- | --- | --- |
| Login | Empty form messages; invalid email; wrong password banner; successful demo login goes to Profiles; dark mode; desktop width | Real clicks and typing |
| Register | Empty form, bad email, short password, mismatched passwords; duplicate email banner; spinner shown and button disabled while saving; success goes to Profiles; "Log in" link | Real clicks and typing; re-checked at the end with helpers |
| Registration creates no profile | New accounts showed "No health profiles yet" | Browser, three new accounts |
| FR01 | Empty state; create with empty, future-dated and valid input; opens the new profile; edit form prefilled; edited name shown on the details page and the list; delete warning dialog; Cancel keeps the profile; confirm deletes it and returns to an empty list | Real clicks for create, edit and delete; helpers for later repeats |
| FR02 | All fields "Not recorded" at first; blood type chip; spaces-only conditions saved as not recorded; contact without phone and with invalid phone rejected; valid save shown; second edit prefilled; Unknown blood type and blank allergies go back to "Not recorded"; contact removed; data still there after leaving and returning; dark mode | Helpers; screenshots checked |
| FR09 creator | Invite errors: bad email, unknown account, own email, duplicate pending invitation, existing member; successful invites; cancel a pending invitation; remove access (dialog Cancel, then confirm) | Helpers for invites; real clicks for the remove-access dialog |
| FR09 recipient | Two invitations shown before choosing a profile; Accept adds the same profile (same id, creator's data visible, so no copy); Decline adds nothing | Real clicks |
| FR09 member permissions | No delete button or invite form; can edit health information, and the creator then sees the edit; Leave (dialog confirmed) removes access and returns to the list; the creator's profile and records are unchanged | Real clicks for Leave; helpers otherwise |
| Per-profile permissions | One account that was creator of one profile and member of another saw creator controls only on its own profile | Helpers |
| Deleting a shared profile | The creator deleted a profile shared with another account; it disappeared from that member's list | Helpers |
| Console | No errors or warnings during the final end-to-end run after a fresh load | Browser console |

**Repository-level script checks** (temporary `tsx` scripts run against the demo repositories, then deleted). All passed:
- registration creates no profile
- invalid date of birth or contact rejected
- blank optional fields stay `null`
- outdated edits rejected (`stale_record`)
- recipient cannot read a profile before accepting
- accepting does not copy the profile
- a member cannot invite, list pending invitations, revoke, cancel invitations or delete
- deleting a profile removes its memberships and invitations, and members lose access

## 5. Known limitations and open items

1. **Demo data only.** It lives in memory, so it resets on reload and is not shared between devices. There is no real authentication or cloud security yet; Supabase persistence, row-level security and the 30-second refresh are Phase 2. The demo passwords are listed in `demoDatabase.ts`.
2. **Typed routes on Windows.** While `expo start` is running, editing files outside `src/app/` adds wrong entries to `.expo/types/router.d.ts`, and `tsc` then reports false errors. A fresh `expo start` regenerates the file correctly.
3. **Stale-version message in the UI was not seen in the browser**, because it needs two devices editing the same record. The repository check passed, and the ViewModels show the "reload" option when it occurs.
4. **Not tested on a physical phone or a native simulator.** Only the web build was checked.
5. **Date of birth is a text field** in `YYYY-MM-DD` format, not a date picker.
6. **Mazen's and Mohab's screens are not implemented.** `ProfileDetailsScreen` has a comment where their links go.
7. **Notifications and reminder cancellation on access loss** (FR03/FR05) are not part of Daniel's screens and were not built.

## 6. Commits on `daniel`

| Commit | Message |
| --- | --- |
| `6af9cb6` | Remove Expo starter template |
| `4fa2c12` | Add shared MVVM foundation with demo data adapter |
| `36c7e71` | Add MediFamily Login screen in the module lab code style |
| `af781ce` | Add Register screen |
| `7adf963` | Add final MediFamily design documents (unchanged; committed blobs match the files byte for byte) |
| `c19bf30` | Mark PDFs and images as binary in git |
| `203fa35` | Add shared profile rules and components for FR01, FR02 and FR09 |
| `099b2d9` | Add Family Profiles screens (FR01) |
| `786cac6` | Add Health Information screen (FR02) |
| `b955501` | Add Sharing and Invitations screen (FR09) |
| *(this file)* | Add AI usage record for Daniel's Phase 1 work |
