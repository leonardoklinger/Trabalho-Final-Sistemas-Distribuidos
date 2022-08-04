const Soap = require("soap")
const moment = require("moment")
const Url = process.env.URL_SOAP
const { badRequest, mensagemErro } = require("../services/Utils")
const cache = require("../services/Cache")

class Hoteis {
    constructor() {
        this.resultadoArray = []
    }

    procurar = (req, res) => {
        const { query, headers } = req
        const { cidade, dataInicial, dataFinal, nomeHotel, estado, nomeRua } = query

        let validacaoGeral = this.validacaoEmGeral(res, dataInicial, dataFinal, headers.accept)
        if (validacaoGeral) return validacaoGeral

        let conferirDatas = this.validarDatas(res, dataInicial, dataFinal)
        if (conferirDatas) return conferirDatas

        this.tipoDeBusca({ cidade: cidade, nomeHotel: nomeHotel, estado: estado, nomeRua: nomeRua }, res, headers)
    }

    metodoProcurar = (callback) => {
        try {
            Soap.createClient(Url, (err, client) => {
                client.Buscar(function (err, result) {
                    callback(result)
                })
            })
        } catch (error) {
            callback(error)
        }
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

    async tipoDeBusca(tipo, res, headers) {
        let contagem = 0
        let tipoBusca = ""
        let cacheado
        for (let tipoObject in tipo) {
            if (tipo[tipoObject]) {
                tipoBusca = tipoObject
                contagem++
            }
        }

        if (contagem > 1) return badRequest(res, mensagemErro.opcao)
        switch (tipoBusca) {
            case "cidade":
                cacheado = await this.dadosEmCache(tipo.cidade, headers.accept, res)
                if (cacheado) return cacheado

                this.procurarHotelPorNomeCidade(tipo.cidade, resultado => {
                    if (resultado.length === 0) return badRequest(res, `${tipo.cidade} ` + mensagemErro.cidadeNaoEncontrada)
                    res.status(200).send(this.formatoDoResultadoFinal(headers.accept, resultado))
                    cache.set(tipo.cidade, resultado, 60 * 1)
                })
                break

            case "nomeHotel":
                cacheado = await this.dadosEmCache(tipo.nomeHotel, headers.accept, res)
                if (cacheado) return cacheado

                this.procurarHotelPeloNome(tipo.nomeHotel, resultado => {
                    if (resultado.length === 0) return badRequest(res, `${tipo.nomeHotel} ` + mensagemErro.HotelNaoEncontrado)
                    res.status(200).send(this.formatoDoResultadoFinal(headers.accept, resultado))
                    cache.set(tipo.nomeHotel, resultado, 60 * 1)
                })
                break

            case "estado":
                cacheado = await this.dadosEmCache(tipo.estado, headers.accept, res)
                if (cacheado) return cacheado

                this.procurarHotelPeloEstado(tipo.estado, resultado => {
                    if (resultado.length === 0) return badRequest(res, mensagemErro.estado + ` ${tipo.estado}`)
                    res.status(200).send(this.formatoDoResultadoFinal(headers.accept, resultado))
                    cache.set(tipo.estado, resultado, 60 * 1)
                })
                break

            case "nomeRua":
                cacheado = await this.dadosEmCache(tipo.nomeRua, headers.accept, res)
                if (cacheado) return cacheado

                this.procurarHotelPeloNomeDaRua(tipo.nomeRua, resultado => {
                    if (resultado.length === 0) return badRequest(res, `${tipo.nomeRua} ` + mensagemErro.rua)
                    res.status(200).send(this.formatoDoResultadoFinal(headers.accept, resultado))
                    cache.set(tipo.nomeRua, resultado, 60 * 1)
                })
                break

            default:
                if (tipo.cidade === "") return badRequest(res, mensagemErro.cidade)
                if (tipo.nomeHotel === "") return badRequest(res, mensagemErro.hotel)
                if (tipo.estado === "") return badRequest(res, mensagemErro.Estado)
                if (tipo.nomeRua === "") return badRequest(res, mensagemErro.Rua)
        }
    }

    procurarHotelPorNomeCidade = (nomeCidade, callback) => {
        this.metodoProcurar(result => {
            callback(result.hotel.filter(p => p.endComercial.cidade === String(nomeCidade)))
        })
    }

    procurarHotelPeloNome = (nomeDoHotel, callback) => {
        this.metodoProcurar(result => {
            callback(result.hotel.filter(p => p.nome === String(nomeDoHotel)))
        })
    }

    procurarHotelPeloEstado = (estado, callback) => {
        this.metodoProcurar(result => {
            callback(result.hotel.filter(p => p.endComercial.estado === String(estado)))
        })
    }

    procurarHotelPeloNomeDaRua = (nomeRua, callback) => {
        this.metodoProcurar(result => {
            callback(result.hotel.filter(p => p.endComercial.logradouro === String(nomeRua)))
        })
    }

    formatoDoResultadoFinal = (header, resultadoDado) => {
        switch (header) {
            case "application/json":
                this.formatoJSON(resultadoDado)
                return this.resultadoArray

            case "application/xml":
                return this.formatoXML(resultadoDado)

            default:
                return mensagemErro.header
        }
    }

    formatoJSON = (resultadoDado) => {
        this.resultadoArray = []
        resultadoDado.forEach(element => {
            this.resultadoArray.push({
                "hoteis": {
                    "hotel": {
                        "name": element.nome,
                        "endereco": element.endComercial.logradouro + ", " + element.endComercial.numero
                    }
                }
            })
        })
    }

    formatoXML = (resultadoDado) => {
        let xml = `<hotels>`

        resultadoDado.forEach(element => {
            xml += `
                <hotel> 
                    <name>${element.nome}</name>
                    <endereco>${element.endComercial.logradouro + ", " + element.endComercial.numero}</endereco>
                </hotel>`
        })

        xml += `</hotels>`
        return xml
    }

    validarDatas = (res, dataInicial, dataFinal) => {
        const dataAtual = moment().format('L').split("/").reverse().join("-"),
            dataInicio = moment(dataInicial).format('L').split("/").reverse().join("-"),
            dataFinalizada = moment(dataFinal).format('L').split("/").reverse().join("-")

            var data_1 = new Date(dataInicio)
            var data_2 = new Date(dataAtual)

        if (dataInicio < dataAtual) {
            badRequest(res, mensagemErro[1])
            return true
        }

        if (dataFinalizada < dataAtual) {
            badRequest(res, mensagemErro[2])
            return true
        }

        if (dataInicio > dataFinalizada) {
            badRequest(res, mensagemErro[3])
            return true
        }
    }

    validacaoEmGeral = (res, dataInicial, dataFinal, headers) => {
        if (!dataInicial) {
            badRequest(res, mensagemErro.dataInicial)
            return true
        }

        if (!dataFinal) {
            badRequest(res, mensagemErro.dataFinal)
            return true
        }

        if (headers === "*/*") {
            badRequest(res, mensagemErro.header)
            return true
        }

    }
}

module.exports = new Hoteis()