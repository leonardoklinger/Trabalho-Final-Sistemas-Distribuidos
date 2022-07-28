const Soap = require("soap")
const Url = process.env.URL_SOAP_ONLINE
const { badRequest, mensagemErro } = require("../services/Utils")
const cache = require("../services/Cache")

class Hoteis {
    procurarPaisPorMoeda = (req, res) => {
        const { query, headers } = req
        const { moeda } = query

        this.verificarResultado(headers.accept, moeda, res)
    }

    metodoProcurar = (moeda, callback) => {
        try {
            Soap.createClient(Url, (err, client) => {
                client.CountriesUsingCurrency({ sISOCurrencyCode: moeda }, function (err, result) {
                    callback(result)
                })
            })
        } catch (error) {
            callback(error)
        }
    }

    formatoDoResultadoFinal = (header, resultadoDado) => {
        switch (header) {
            case "application/json":
                return this.formatoJSON(resultadoDado)

            case "application/xml":
                return this.formatoXML(resultadoDado)

            default:
                return mensagemErro.header
        }
    }

    formatoJSON = (resultadoDado) => {
        const { sISOCode, sName } = resultadoDado.CountriesUsingCurrencyResult.tCountryCodeAndName[0]

        const json = {
            "Moeda": {
                "sISOCode": sISOCode,
                "NomePais": sName
            }
        }

        return json
    }

    formatoXML = (resultadoDado) => {
        const { sISOCode, sName } = resultadoDado.CountriesUsingCurrencyResult.tCountryCodeAndName[0]
        let xml = `
                <Moeda>
                    <sISOCode>${sISOCode}</sISOCode>
                    <NomePais>${sName}</NomePais>
                </Moeda>`

        return xml
    }

    async dadosEmCache(key, headers, res) {
        const temCache = await cache.get(key)
        if (temCache) {
            res.status(200).send(this.formatoDoResultadoFinal(headers, temCache))
            return true
        } else {
            return false
        }
    }

    verificarResultado = (headers, moeda, res) => {
        this.metodoProcurar(moeda, async (resultado) => {
            if (!resultado.CountriesUsingCurrencyResult) {
                return badRequest(res, `${mensagemErro.moeda}`)
            }

            let cacheado = await this.dadosEmCache(moeda, headers, res)
            if (cacheado) return cacheado

            cache.set(moeda, resultado, 60 * 1)
            res.status(200).send(this.formatoDoResultadoFinal(headers, resultado))
        })
    }
}

module.exports = new Hoteis()