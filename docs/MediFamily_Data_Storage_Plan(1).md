# MediFamily: data-storage plan and preliminary data model

Date: 25 October 2026  
Scope: Phase 1 design for the agreed FR01-FR09.  
Status: proposed database design; no repository, Supabase project or application database has been created.

## 1. Storage choice

Use one Supabase project:

| Component | Purpose |
| --- | --- |
| Supabase Auth | Account registration and sign-in. |
| Supabase Postgres | Shared family profiles and healthcare records. |
| Supabase Storage, private bucket | Medical images and PDFs. |
| Supabase Edge Functions and database functions | Server-side code for steps that need extra permission or several changes at once: turning an invited email into an account, accepting an invitation, checking record versions, saving a prescription with its medicine items, and deleting a profile or document together with its files. |
| Phone-local storage | That account's reminder preferences and scheduled-notification identifiers on that phone. |

This is a project-specific choice to keep accounts, relational data and files together. It works with the selected React Native/Expo application. Google Calendar remains the separate Google API required by the coursework.

The app connects through its repositories. Database permissions enforce who can access each profile; hiding a button is not an access-control mechanism.

The database needs **nine application tables plus the account records managed by Supabase Auth**. Two useful simplifications are intentional: health information is stored in the family-profile row, and stock fields are stored in the medication row.

## 2. Type conventions

| Database type | Meaning in the app |
| --- | --- |
| uuid | Unique identifier, represented as a string in TypeScript. |
| text | Text/string. |
| date | Calendar date, represented as YYYY-MM-DD; no time of day. |
| timestamptz | An instant, stored with timezone-aware semantics and displayed in the relevant local timezone. |
| time[] | List of daily clock times, represented as HH:mm strings in the app. |
| integer | Whole number. |
| numeric | Number that can contain decimals. |
| boolean | True/false. |
| jsonb | A small structured value, such as a list of emergency contacts. |
| NULL / nullable | Not provided or not applicable; not zero and not a statement that a condition does not exist. |

Common fields on **family_profiles, profile_invitations, medications, prescriptions, appointments, medical_documents and health_measurements**:

| Field | Type | Rule |
| --- | --- | --- |
| id | uuid | Primary key. |
| version | integer | Starts at 1; the backend increments it whenever the record changes. |
| created_at | timestamptz | Server-generated creation time. |
| updated_at | timestamptz | Server-generated latest-change time. |

Membership rows and prescription-medicine rows use the fields listed separately below. Prescription-medicine edits are protected by their parent prescription's version.

## 3. Data dictionary

### A. Accounts: managed by Supabase Auth

| Field used by the app | Type | Purpose |
| --- | --- | --- |
| id | uuid | Account identifier, referenced by creator/member/invitation fields. |
| email | text | Sign-in email and the exact email used to address an invitation. |

Authentication credentials are managed by Auth. The app does not create a password column. Signing up creates an account only; the user separately creates a health profile.

An account and a health profile are different things. There is no automatic patient-to-account ownership transfer.

### B. family_profiles — FR01, FR02

Includes the common fields.

| Additional field | Type | Rule |
| --- | --- | --- |
| creator_id | uuid | References the account that created the profile; cannot be changed by ordinary profile editing. |
| name | text | Required. |
| date_of_birth | date | Required; not a future date. |
| blood_type | text, nullable | One of A+, A-, B+, B-, AB+, AB-, O+, O- when specified. |
| allergies | text, nullable | Blank/unknown saves as NULL; never automatically displayed as “no allergies”. |
| medical_conditions | text, nullable | Blank/unknown saves as NULL; never automatically displayed as “no conditions”. |
| past_surgeries | text, nullable | Free-text history when supplied. |
| emergency_contacts | jsonb | List of objects, each with a non-empty name and phone string; an empty list is allowed. |
| time_zone | text | Technical scheduling value, e.g. Africa/Cairo. Set once from the creator's device when the profile is created; it is never changed afterward. |
| deletion_pending | boolean | Default false; used only to safely complete profile/file deletion. |

Phone numbers are text to preserve leading zeroes and +country codes.

Medication daily times, treatment dates and appointment times are all shown in the profile's timezone, so every caregiver sees the same schedule. Appointments are saved as an exact instant.

### C. profile_members — FR09

Stores accepted shared users only. The creator is already identified by family_profiles.creator_id and is not duplicated here.

| Field | Type | Rule |
| --- | --- | --- |
| profile_id | uuid | References family_profiles. |
| user_id | uuid | References the shared user's Auth account. |
| joined_at | timestamptz | Server-generated acceptance time. |

The pair (profile_id, user_id) is the primary key, preventing duplicate memberships. Every row has the same shared-member permissions; no additional role types are needed.

### D. profile_invitations — FR09

Includes the common fields.

| Additional field | Type | Rule |
| --- | --- | --- |
| profile_id | uuid | References family_profiles. |
| recipient_user_id | uuid | References an already registered account. |
| status | text | pending, accepted, declined or cancelled. |
| profile_name | text | Copy of the profile's name, saved by the backend when the invitation is created, so the recipient can see what they are invited to without reading the profile. |
| inviter_email | text | Email of the creator who sent the invitation, saved at the same time. |

Until they accept, a recipient can read only their own invitations, never the profile itself.

The creator enters the recipient's exact email. A protected backend operation resolves it to an existing account ID; the app does not download a directory of all registered users.

Only one pending invitation is allowed for a given profile and recipient. Inviting the creator, an existing member or someone with a pending invitation is rejected.

Accepting checks the current invitation and profile, creates the membership, and changes the invitation status in one database transaction. It never copies the health profile. Cancelling and declining affect the invitation only.

### E. medications — FR03, FR06

Includes the common fields.

| Additional field | Type | Rule |
| --- | --- | --- |
| profile_id | uuid | References family_profiles. |
| name | text | Required. |
| dosage_instructions | text | Required instructions entered by the user. |
| reminder_times | time[] | At least one valid, distinct daily reminder time. |
| treatment_start | date | Required. |
| treatment_end | date, nullable | Must be on/after the start date; NULL means no scheduled end. |
| remaining_quantity | numeric, nullable | Manually entered quantity, >= 0. |
| stock_unit | text, nullable | E.g. tablets or mL. |
| refill_threshold | numeric, nullable | >= 0, in the same unit as remaining_quantity. |

Stock tracking is either unspecified (all three stock fields NULL) or has all three fields supplied. Missing stock does not mean zero stock.

The refill alert is calculated from the saved values: quantity <= threshold. It is not a separate table. Reminder delivery never changes quantity or records a dose as taken.

### F. prescriptions — FR04

Includes the common fields.

| Additional field | Type | Rule |
| --- | --- | --- |
| profile_id | uuid | References family_profiles. |
| doctor_name | text | Required; entered as text, not selected from a doctor database. |
| speciality | text | Required. |
| visit_date | date | Required. |
| attachment_document_id | uuid, nullable | Optional link to one medical_documents row belonging to the same profile. |

The prescribed medicine list is stored in prescription_medicines.

### G. prescription_medicines — FR04

One row per medicine written on a prescription.

| Field | Type | Rule |
| --- | --- | --- |
| id | uuid | Primary key. |
| prescription_id | uuid | References prescriptions. |
| medicine_name | text | Required snapshot of the prescribed medicine's name. |
| dosage_instructions | text, nullable | Written prescription instructions, if recorded. |
| medication_id | uuid, nullable | Optional link to an existing or newly created medication for the same profile. |
| position | integer | Display order within the prescription. |

A prescription must contain at least one item. The backend saves the prescription and its items together.

The written snapshot is separate from the linked medication schedule. Editing or deleting that schedule does not rewrite the prescription. Explicit prescription edits remain allowed by FR04.

This small table is necessary to keep the original medicine list while allowing optional schedule links.

### H. appointments — FR05

Includes the common fields.

| Additional field | Type | Rule |
| --- | --- | --- |
| profile_id | uuid | References family_profiles. |
| doctor_name | text | Required. |
| starts_at | timestamptz | Required appointment/visit date and time. |
| location | text, nullable | Optional. |
| notes | text, nullable | Optional. |
| status | text | scheduled, completed, cancelled or missed; initially scheduled. |

Follow-ups are separate rows. Passing the date does not automatically change the status.

A scheduled appointment can be copied to Google Calendar. No persistent Google event link is needed because the project does not synchronise later edits or deletions back to Google Calendar.

### I. medical_documents — FR07

Includes the common fields.

| Additional field | Type | Rule |
| --- | --- | --- |
| profile_id | uuid | References family_profiles. |
| title | text | Required. |
| category | text | Required; e.g. prescription, lab report, scan or other. |
| relevant_date | date | Required document date. |
| storage_path | text | Unique path in the private medical-documents bucket. |
| original_file_name | text | Original or camera-generated file name. |
| mime_type | text | Supported image type or application/pdf. |
| deletion_pending | boolean | Default false; used only to finish file deletion safely. |

Store file bytes in Storage, not in a database text column. A path can look like profile-id/document-id/file.pdf.

Prescription attachments use this same table and bucket; they are not uploaded again into a separate prescription store. Metadata edits do not require selecting the file again.

### J. health_measurements — FR08

Includes the common fields.

| Additional field | Type | Rule |
| --- | --- | --- |
| profile_id | uuid | References family_profiles. |
| measurement_type | text | blood_pressure, blood_glucose or weight. |
| measured_at | timestamptz | Required date and time. |
| value | numeric, nullable | Required positive value for glucose or weight; NULL for blood pressure. |
| systolic | integer, nullable | Required positive value for blood pressure; otherwise NULL. |
| diastolic | integer, nullable | Required positive value for blood pressure; otherwise NULL. |
| unit | text | mmHg for blood pressure; mg/dL or mmol/L for glucose; kg or lb for weight. |

Database checks enforce the appropriate field combination. The app lists the saved unit with each reading and can filter previous entries by type. It does not diagnose readings or require daily entries.

## 4. Relationship summary

The companion diagram shows the same relationships. “1 to many” permits zero child rows.

| Relationship | Meaning |
| --- | --- |
| Account -> family_profiles | One account can create many profiles; each profile has one creator. |
| Account + profile -> profile_members | Many accounts can share many profiles through membership rows. |
| Account + profile -> profile_invitations | An invitation addresses one registered account for one profile. |
| Profile -> medications/prescriptions/appointments/documents/measurements | Each healthcare record belongs to one profile. |
| Prescription -> prescription_medicines | One saved prescription has one or more medicine items. |
| Prescription -> document | Optional attachment; the referenced document must belong to the same profile. |
| Prescription medicine item -> medication | Optional schedule link; both sides must belong to the same profile. |

Same-profile links are validated in the database, not just in the form.

## 5. Phone-local data

Use a small local key-value store for reminder settings. These values are not shared across caregivers.

| Local value | Type | Purpose |
| --- | --- | --- |
| Account ID + profile ID | string key | Separates different accounts and profiles on this phone. |
| reminders_enabled | boolean | Default false until the user enables profile reminders. |
| scheduled_notification_ids | JSON map of record key -> string[] | Lets the app update/cancel notifications for a medication or appointment. |

Notification permission is read from the operating system. Auth session persistence uses the Auth SDK's mobile integration; passwords are not stored by application code.

The database is the source of truth for healthcare records. Keep loaded records in memory and use temporary files only when needed to view/upload documents. This plan does not add an offline healthcare database or queue clinical writes for later.

## 6. Access and synchronisation

- Read/write access requires the creator or an accepted membership for that profile.
- Only the creator can invite/cancel invitations, revoke users or delete the entire profile.
- Recipients can accept/decline their own invitations. Shared members can leave; they cannot remove other members.
- Profile creator_id, time_zone and record profile_id cannot be changed through ordinary record edits.
- Apply database Row Level Security and matching private-file policies. Only the intended operations are granted; the elevated backend key stays server-side.
- Creating, editing and deleting healthcare data requires a successful online backend request.
- Refresh accessible profiles and enabled-profile medication/appointment data on app launch/resume, after a successful local write and on user refresh. While the app is active, a simple 30-second refresh can keep shared changes current. These are ordinary refetches, so there is no additional sync server to maintain.
- Every access refresh removes inaccessible profiles from the local workspace and cancels their pending reminders. After receiving record changes, reconcile reminders using the saved dates/status and this phone's preferences.
- A closed or disconnected app cannot promise immediate updates. It rechecks access and records when it next receives fresh cloud state, matching the agreed requirements.

Membership changes and writes check the current profile state. The database prevents new writes or memberships while a profile is being deleted.

## 7. Prevent outdated edits and deletions

When a record opens, the app retains its version. An update/delete sends that expected version. The backend checks permission, compares the version and makes the change atomically.

If the row changed or was deleted, the operation fails with a reload message. It must not silently apply a stale form to newer data.

Saving prescription items checks and increments the parent prescription version. Automatic link removal also increments affected parent versions. This avoids stale forms restoring deleted links.

Use database functions/transactions for operations involving several rows, such as invitation acceptance and prescription saves. Version checks must also apply to normal edits and deletes; they are not limited to the special functions.

## 8. Deletion and attachment rules

| Action | What is removed | What remains |
| --- | --- | --- |
| Delete medication | Medication and its stock fields; optional item links are cleared. | Original prescription names/instructions and documents. |
| Delete prescription | Prescription and its medicine-item rows. | Linked medication schedules and stored document files/metadata. |
| Remove an attachment link while editing a prescription | That prescription's attachment link. | Written prescription and document; document deletion is a separate confirmed action. |
| Delete medical document | File bytes and document row; all attachment links to it are cleared. | Written prescription details. |
| Delete appointment/measurement | That row, after confirmation. | Other healthcare records; existing independent Google Calendar copies. |
| Leave/revoke membership | That membership. | Profile and its records; access for other authorised users. |
| Delete entire profile | Profile, memberships, invitations, healthcare rows and all its stored document files. | Other profiles and account registrations. |

Confirm healthcare-record/document deletions and show the stronger whole-profile warning from FR01.

Database rows and file bytes are two systems. SQL cascading alone does not delete stored files. A small authenticated server operation must mark a document/profile deletion as pending after checking its expected version, prevent further access/new links or writes, remove file bytes through the Storage API, then finish the database deletion. A failed attempt remains retryable; it must not report successful completion while files remain.

The two deletion_pending fields support this required cleanup without adding a separate job system. A profile deletion must block new uploads as well as database writes. Failed document uploads also require cleanup of any uploaded file whose metadata was not saved.

## 9. Coverage and project boundaries

| Functional requirement | Main storage |
| --- | --- |
| FR01 Profiles | family_profiles and Auth account references |
| FR02 Health information | Health fields inside family_profiles |
| FR03 Medication schedules | medications plus device-local preferences/notification IDs |
| FR04 Prescriptions | prescriptions, prescription_medicines and optional document/medication links |
| FR05 Appointments | appointments; Google Calendar receives an independent copy |
| FR06 Stock | Three fields inside medications; alert calculated from them |
| FR07 Documents | medical_documents plus one private Storage bucket |
| FR08 Measurements | health_measurements |
| FR09 Sharing/synchronisation | profile_members, profile_invitations, backend permissions and record versions |

No doctor directory, booking system, dose-taking log, donation history, vaccinations or medical timeline is added.

This step produces the Phase 1 data items/types, persistent-storage plan and preliminary model. It does not claim a working database or completed implementation. Use the design as a reference when writing the assessed report in your own words.

Next: agree the nine-screen plan and divide it between the three students. Set up the team repository and Expo project before implementing those screens.

## Sources checked

- Phase 1 data-plan requirements: https://mobdev.vercel.app/coursework/cw-01
- Expo/Supabase integration: https://docs.expo.dev/guides/using-supabase/
- Supabase Expo tutorial: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
- Database permissions: https://supabase.com/docs/guides/database/postgres/row-level-security
- Database functions: https://supabase.com/docs/guides/database/functions
- Private file access: https://supabase.com/docs/guides/storage/security/access-control
- Storage deletion: https://supabase.com/docs/guides/storage/management/delete-objects

The schema, refresh approach and field choices are proposed specifically for MediFamily. The provider documentation supports the platform capabilities; it does not prescribe this exact design.
