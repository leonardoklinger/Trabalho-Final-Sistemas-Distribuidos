const soap = require("soap")

soap.createClient("http://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso?WSDL", function (err, client) {
    client.CapitalCity({ sCountryISOCode: '' }, function (err, result) {
        console.log(result)
    })
})