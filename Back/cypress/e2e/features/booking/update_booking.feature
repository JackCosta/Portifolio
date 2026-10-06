# language: pt
@booking @put
Funcionalidade: Atualização de reserva (PUT /booking/:id)
  Como consumidor autenticado da API Restful Booker
  Quero atualizar todos os dados de uma reserva
  Para corrigir ou alterar a hospedagem de um cliente

  Contexto:
    Dado que existe uma reserva cadastrada

  @smoke @regression
  Esquema do Cenário: Atualizar reserva autenticando via <metodo>
    Quando eu atualizo a reserva cadastrada usando autenticação "<autenticacao>"
    Então o status code da resposta deve ser 200
    E a resposta deve ser JSON
    E o corpo da resposta deve respeitar o contrato "reserva"
    E os dados retornados devem ser iguais aos da atualização
    E a reserva deve refletir os dados da atualização

    Exemplos:
      | metodo                        | autenticacao |
      | cookie com token              | token        |
      | header Authorization (Basic)  | basic        |

  @negative @regression
  Esquema do Cenário: Rejeitar atualização com <caso>
    Quando eu atualizo a reserva cadastrada usando autenticação "<autenticacao>"
    Então o status code da resposta deve ser 403
    E a resposta deve ser texto com a mensagem "Forbidden"
    E a reserva não deve ter sido alterada

    Exemplos:
      | caso                     | autenticacao   |
      | autenticação ausente     | nenhuma        |
      | token inválido           | token inválido |
      | credenciais Basic erradas | basic inválido |

  @negative @regression
  Esquema do Cenário: Rejeitar atualização sem o campo obrigatório <campo>
    Quando eu atualizo a reserva cadastrada sem o campo "<campo>"
    Então o status code da resposta deve ser 400
    E a resposta deve ser texto com a mensagem "Bad Request"
    E a reserva não deve ter sido alterada

    Exemplos:
      | campo        |
      | firstname    |
      | lastname     |
      | totalprice   |
      | depositpaid  |
      | bookingdates |

  @negative @regression
  Cenário: Rejeitar atualização com JSON malformado
    Quando eu atualizo a reserva cadastrada com o corpo "{firstname: Ana"
    Então o status code da resposta deve ser 400
    E a resposta deve ser texto com a mensagem "Bad Request"
    E a reserva não deve ter sido alterada

  # ---- Defeitos conhecidos: verificam o comportamento correto e falham enquanto a API não for corrigida ----

  @bug @negative
  Cenário: [BUG] Atualizar reserva inexistente deveria retornar 404
    Quando eu atualizo a reserva de id "999999999" usando autenticação "token"
    Então o status code da resposta deve ser 404
