const badRequest = (res, err) => {
    res.status(400).json({
        err
    })
}

const mensagemErro = {
    "1": "Sua data inicial é menor que a data atual!",
    "2": "Sua data final é menor que a data atual!",
    "3": "Sua data inicial é maior que a data final!",
    "header": "Nenhum parametro header encontrado no sistema. Saída: JSON/XML",
    "cidade": "Por favor, informe um cidade!",
    "hotel": "Por favor, informe um hotel!",
    "Estado": "Por favor, informe um estado!",
    "Rua": "Por favor, informe uma rua!",
    "dataInicial": "Por favor, informe uma data inicial!",
    "dataFinal" : "Por favor, informe um data final!",
    "cidadeNaoEncontrada": "é uma cidade inválida",
    "HotelNaoEncontrado": "é um hotel inválido!",
    "opcao": "Só é possivel fazer busca de apenas 1 opção!",
    "estado": "Nenhum hotel cadastrado no estado -> ",
    "rua": "este endereço não está cadastrado em nosso sistema!"
}

module.exports = {
    badRequest,
    mensagemErro
}