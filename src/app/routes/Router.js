const { Router } = require("express")
const { procurar } = require("../controllers/Hoteis")

const router = Router()

router.get("/hoteis", procurar)

module.exports = {
    router
}