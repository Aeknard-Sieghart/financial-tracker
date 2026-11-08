# Supabase cloud sync setup

The app works locally without Supabase. These steps activate cloud sync; no project,
database, or financial data has been uploaded by adding this integration.

## 1. Create the backend

1. Create a Supabase project using the Free plan if suitable for your needs.
2. Open its SQL Editor and run all of `supabase/schema.sql` from this repository.
3. The script enables row-level security and grants authenticated users read access
   only to their own record. Writes go through `save_tracker_snapshot`, which derives
   the owner from the signed-in session and rejects stale revisions.
4. Keep row-level security enabled. Do not add broad access policies or direct write grants.

## 2. Configure email codes

1. Enable the Email sign-in provider and allow sign-ups for accounts you intend to use.
2. In Authentication → Email templates, set the Magic Link and Confirm signup templates
   to contain a code (so both first-time and returning users can verify in the app):

   ```html
   <h2>Your Financial Tracker sign-in code</h2>
   <p>{{ .Token }}</p>
   ```

3. Configure custom SMTP for sign-in emails to addresses outside your Supabase project
   team. Supabase's built-in mail service has recipient restrictions and rate limits;
   it is for testing. Your mail provider may have separate limits or pricing.
4. This app verifies codes in the original tab. It deliberately does not process
   authentication tokens from URL fragments or use an email-link callback.

## 3. Configure this app

Copy `.env.example` to `.env.local` and replace its placeholders:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
```

Use the project URL and **publishable** key from Supabase's Connect / API Keys panel.
Never use a secret key, `service_role` key, or database password in this app. Vite
environment variables are embedded in the browser bundle; a publishable key is
intended for this, and row-level security protects each user's records.

Restart `npm run dev` after adding the environment variables. For a hosted build,
set the same variables in the hosting platform and rebuild/redeploy. Each device
must open the same deployed website and sign in with the same email address.
The Supabase project alone does not deploy the frontend website.

## 4. Connect your first device

1. Export a full JSON backup using Backup & restore.
2. At the bottom of the dashboard, open Cloud sync, enter your email, request a code,
   and verify it.
3. Choose **Use this device's data**, then **Confirm upload**. This sends transactions,
   accounts, transfers, budgets, categories, bills, debts and repayments, recurring
   schedules, savings goals, income plans, and the spending buffer to your project.
4. On the second device, sign in using the same email, choose **Use cloud data**, and
   confirm the download. This replaces that browser's financial records, so export
   its backup first if it already contains data you want to keep.

## How synchronization behaves

- Changes sync about 1.2 seconds after local data changes. While the page is visible,
  remote changes are checked every 20 seconds, on focus, and after reconnecting.
- Expected income remains unrecorded until receipt is confirmed. Transfers and debt
  repayment metadata stay intact because complete, validated backups are synchronized.
- Offline edits remain in the browser. Automatic syncing resumes when connectivity
  returns while the app remains open. Offline editing requires the app to already be
  loaded; there is no offline-installable PWA/service worker in this release.
- On reload/sign-in, differing device and cloud copies require a starting-copy choice.
  This also prevents another signed-in account's local data being uploaded silently.
- Whole-copy conflicts pause automatic sync. Export a backup before choosing which
  copy to retain. The app does not merge transactions automatically. A revision check
  prevents a second device from silently overwriting updates made after a read.
- Cloud downloads wait while a dialog or editable field is active, preserving drafts.
- **Pause sync** stops new work. A request already accepted by the server may finish;
  it cannot overwrite newer server revisions.
- **Clear all data** clears this browser only and resets the sync connection. It does
  not delete cloud data. Choose the cloud copy again to recover it. If you explicitly
  choose to upload the empty local copy, that replaces the cloud data.
- Importing a backup while automatic sync is active will synchronize the restored data.
- Configured deployments show a sign-in screen before mounting any financial components.
  Each user's local data, categories, reminders, and preferences are stored under their
  Supabase project and user ID. Switching accounts remounts a different workspace; there
  is no fallback to another user's local records.
- Sign-out immediately hides the dashboard, stops sync and aborts workspace requests.
  Requests are bound to the workspace's captured token, so an old request cannot use a
  new login's credentials. A request already committed on the server cannot be undone.
- Signing out retains the user's separate local cache for their next login. These caches
  are not encrypted: someone with access to browser developer tools or the browser profile
  can inspect local storage. This is UI/account isolation, not an encrypted local vault.
  Use trusted devices. Signing out here uses local scope; other devices remain signed in.
- On upgrade, old shared local keys are backed up before removal. Only the account with an
  existing session at initial startup is offered the previous browser data, with explicit
  confirmation. Other logins start separate. If startup had no session or the session
  changed during startup, old data is preserved in a recovery copy but isn't assigned to
  a new login. Sign in and use your cloud copy or import your previously exported JSON.
  Back up before upgrading if there are unsynced local edits.
- Theme, wallet design, Net Balance visibility, and activity filters stay local.
  Account-specific properties, including card colors, order, archive status, and amount
  masking, are included with account records.
- Data is protected by Supabase access controls; this is **not end-to-end encryption**.
  Project administrators can access the database. JSON exports remain independent backups.
- Payloads are limited to 10 MB. The Free plan's pause/storage/bandwidth limits still apply.

## Verify before relying on it

Live verification needs your own configured project:

1. Sign in on two devices. Upload from one, download on the other, then add/edit/delete
   transactions and confirm the second device updates after a foreground poll.
2. Confirm debts, repayments, savings allocations, bills, income plans, and buffer survive.
3. Edit different records while both devices are offline, reconnect, and verify a conflict
   pauses sync instead of silently deleting either version. Back up both before resolving.
4. Confirm a signed-out client cannot read snapshots or execute the save function.
5. Use a second test login; confirm it cannot read the first user's record even with an
   explicit first-user `user_id` filter. It cannot supply an owner to the write function.
6. Confirm clearing local data pauses sync and leaves the remote copy recoverable.

Local automated tests exercise the synchronization engine and UI with a fake backend.
They do not replace these live Auth, SQL, access-control, and cross-device checks.

## Official references

- [Email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [SMTP setup and restrictions](https://supabase.com/docs/guides/auth/auth-smtp)
- [Publishable versus secret API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase pricing](https://supabase.com/pricing)
