const notesRouter = require("express").Router()
const jwt = require("jsonwebtoken")
const { notesModel } = require("../models")

const getTokenFrom = request => {
    const authorization = request.get("authorization")
    if (authorization && authorization.startsWith("Bearer ")) {
        return authorization.replace("Bearer ", "")
    }
    return null
}

notesRouter.get('/', async (request, response) => {
    try {
        const notes = await notesModel.getAllNotes()
        response.json(notes)
    } catch (err) {
        response.status(500).json({ error: err.message })
    }
})

notesRouter.get('/:id', async (request, response) => {
    const id = Number(request.params.id)
    try {
        await notesModel.getNoteById(id).then(
            note => note ? response.json(note) : response.status(404).end()
        )
    } catch (err) {
        response.status(500).json({ error: err.message })
    }
})

notesRouter.delete('/:id', async (request, response) => {
    const id = Number(request.params.id)
    try {
        await notesModel.deleteNoteById(id)
        response.status(204).end()
    } catch (err) {
        response.status(500).json({ error: err.message })
    }
})

notesRouter.post('/', async (request, response) => {
    const note = request.body
    const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
    if (!decodedToken.id) {
        return response.status(401).json({ error: "token invalid" })
    }

    if (!note.content) {
        return response.status(400).json({ error: 'content missing' })
    }
    const newNote = {
        content: note.content,
        important: Boolean(note.important) || false,
        userId: decodedToken.id
    }
    try {
        const insertedNote = await notesModel.insertNote(newNote)
        response.json(insertedNote)
    } catch (err) {
        response.status(500).json({ error: err.message })
    }
})

module.exports = notesRouter