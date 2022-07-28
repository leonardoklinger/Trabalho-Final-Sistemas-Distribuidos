const Soap = require("soap")
const Url = process.env.URL_SOAP_ONLINE
const { badRequest, mensagemErro } = require("../services/Utils")
const cache = require("../services/Cache")

class Hoteis {
    procurarInformacoesPais = (req, res) => {
        const { query, headers } = req
        const { pais } = query

        this.verificarResultado(headers.accept, pais, res)
    }

    metodoProcurar = (pais, callback) => {
        try {
            Soap.createClient(Url, (err, client) => {
                client.FullCountryInfo({ sCountryISOCode: pais }, function (err, result) {
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
        const { sISOCode, sName, sCapitalCity, sPhoneCode, sContinentCode, sCurrencyISOCode, sCountryFlag } = resultadoDado.FullCountryInfoResult

        const json = {
            "InformacoesDoPais": {
                "sISOCode": sISOCode,
                "NomePais": sName,
                "CapitalPais": sCapitalCity,
                "CodigoTelefone": sPhoneCode,
                "CodigoContinente": sContinentCode,
                "CodigoMoeda": sCurrencyISOCode,
                "Bandeira": sCountryFlag,
                "Idioma": {
                    "CodigoIdioma": resultadoDado.FullCountryInfoResult.Languages.tLanguage[0].sISOCode,
                    "NomeIdioma": resultadoDado.FullCountryInfoResult.Languages.tLanguage[0].sName
                }
            }
        }

        return json
    }

    formatoXML = (resultadoDado) => {
        const { sISOCode, sName, sCapitalCity, sPhoneCode, sContinentCode, sCurrencyISOCode, sCountryFlag } = resultadoDado.FullCountryInfoResult

        let xml = `
                <InformacoesDoPais>
                    <sISOCode>${sISOCode}</sISOCode>
                    <NomePais>${sName}</NomePais>
                    <CapitalPais>${sCapitalCity}</CapitalPais>
                    <CodigoTelefone>${sPhoneCode}</CodigoTelefone>
                    <CodigoContinente>${sContinentCode}</CodigoContinente>
                    <CodigoMoeda>${sCurrencyISOCode}</CodigoMoeda>
                    <Bandeira>${sCountryFlag}</Bandeira>
                        <Idioma>
                            <CodigoIdioma>${resultadoDado.FullCountryInfoResult.Languages.tLanguage[0].sISOCode}</Bandeira>
                            <NomeIdioma>${resultadoDado.FullCountryInfoResult.Languages.tLanguage[0].sName}</NomeIdioma>
                        </Idioma>
                </InformacoesDoPais>`

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
            if (!Boolean(resultado.FullCountryInfoResult.sISOCode)) {
                return badRequest(res, `${mensagemErro.pais}`)
            }

            let cacheado = await this.dadosEmCache(pais, headers, res)
            if (cacheado) return cacheado

            cache.set(pais, resultado, 60 * 1)
            res.status(200).send(this.formatoDoResultadoFinal(headers, resultado))
        })
    }
}

module.exports = new Hoteis()