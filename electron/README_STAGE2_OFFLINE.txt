STAGE 2 OFFLINE PATCH
=====================

Adds SQLite/Electron support for:
- client offline login cache
- restaurant tables
- customers
- POS sales + sale items + payments
- Sales page/history/cancel
- KOT printer settings + stations

Already-existing offline modules remain included:
- categories
- sub categories
- units
- business locations
- tax rates
- employees
- products

INSTALL / REPLACE
-----------------
Copy the contents of this folder into:
E:\Restaurant\electron\

Your root package.json is in E:\Restaurant, so bcryptjs should be installed there:
  cd E:\Restaurant
  npm install bcryptjs

LOGIN BEHAVIOR
--------------
The client account must successfully log in ONLINE once on this device.
That verified login is cached locally using a bcrypt password hash.
After that, if the cloud API is unreachable, client login falls back to SQLite.

Employees stored in local SQLite can also authenticate offline using their
locally hashed password.

The super-admin/admin portal remains online/server-only.

DATABASE MIGRATION
------------------
migrations.js creates local_auth_users and adds sale_number to an existing
pos_sales table when needed. Existing restaurant.db data is kept.

TEST
----
1. Start frontend dev server.
2. Start Electron from E:\Restaurant with: npm run electron
3. For the FIRST client login, keep backend/internet available once so login is cached.
4. Log out.
5. Stop backend / disconnect internet.
6. Log in again and test Tables, Customers, POS, Sales, KOT settings.

NOTE
----
This patch makes these modules local/offline. Cloud push/pull synchronization
(sync_queue, bootstrap, conflict handling) is the next stage and is not yet
implemented here.
