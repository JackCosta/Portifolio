# language: pt
@booking @methods
Funcionalidade: Métodos HTTP não suportados
  Como consumidor da API Restful Booker
  Quero receber um erro claro ao usar um método não suportado
  Para não executar operações inesperadas

  @regression
  Cenário: Consultar os métodos permitidos na coleção de reservas
    Quando eu envio uma requisição "OPTIONS" para "/booking"
    Então o status code da resposta deve ser 200
    E o header "allow" deve conter "GET, HEAD, POST"

  @negative @regression
  Esquema do Cenário: Rejeitar <metodo> em <rota>
    Quando eu envio uma requisição "<metodo>" para "<rota>"
    Então o status code da resposta deve ser 404
    E a resposta deve ser texto com a mensagem "Not Found"

    Exemplos:
      | metodo | rota       |
      | PUT    | /booking   |
      | PATCH  | /booking   |
      | DELETE | /booking   |
      | POST   | /booking/1 |
      | POST   | /auth/1    |
      | GET    | /auth      |
