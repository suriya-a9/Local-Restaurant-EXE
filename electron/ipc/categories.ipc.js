const { ipcMain } = require("electron");

const {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} = require("../repositories/categories.repository");

function registerCategoryIpc() {
    ipcMain.handle(
        "categories:getAll",
        (event, clientId) => {
            return getAllCategories(clientId);
        }
    );

    ipcMain.handle(
        "categories:create",
        (event, data) => {
            return createCategory(data);
        }
    );

    ipcMain.handle(
        "categories:update",
        (event, data) => {
            return updateCategory(data);
        }
    );

    ipcMain.handle(
        "categories:delete",
        (event, { id, clientId }) => {
            return deleteCategory(id, clientId);
        }
    );
}

module.exports = {
    registerCategoryIpc,
};