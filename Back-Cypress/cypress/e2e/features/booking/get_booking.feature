# language: pt
@booking @get
Funcionalidade: Consulta de reservas (GET /booking e GET /booking/:id)
  Como consumidor da API Restful Booker
  Quero consultar reservas, com ou sem filtros
  Para obter os IDs e os dados das reservas existentes

  @smoke @regression
  Cenário: Listar todas as reservas
    Quando eu consulto a lista de reservas
    Então o status code da resposta deve ser 200
    E a resposta deve ser JSON
    E a lista não deve estar vazia
    E o corpo da resposta deve respeitar o contrato "lista de reservas"
    E o tempo de resposta deve ser aceitável

  @regression
  Cenário: Filtrar reservas por nome e sobrenome
    Dado que existe uma reserva cadastrada
    Quando eu consulto as reservas filtrando pelo nome da reserva cadastrada
    Então o status code da resposta deve ser 200
    E a resposta deve ser JSON
    E a lista deve conter a reserva cadastrada
    E o corpo da resposta deve respeitar o contrato "lista de reservas"

  @regression
  Cenário: Filtrar reservas por data de checkin anterior à da reserva
    Dado que existe uma reserva cadastrada
    Quando eu consulto as reservas pelo "checkin" 1 dia antes do da reserva cadastrada
    Então o status code da resposta deve ser 200
    E a lista deve conter a reserva cadastrada

  @regression
  Cenário: Filtrar reservas por data de checkout igual à da reserva
    Dado que existe uma reserva cadastrada
    Quando eu consulto as reservas pelo "checkout" igual ao da reserva cadastrada
    Então o status code da resposta deve ser 200
    E a lista deve conter a reserva cadastrada

  @regression
  Cenário: Filtro sem correspondência retorna lista vazia
    Quando eu consulto as reservas com o filtro "firstname" igual a "NomeQueNaoExiste9z8y7x"
    Então o status code da resposta deve ser 200
    E a resposta deve ser JSON
    E a lista deve estar vazia

  @smoke @regression
  Cenário: Consultar uma reserva pelo ID
    Dado que existe uma reserva cadastrada
    Quando eu consulto a reserva cadastrada
    Então o status code da resposta deve ser 200
    E a resposta deve ser JSON
    E o corpo da resposta deve respeitar o contrato "reserva"
    E os dados retornados devem ser iguais aos da reserva cadastrada
    E o tempo de resposta deve ser aceitável

  @regression
  Cenário: Consultar uma reserva no formato XML
    Dado que existe uma reserva cadastrada
    Quando eu consulto a reserva cadastrada no formato "XML"
    Então o status code da resposta deve ser 200
    E o corpo deve ser um XML com os dados da reserva cadastrada

  @negative @regression
  Esquema do Cenário: Consultar reserva com ID <descricao>
    Quando eu consulto a reserva de id "<id>"
    Então o status code da resposta deve ser 404
    E a resposta deve ser texto com a mensagem "Not Found"

    Exemplos:
      | descricao    | id        |
      | inexistente  | 999999999 |
      | não numérico | abc       |
      | negativo     | -1        |

  # ---- Defeitos conhecidos: verificam o comportamento correto e falham enquanto a API não for corrigida ----

  @bug @negative
  Cenário: [BUG] Filtro com data em formato inválido deveria retornar 400
    Quando eu consulto as reservas com o filtro "checkin" igual a "data-invalida"
    Então o status code da resposta deve ser 400

  @bug
  Cenário: [BUG] Filtro de checkin deveria incluir a data informada (>=)
    Dado que existe uma reserva cadastrada
    Quando eu consulto as reservas pelo "checkin" igual ao da reserva cadastrada
    Então a lista deve conter a reserva cadastrada

  @bug
  Cenário: [BUG] Filtro de checkout deveria retornar checkouts posteriores à data informada (>=)
    Dado que existe uma reserva cadastrada
    Quando eu consulto as reservas pelo "checkout" 1 dia antes do da reserva cadastrada
    Então a lista deve conter a reserva cadastrada

  @bug
  Cenário: [BUG] Resposta XML deveria ter content-type application/xml
    Dado que existe uma reserva cadastrada
    Quando eu consulto a reserva cadastrada no formato "XML"
    Então o header "content-type" deve conter "application/xml"
