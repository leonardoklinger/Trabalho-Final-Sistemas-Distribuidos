const Soap = require("soap")
const Url = process.env.URL_SOAP_ONLINE
const { badRequest, mensagemErro } = require("../services/Utils")
const cache = require("../services/Cache")

class Hoteis {
    procurarMoedaDoPais = (req, res) => {
        const { query, headers } = req
        const { pais } = query

        this.verificarResultado(headers.accept, pais, res)
    }

    metodoProcurar = (pais, callback) => {
        try {
            Soap.createClient(Url, (err, client) => {
                client.CountryCurrency({ sCountryISOCode: pais }, function (err, result) {
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
        const { sISOCode, sName } = resultadoDado.CountryCurrencyResult

        const json = {
            "Moeda": {
                "sISOCode": sISOCode,
                "NomePais": sName
            }
        }

        return json
    }

    formatoXML = (resultadoDado) => {
        const { sISOCode, sName } = resultadoDado.CountryCurrencyResult
        let xml = `
                <Moeda>
                    <sISOCode>${sISOCode}</sISOCode>
                    <NomePais>${sName}</NomePais>
                </Moeda>`

        return xml
    }

    dadosEmCache = async (key, headers, res) => {
        const temCache = await cache.get(key)
        if (temCache) {
            res.status(200).send(this.formatoDoResultadoFinal(headers, temCache))
            return true
        } else {
            return false
        }
    }

    verificarResultado = (headers, pais, res) => {
        this.metodoProcurar(pais, async (resultado) => {
            if (!Boolean(resultado.CountryCurrencyResult.sISOCode)) {
                return badRequest(res, `${mensagemErro.moeda}`)
            }

            let cacheado = await this.dadosEmCache(pais, headers, res)
            if (cacheado) return cacheado

            cache.set(pais, resultado, 60 * 1)
            res.status(200).send(this.formatoDoResultadoFinal(headers, resultado))
        })
    }
}

module.exports = new Hoteis()