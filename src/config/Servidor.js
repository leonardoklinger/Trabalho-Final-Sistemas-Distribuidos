const express = require("express")
const { router } = require("../app/routes/Router")

class Servidor {
    constructor() {
        this.server = express()
        this.router()
    }

    router() {
        this.server.use(router)
    }
}

module.exports = new Servidor()