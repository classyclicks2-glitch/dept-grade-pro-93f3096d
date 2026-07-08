
# Employee Grading App

A password-gated grading app that replaces your Google Sheet. Each department unlocks with its own code; admins have a separate code that reveals HOD remarks, editable grades, and the terminated/resigned staff vault.

## Access (password gates, no accounts)

Uses an encrypted server-side session cookie (no user accounts, no email required). Passwords live in server-only env vars so they never ship to the browser.

- Delegate Affairs: `0000`
- Marketing: `1111`
- HR: `0000`
- Academics: `3333`
- Corporate Affairs: `4444`
- Admin: `0007`

Note: Delegate Affairs and HR share `0000`. Anyone typing `0000` will land on a "Choose department" screen listing both, then continue as that dept. (If you want them distinct, tell me a new password for one of them.)

## Pages

1. **Unlock** — single password field. Correct dept password → dept dashboard. Admin password → admin dashboard.
2. **Dept Dashboard** — list of people in that department + buttons: `Grade`, `Leave/Status`, `Add Person`.
3. **Grade Entry** — select person → date → four task sections (Departmental, Delegate Affairs, Marketing, HR) each with a details textarea + grade number → Ethics (Good=+1 / Bad=custom negative / N/A=0) with comment → Other Remarks + grade. HOD Remarks/Grade hidden here.
4. **Leave/Status** — per person: Active / On Leave (duration in days, auto-fills N/A for all task+ethics grades in that date range) / Inactive (reason box) / Terminated or Resigned (moves person to the admin-only vault, hidden from dept lists).
5. **Add Person** — name, role, Instagram, email, phone. Auto-tagged to the current dept.
6. **Admin Dashboard** — every department, every person, full spreadsheet-style grid (like your screenshot) with all daily rows. Can edit any cell, fill HOD Remarks + HOD Grade, change status, reset passwords later.
7. **Admin Vault** — terminated/resigned people with all their historical grades preserved.

## Grade math

Daily total = sum of (Departmental + Delegate Affairs + Marketing + HR + Ethics + Other Remarks) grades, treating N/A as 0.
Overall Grade = sum of daily totals across the visible month.

## Data model (Lovable Cloud)

- `departments` — slug, name
- `people` — name, department, role, instagram, email, phone, status (`active`|`on_leave`|`inactive`|`terminated`|`resigned`), status_reason, leave_start, leave_end
- `grades` — person_id, date, dept_task_detail, dept_task_grade, da_task_detail, da_task_grade, mkt_task_detail, mkt_task_grade, hr_task_detail, hr_task_grade, ethics (`good`|`bad`|`na`), ethics_grade, ethics_comment, other_remarks, other_grade, hod_remarks, hod_grade, is_auto_na (bool), created_by_dept
- `status_history` — person_id, status, reason, start, end, changed_at

Unique constraint on `(person_id, date)` so one row per person per day.

## Tech notes

- TanStack Start with encrypted `useSession` cookies for the gate (server-only `SITE_PASSWORD_*` env vars, generated `SESSION_SECRET`).
- Lovable Cloud for storage. Because access is by shared password (not per-user auth), the app uses server functions that check the session's `role` (`dept:hr` / `admin`) before every read/write, and admin-only fields (HOD remarks/grade, terminated vault) are stripped on the server for non-admin sessions.
- Grid view uses a virtualized table so months of data stay fast.

## Out of scope for v1 (say if you want any of these)

- Real user accounts / per-grader identity (right now anyone with the dept password can grade as that dept).
- Mobile app store build — this is a responsive web app that installs as a PWA on phones.
- CSV export of the grid.
