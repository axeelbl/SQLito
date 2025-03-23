const info = (...params) => {
    console.log(new Date().toISOString(), ...params)
}

const error = (...params) => {
    console.error(new Date().toISOString(), ...params)
}

module.exports = {
    info,
    error
}