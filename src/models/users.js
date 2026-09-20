const db = require('../utils/db')

const createUser = user => {
    return new Promise((resolve, reject) => {
        const { username, password, email, name, role = 'SHOPPER' } = user

        const sql = "INSERT INTO users (username, password, email, name, role) VALUES (?, ?, ?, ?, ?)"

        db.run(sql, [username, password, email, name, role], function(err) {
            if (err) {
                reject(err)
            } else {
                resolve({
                    id: this.lastID,
                    username,
                    email,
                    name,
                    role
                })
            }
        })
    })
}

const getAllUsers = () => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT id, username, email, name, role, created_at, updated_at FROM users"

        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        })
    })
}

const getUserById = id => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT id, username, email, name, role, created_at, updated_at FROM users WHERE id = ?"

        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err)
            } else {
                resolve(row)
            }
        })
    })
}

const getUserByUsername = username => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM users WHERE username = ?"

        db.get(sql, [username], (err, row) => {
            if (err) {
                reject(err)
            } else {
                resolve(row)
            }
        })
    })
}

const getUserByEmail = email => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM users WHERE email = ?"

        db.get(sql, [email], (err, row) => {
            if (err) {
                reject(err)
            } else {
                resolve(row)
            }
        })
    })
}

const updateUser = (id, user) => {
    return new Promise((resolve, reject) => {
        const { name, email, password, role } = user
        const fields = ['name = ?', 'email = ?']
        const params = [name, email]

        if (password) {
            fields.push('password = ?')
            params.push(password)
        }
        if (role) {
            fields.push('role = ?')
            params.push(role)
        }

        fields.push('updated_at = CURRENT_TIMESTAMP')
        params.push(id)
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`

        db.run(sql, params, function(err) {
            if (err) {
                reject(err)
            } else {
                getUserById(id)
                    .then(updatedUser => resolve(updatedUser))
                    .catch(err => reject(err))
            }
        })
    })
}

const deleteUser = id => {
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM users WHERE id = ?"

        db.run(sql, [id], function(err) {
            if (err) {
                reject(err)
            } else {
                resolve({ id })
            }
        })
    })
}

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    getUserByUsername,
    getUserByEmail,
    updateUser,
    deleteUser
}
