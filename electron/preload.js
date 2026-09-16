const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  categories: {
    getAll: (clientId) => ipcRenderer.invoke("categories:getAll", clientId),
    create: (data) => ipcRenderer.invoke("categories:create", data),
    update: (data) => ipcRenderer.invoke("categories:update", data),
    delete: (id, clientId) => ipcRenderer.invoke("categories:delete", { id, clientId }),
  },
  units: {
    getAll: (clientId) => ipcRenderer.invoke("units:getAll", clientId),
    create: (data) => ipcRenderer.invoke("units:create", data),
    update: (data) => ipcRenderer.invoke("units:update", data),
    delete: (id, clientId) => ipcRenderer.invoke("units:delete", { id, clientId }),
  },
  subCategories: {
    getAll: (clientId) => ipcRenderer.invoke("subCategories:getAll", clientId),
    create: (data) => ipcRenderer.invoke("subCategories:create", data),
    update: (data) => ipcRenderer.invoke("subCategories:update", data),
    delete: (id, clientId) => ipcRenderer.invoke("subCategories:delete", { id, clientId }),
  },
  businessLocations: {
    getAll: (clientId) => ipcRenderer.invoke("businessLocations:getAll", clientId),
    create: (data) => ipcRenderer.invoke("businessLocations:create", data),
    update: (data) => ipcRenderer.invoke("businessLocations:update", data),
    delete: (id, clientId) => ipcRenderer.invoke("businessLocations:delete", { id, clientId }),
  },
  taxRates: {
    getAll: (clientId) => ipcRenderer.invoke("taxRates:getAll", clientId),
    create: (data) => ipcRenderer.invoke("taxRates:create", data),
  },
  employees: {
    getAll: (clientId) => ipcRenderer.invoke("employees:getAll", clientId),
    getById: (id, clientId) => ipcRenderer.invoke("employees:getById", { id, clientId }),
    getRoles: () => ipcRenderer.invoke("employees:getRoles"),
    create: (data) => ipcRenderer.invoke("employees:create", data),
    update: (data) => ipcRenderer.invoke("employees:update", data),
    delete: (id, clientId) => ipcRenderer.invoke("employees:delete", { id, clientId }),
  },
  products: {
    getAll: (clientId, locationId = null) => ipcRenderer.invoke("products:getAll", { clientId, locationId }),
    create: (data) => ipcRenderer.invoke("products:create", data),
    update: (data) => ipcRenderer.invoke("products:update", data),
  },
  tables: {
    getAll: (clientId, businessLocationId = null) => ipcRenderer.invoke("tables:getAll", { clientId, businessLocationId }),
    create: (data) => ipcRenderer.invoke("tables:create", data),
    update: (data) => ipcRenderer.invoke("tables:update", data),
    updateStatus: (id, clientId, status) => ipcRenderer.invoke("tables:updateStatus", { id, clientId, status }),
    delete: (id, clientId) => ipcRenderer.invoke("tables:delete", { id, clientId }),
  },
  customers: {
    getAll: (clientId, locationId = null, search = "") => ipcRenderer.invoke("customers:getAll", { clientId, locationId, search }),
    create: (data) => ipcRenderer.invoke("customers:create", data),
  },
  cashSessions: {
    today: (clientId, locationId) => ipcRenderer.invoke("cashSessions:today", { clientId, locationId }),
    open: (clientId, locationId, openingAmount) => ipcRenderer.invoke("cashSessions:open", { clientId, locationId, openingAmount }),
    report: (clientId, locationId) => ipcRenderer.invoke("cashSessions:report", { clientId, locationId }),
    close: (clientId, locationId, closingAmount) => ipcRenderer.invoke("cashSessions:close", { clientId, locationId, closingAmount }),
  },
  sales: {
    create: (data) => ipcRenderer.invoke("sales:create", data),
    getAll: (clientId, locationId = null) => ipcRenderer.invoke("sales:getAll", { clientId, locationId }),
    getById: (clientId, id, locationId = null) => ipcRenderer.invoke("sales:getById", { clientId, id, locationId }),
    cancel: (clientId, id, locationId = null) => ipcRenderer.invoke("sales:cancel", { clientId, id, locationId }),
  },
  kotSettings: {
    getByLocation: (clientId, locationId) => ipcRenderer.invoke("kotSettings:getByLocation", { clientId, locationId }),
    save: (data) => ipcRenderer.invoke("kotSettings:save", data),
    deleteStation: (id, clientId) => ipcRenderer.invoke("kotSettings:deleteStation", { id, clientId }),
  },
  sync: {
    configure: (data) => ipcRenderer.invoke("sync:configure", data),
    now: () => ipcRenderer.invoke("sync:now"),
    pushNow: () => ipcRenderer.invoke("sync:pushNow"),
    pullNow: () => ipcRenderer.invoke("sync:pullNow"),
    status: () => ipcRenderer.invoke("sync:status"),
  },
  dashboard: {
    getSummary: (clientId, options = {}) => ipcRenderer.invoke("dashboard:getSummary", { clientId, ...options }),
  },
  auth: {
    cacheLogin: (data) => ipcRenderer.invoke("auth:cacheLogin", data),
    loginOffline: (name, password) => ipcRenderer.invoke("auth:loginOffline", { name, password }),
  },
});