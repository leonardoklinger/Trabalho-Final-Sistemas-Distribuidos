const Soap = require("soap")
const moment = require("moment")
const Url = "http://desktop-fb9keo3:8088/mockParceiroAcomodacaoSOAP?WSDL"
const { badRequest, mensagemErro } = require("../services/Utils")

class Hoteis {
    constructor() {
        this.resultadoArray = []
    }

    procurar = (req, res) => {
        const { query, headers } = req
        const { cidade, dataInicial, dataFinal } = query

        let validacaoGeral = this.validacaoEmGeral(res, cidade, dataInicial, dataFinal, headers.accept)
        if (validacaoGeral) return validacaoGeral

        let conferirDatas = this.validarDatas(res, dataInicial, dataFinal)
        if (conferirDatas) return conferirDatas

        this.procurarHotelPorNomeCidade(cidade, resultado => {
            if (resultado.length === 0) return badRequest(res, `${cidade} ` + mensagemErro.cidadeNaoEncontrada)
            res.status(200).send(this.formatoDoResultadoFinal(headers.accept, resultado))
        })
    }

    procurarHotelPorNomeCidade = (nomeCidade, callback) => {
        try {
            Soap.createClient(Url, (err, client) => {
                client.Buscar(function (err, result) {
                    callback(result.hotel.filter(p => p.endComercial.cidade === String(nomeCidade)))
                })
            })
        } catch (error) {
            callback(error)
        }
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

    validacaoEmGeral = (res, cidade, dataInicial, dataFinal, headers) => {
        if (!cidade) {
            badRequest(res, mensagemErro.cidade)
            return true
        }
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