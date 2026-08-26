Stage 3: local dashboard + automatic SQLite -> PostgreSQL snapshot sync.

Sync behavior:
- Online client login stores the valid server JWT and API base URL.
- A sync is attempted immediately after online login.
- Electron retries automatically once per hour.
- The frontend also asks for an immediate sync when the browser reports the network is back online.
- Dashboard reads sales/payment totals from SQLite while running in Electron.

Important: this stage PUSHES/UPSERTS existing local rows. It does not yet propagate hard deletes made locally to the server. Add tombstones/incremental queue before relying on local deletes as authoritative sync operations.
