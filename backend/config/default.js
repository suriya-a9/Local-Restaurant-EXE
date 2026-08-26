require('dotenv').config();

const config = {
    db_user: process.env.DB_USER,
    db_host: process.env.DB_HOST,
    db_name: process.env.DB_NAME,
    db_password: process.env.DB_PASSWORD,
    db_port: process.env.DB_PORT,
    port: process.env.PORT,
    node_env: process.env.NODE_ENV,
    jwt_secret: process.env.JWT_SECRET
}
module.exports = config;