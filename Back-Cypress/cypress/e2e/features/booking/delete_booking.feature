# language: pt
@booking @delete
Funcionalidade: Exclusão de reserva (DELETE /booking/:id)
  Como consumidor autenticado da API Restful Booker
  Quero excluir uma reserva
  Para cancelar a hospedagem de um cliente

  Contexto:
    Dado que existe uma reserva cadastrada

  @smoke @regression
  Esquema do Cenário: Excluir reserva autenticando via <metodo>
    Quando eu excluo a reserva cadastrada usando autenticação "<autenticacao>"
    Então o status code da resposta deve ser 201
    E a resposta deve ser texto com a mensagem "Created"
    E a reserva não deve mais existir

    Exemplos:
      | metodo                       | autenticacao |
      | cookie com token             | token        |
      | header Authorization (Basic) | basic        |

  @negative @regression
  Esquema do Cenário: Rejeitar exclusão com <caso>
    Quando eu excluo a reserva cadastrada usando autenticação "<autenticacao>"
    Então o status code da resposta deve ser 403
    E a resposta deve ser texto com a mensagem "Forbidden"
    E a reserva ainda deve existir

    Exemplos:
      | caso                      | autenticacao   |
      | autenticação ausente      | nenhuma        |
      | token inválido            | token inválido |
      | credenciais Basic erradas | basic inválido |

  # ---- Defeitos conhecidos: verificam o comportamento correto e falham enquanto a API não for corrigida ----

  @bug @negative
  Cenário: [BUG] Excluir reserva inexistente deveria retornar 404
    Quando eu excluo a reserva de id "999999999" usando autenticação "token"
    Então o status code da resposta deve ser 404

  @bug @negative
  Cenário: [BUG] Excluir reserva já excluída deveria retornar 404
    Dado que eu excluo a reserva cadastrada usando autenticação "token"
    Quando eu excluo a reserva cadastrada usando autenticação "token"
    Então o status code da resposta deve ser 404
