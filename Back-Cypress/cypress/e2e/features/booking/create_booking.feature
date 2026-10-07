# language: pt
@booking @post
Funcionalidade: Criação de reserva (POST /booking)
  Como consumidor da API Restful Booker
  Quero cadastrar novas reservas
  Para registrar a hospedagem de um cliente

  @smoke @regression
  Cenário: Criar reserva com dados válidos
    Quando eu cadastro uma reserva com dados válidos
    Então o status code da resposta deve ser 200
    E a resposta deve ser JSON
    E o corpo da resposta deve respeitar o contrato "reserva criada"
    E a resposta deve conter o id da reserva criada
    E os dados da reserva criada devem ser iguais aos enviados
    E a reserva deve estar disponível para consulta
    E o tempo de resposta deve ser aceitável

  @regression
  Cenário: Criar reserva sem o campo opcional additionalneeds
    Quando eu cadastro uma reserva sem o campo "additionalneeds"
    Então o status code da resposta deve ser 200
    E a resposta deve conter o id da reserva criada
    E os dados da reserva criada devem ser iguais aos enviados

  @negative @regression
  Cenário: Rejeitar corpo com JSON malformado
    Quando eu cadastro uma reserva com o corpo "{firstname: Ana"
    Então o status code da resposta deve ser 400
    E a resposta deve ser texto com a mensagem "Bad Request"

  @negative @regression
  Cenário: Rejeitar header Accept não suportado
    Quando eu cadastro uma reserva com o header Accept "text/plain"
    Então o status code da resposta deve ser 418
    E a resposta deve ser texto com a mensagem "I'm a Teapot"

  # ---- Defeitos conhecidos: verificam o comportamento correto e falham enquanto a API não for corrigida ----

  @bug @negative
  Esquema do Cenário: [BUG] Criar reserva sem o campo obrigatório <campo> deveria retornar 400
    Quando eu cadastro uma reserva sem o campo "<campo>"
    Então o status code da resposta deve ser 400

    Exemplos:
      | campo                 |
      | firstname             |
      | lastname              |
      | totalprice            |
      | depositpaid           |
      | bookingdates          |
      | bookingdates.checkin  |
      | bookingdates.checkout |

  @bug @negative
  Cenário: [BUG] Criar reserva com corpo vazio deveria retornar 400
    Quando eu cadastro uma reserva com o corpo vazio
    Então o status code da resposta deve ser 400

  @bug @negative
  Esquema do Cenário: [BUG] Criar reserva com <campo> de tipo inválido deveria retornar 400
    Quando eu cadastro uma reserva com o campo "<campo>" igual a "<valor>"
    Então o status code da resposta deve ser 400

    Exemplos:
      | campo       | valor          |
      | totalprice  | "cem"          |
      | depositpaid | "sim"          |
      | firstname   | 123            |
      | bookingdates | "2026-11-01"  |
