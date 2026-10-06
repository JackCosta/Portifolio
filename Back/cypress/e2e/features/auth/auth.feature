# language: pt
@auth
Funcionalidade: Autenticação - Criação de token (POST /auth)
  Como consumidor da API Restful Booker
  Quero gerar um token de autenticação
  Para acessar os recursos protegidos (PUT, PATCH e DELETE de reservas)

  @smoke @regression
  Cenário: Gerar token com credenciais válidas
    Quando eu solicito um token com as credenciais válidas
    Então o status code da resposta deve ser 200
    E a resposta deve conter um token válido
    E o header "content-type" deve conter "application/json"
    E o tempo de resposta deve ser aceitável

  @contract @regression
  Cenário: Validar contrato da resposta de sucesso
    Quando eu solicito um token com as credenciais válidas
    Então o corpo da resposta deve respeitar o contrato "token gerado"

  @regression
  Cenário: Cada solicitação gera um token diferente
    Quando eu solicito dois tokens com as credenciais válidas
    Então os tokens gerados devem ser diferentes

  @negative @regression
  Esquema do Cenário: Não gerar token com <caso>
    Quando eu solicito um token com "<caso>"
    Então o status code da resposta deve ser 200
    E a resposta não deve conter token
    E a mensagem de erro deve ser "Bad credentials"
    E o corpo da resposta deve respeitar o contrato "falha de autenticação"

    Exemplos:
      | caso                  |
      | senha incorreta       |
      | usuário inexistente   |
      | credenciais em branco |
      | usuário em caixa alta |
      | senha ausente         |
      | usuário ausente       |
      | corpo vazio           |

  @negative @regression
  Cenário: Rejeitar corpo com JSON malformado
    Quando eu envio o corpo "{username: admin" para o endpoint de autenticação
    Então o status code da resposta deve ser 400

  @integration @regression
  Cenário: Token gerado autoriza operação protegida
    Dado que existe uma reserva cadastrada
    Quando eu excluo a reserva cadastrada usando autenticação "token"
    Então o status code da resposta deve ser 201

  @integration @negative @regression
  Cenário: Token inválido não autoriza operação protegida
    Dado que existe uma reserva cadastrada
    Quando eu excluo a reserva cadastrada usando autenticação "token inválido"
    Então o status code da resposta deve ser 403
