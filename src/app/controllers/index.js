const { procurar } = require("../controllers/Hoteis")
const { procurarCapitalPais } = require("../controllers/CapitalCidade")
const { procurarPaisPorMoeda } = require("../controllers/PaisMoeda")
const { procurarMoedaDoPais } = require("../controllers/TipoMoedaPais")
const { procurarInformacoesPais } = require("../controllers/TodasInformacaoPais")

module.exports = {
    procurar,
    procurarCapitalPais,
    procurarPaisPorMoeda,
    procurarMoedaDoPais,
    procurarInformacoesPais
}