# MediFamily Functional Requirements

## FR01 — Manage family profiles

The system shall allow registered users to create separate health profiles for themselves and family members, recording each person’s name and date of birth. Registration shall not automatically create a profile.

Users shall be able to select profiles they created or accepted invitations to access. Authorised users shall be able to view and edit basic profile information.

Only the creator shall be able to delete the entire profile, after confirmation explaining that its healthcare records and documents will also be deleted.

## FR02 — Manage health information

The system shall allow authorised users to record, view, and update a profile’s blood type, allergies, medical conditions, past surgeries, and emergency contacts. Each emergency contact shall include a name and telephone number.

Unknown information may remain unspecified. Empty allergy or medical-condition fields shall not indicate that none exist.

## FR03 — Manage medication schedules and reminders

The system shall allow authorised users to add, view, edit, and remove medications. Each medication shall include its name, dosage instructions, fixed daily reminder times, treatment start date, and optional end date.

Each user shall independently enable reminders for a profile on their device. With notification permission, reminders shall identify the person and medication and occur only within the treatment period. If there is no end date, reminders shall continue until the medication is removed.

Schedule changes or medication deletion shall update or cancel pending reminders when the device receives the change. A delivered reminder shall not confirm that a dose was taken.

## FR04 — Manage prescription records

The system shall allow authorised users to create, view, edit, and delete prescriptions containing the doctor’s name, speciality, visit date, medicine list, and an optional image or PDF attachment.

Users shall be able to create medication schedules from prescriptions or link prescribed medicines to existing medication records. Schedule changes or deletion shall not alter the original prescription.

Deleting an attachment shall preserve the prescription’s written details. Deleting a prescription shall remove its links but preserve associated medical documents and existing medication schedules.

## FR05 — Manage appointments, visits, and reminders

The system shall allow authorised users to record, view, edit, and delete appointments and medical visits, including the doctor’s name, date and time, and optional location and notes.

Appointments may be marked as scheduled, completed, cancelled, or missed. Passing the appointment date shall not automatically mark it as completed. Follow-up visits shall be separate appointments.

Each user shall independently enable reminders on their device. With notification permission, reminders shall identify the person and appointment. Appointment changes shall update pending reminders. Completing, cancelling, marking as missed, or deleting an appointment shall cancel them when the device receives the change.

Users shall be able to export a scheduled appointment to their own Google Calendar through the Google Calendar API. This shall create a one-time copy. Later changes or deletion in MediFamily shall not affect it.

## FR06 — Track medicine stock and refill needs

The system shall allow authorised users to record and manually update a medication’s remaining quantity, unit, and refill threshold.

An in-app refill alert shall appear when the quantity reaches or falls below the threshold and clear when it rises above it. Reminders shall not automatically reduce stock. Authorised users shall see the same saved quantity after synchronisation.

## FR07 — Manage medical documents

The system shall allow authorised users to add, list, open, edit descriptive details of, and delete medical documents. Users shall be able to capture images using the camera or select existing images or PDFs. Each document shall include a title, category, and relevant date.

Documents shall be stored persistently and accessible to authorised shared members. Prescription attachments shall be stored once as medical documents and linked to their prescriptions.

Deleting a document shall remove its attachment links while preserving written prescription details.

## FR08 — Record health measurements

The system shall allow authorised users to add, view, edit, and delete blood pressure, blood glucose, and weight measurements.

Each entry shall include its date and time, value, and unit. Blood pressure shall include systolic and diastolic values. Users shall be able to review previous entries by measurement type, without mandatory daily recording.

## FR09 — Share and synchronise family profiles

The system shall allow a profile’s creator to invite registered users and cancel pending invitations. Recipients shall be able to accept or decline. Existing members and users with pending invitations shall not receive duplicate invitations. Acceptance shall grant access to the existing profile without creating a copy.

Authorised users shall be able to view and edit basic profile information and manage healthcare records and documents. Only creators shall control invitations, revoke access, or delete entire profiles. Shared members shall be able to leave without affecting the profile or other members. Permissions shall apply separately to each profile.

Access shall be restricted to authorised users. Leaving, revocation, or profile deletion shall block subsequent cloud access and cancel associated reminders when the affected device receives the change. Each user’s notification preferences shall remain independent.

Creating, editing, or deleting profiles, healthcare records, and documents shall require internet access for private and shared profiles. Saved changes shall synchronise through cloud storage. If a record has changed or been deleted since it was opened, the system shall prevent outdated edits or deletions and require reloading the latest state.

Deleting healthcare records or documents shall require confirmation. Entire-profile deletion shall also display the warning specified in FR01.

