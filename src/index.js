require("dotenv").config()
const { server } = require("./config/Servidor")
const porta = process.env.PORT || 3000

server.listen(3000, () => {
    console.log(`Api sistema distribuido ligada com sucesso na porta -> ${porta}`)
})
