const pool = require("../../../config/db");

const getAllRoles = async () => {
    const query = `SELECT id, name FROM roles ORDER BY name;`;

    const result = await pool.query(query);

    return result.rows;
};

const findRoleByName = async (name) => {
    const query = `SELECT id, name FROM roles WHERE name = $1;`;

    const result = await pool.query(query, [name]);

    return result.rows[0];
};

const findLocationForClient = async (location_id, client_id) => {
    const query = `
        SELECT id, name, code FROM business_locations
        WHERE id = $1 AND client_id = $2;
    `;

    const result = await pool.query(query, [location_id, client_id]);

    return result.rows[0];
};

const createEmployee = async (data) => {
    const {
        client_id,
        business_location_id,
        role_id,
        name,
        email,
        password,
        phone,
        designation,
        date_of_joining,
        salary,
    } = data;

    const query = `
        INSERT INTO employees
            (client_id, business_location_id, role_id, name, email, password, phone, designation, date_of_joining, salary)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, client_id, business_location_id, role_id, name, email, phone, designation, date_of_joining, salary, created_at, updated_at;
    `;

    const values = [
        client_id,
        business_location_id,
        role_id,
        name,
        email,
        password,
        phone || null,
        designation || null,
        date_of_joining || null,
        salary ?? null,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const findEmployeeByEmail = async (client_id, email) => {
    const query = `
        SELECT id FROM employees
        WHERE client_id = $1 AND email = $2;
    `;

    const result = await pool.query(query, [client_id, email]);

    return result.rows[0];
};

const findEmployeeByName = async (client_id, name) => {
    const result = await pool.query(
        `SELECT id FROM employees WHERE client_id = $1 AND LOWER(name) = LOWER($2);`,
        [client_id, name]
    );
    return result.rows[0];
};

const findEmployeeLoginByName = async (name) => {
    const query = `
        SELECT
            e.id,
            e.client_id,
            e.business_location_id,
            e.name,
            e.email,
            e.password,
            c.name AS client_name,
            c.status AS client_status,
            json_build_object('id', bl.id, 'name', bl.name, 'code', bl.code) AS business_location,
            r.name AS role
        FROM employees e
        JOIN clients c ON c.id = e.client_id
        JOIN business_locations bl ON bl.id = e.business_location_id
        JOIN roles r ON r.id = e.role_id
        WHERE LOWER(e.name) = LOWER($1);
    `;

    const result = await pool.query(query, [name]);

    return result.rows[0];
};

const findEmployeeByEmailExcludingId = async (client_id, email, excludeId) => {
    const query = `
        SELECT id FROM employees
        WHERE client_id = $1 AND email = $2 AND id != $3;
    `;

    const result = await pool.query(query, [client_id, email, excludeId]);

    return result.rows[0];
};

const findEmployeeByNameExcludingId = async (client_id, name, excludeId) => {
    const result = await pool.query(
        `SELECT id FROM employees WHERE client_id = $1 AND LOWER(name) = LOWER($2) AND id != $3;`,
        [client_id, name, excludeId]
    );
    return result.rows[0];
};

const findEmployeeById = async (id, client_id) => {
    const query = `
        SELECT
            e.id, e.client_id, e.business_location_id, e.role_id,
            e.name, e.email, e.phone, e.designation, e.date_of_joining, e.salary,
            e.created_at, e.updated_at,
            json_build_object('id', bl.id, 'name', bl.name, 'code', bl.code) AS business_location,
            json_build_object('id', r.id, 'name', r.name) AS role
        FROM employees e
        JOIN business_locations bl ON bl.id = e.business_location_id
        JOIN roles r ON r.id = e.role_id
        WHERE e.id = $1 AND e.client_id = $2;
    `;

    const result = await pool.query(query, [id, client_id]);

    return result.rows[0];
};

const getEmployeesByClient = async (client_id) => {
    const query = `
        SELECT
            e.id, e.client_id, e.business_location_id, e.role_id,
            e.name, e.email, e.phone, e.designation, e.date_of_joining, e.salary,
            e.created_at, e.updated_at,
            json_build_object('id', bl.id, 'name', bl.name, 'code', bl.code) AS business_location,
            json_build_object('id', r.id, 'name', r.name) AS role
        FROM employees e
        JOIN business_locations bl ON bl.id = e.business_location_id
        JOIN roles r ON r.id = e.role_id
        WHERE e.client_id = $1
        ORDER BY e.created_at DESC;
    `;

    const result = await pool.query(query, [client_id]);

    return result.rows;
};

const updateEmployee = async (id, data) => {
    const {
        business_location_id,
        role_id,
        name,
        email,
        phone,
        designation,
        date_of_joining,
        salary,
    } = data;

    const query = `
        UPDATE employees
        SET business_location_id = $1,
            role_id = $2,
            name = $3,
            email = $4,
            phone = $5,
            designation = $6,
            date_of_joining = $7,
            salary = $8,
            updated_at = NOW()
        WHERE id = $9
        RETURNING id, client_id, business_location_id, role_id, name, email, phone, designation, date_of_joining, salary, updated_at;
    `;

    const values = [
        business_location_id,
        role_id,
        name,
        email,
        phone || null,
        designation || null,
        date_of_joining || null,
        salary ?? null,
        id,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const updateEmployeePassword = async (id, hashedPassword) => {
    const query = `
        UPDATE employees
        SET password = $1, updated_at = NOW()
        WHERE id = $2;
    `;

    await pool.query(query, [hashedPassword, id]);
};

const deleteEmployee = async (id) => {
    const query = `
        DELETE FROM employees
        WHERE id = $1
        RETURNING id;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
};

module.exports = {
    getAllRoles,
    findRoleByName,
    findLocationForClient,
    createEmployee,
    findEmployeeByEmail,
    findEmployeeByName,
    findEmployeeLoginByName,
    findEmployeeByEmailExcludingId,
    findEmployeeByNameExcludingId,
    findEmployeeById,
    getEmployeesByClient,
    updateEmployee,
    updateEmployeePassword,
    deleteEmployee,
};