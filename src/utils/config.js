require('dotenv').config()

const requiredSecret = name => {
    const value = process.env[name]
    if (!value || value.length < 32) {
        throw new Error(`${name} debe estar definido y tener al menos 32 caracteres`)
    }
    return value
}

const port = Number(process.env.PORT || 3000)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT debe ser un entero entre 1 y 65535')
}

module.exports = {
    PORT: port,
    JWT_SECRET: requiredSecret('JWT_SECRET'),
    JWT_REFRESH_SECRET: requiredSecret('JWT_REFRESH_SECRET'),
    CORS_ORIGINS: (process.env.CORS_ORIGINS || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean)
}
