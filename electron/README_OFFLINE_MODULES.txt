Offline module update

Added Electron IPC + SQLite repositories for:
- Unit Types
- Sub Categories
- Business Locations
- Employees
- Tax Rates (needed by Products)
- Products

Existing Categories support is preserved.

IMPORTANT:
1. Install bcryptjs in your Electron project root before running:
   npm install bcryptjs

2. Keep your existing better-sqlite3 dependency.

3. Employees uses SQLite roles. If the roles table is empty, the local UI falls back to cashier/manager/waiter and persists the selected role on first employee creation. Later, when bootstrap sync is implemented, replace this fallback with server-synced roles.

4. Product image files are converted to a data URL and stored in the SQLite products.image TEXT field for now. This keeps offline creation simple. Later you can move image storage to an Electron userData/images folder.

5. These changes only make the listed CRUD flows local/offline. They do NOT yet synchronize SQLite back to PostgreSQL. Sync queue/bootstrap comes next.
