require('dotenv').config()

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'tu_secreto_jwt_aqui',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'tu_secreto_refresh_jwt_aqui'
}