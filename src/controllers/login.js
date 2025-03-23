const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const userModel = require('../models/users')

loginRouter.post('/', async (request, response) => {
    const { username, password } = request.body

    const user = await userModel.getUserByUsername(username)

    const passwordCorrect = user
        ? await bcrypt.compare(password, user.passwordHash)
        : false

    if (!(user && passwordCorrect)) {
        return response.status(401).json({
            error: 'invalid username or password'
        })
    }

    const userForToken = {
        username: user.username,
        id: user.id,
        role: user.role_id  // Include role in token
    }

    const token = jwt.sign(userForToken, process.env.SECRET, {
        expiresIn: '24h'  // Token expires in 24 hours
    })

    response
        .status(200)
        .send({ 
            token, 
            username: user.username, 
            name: user.name,
            role: user.role_id,  // Include role in response
            email: user.email 
        })
})

module.exports = loginRouter