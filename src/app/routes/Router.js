const { Router } = require("express")
const { procurar, procurarCapitalPais, procurarInformacoesPais, procurarMoedaDoPais, procurarPaisPorMoeda } = require("../controllers")

const router = Router()

router.get("/hoteis", procurar)
router.get("/capitalpais", procurarCapitalPais)
router.get("/moeda", procurarPaisPorMoeda)
router.get("/moedaDoPais", procurarMoedaDoPais)
router.get("/informacoesPais", procurarInformacoesPais)

module.exports = {
    router
}