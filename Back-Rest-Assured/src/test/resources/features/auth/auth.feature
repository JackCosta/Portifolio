# language: pt
@auth
Funcionalidade: Autenticação - Criação de token (POST /auth)
  Como consumidor da API Restful Booker
  Quero gerar um token de autenticação
  Para acessar os recursos protegidos (PUT, PATCH e DELETE de reservas)

  # ---------------------------------------------------------------- Positivos

  @smoke @positive @regression
  Cenário: Gerar token com credenciais válidas
    Quando eu solicito um token com as credenciais válidas
    Então o status code da resposta deve ser 200
    E a resposta deve conter um token válido
    E o tempo de resposta deve ser aceitável

  @smoke @headers @regression
  Cenário: Validar headers da resposta de sucesso
    Quando eu solicito um token com as credenciais válidas
    Então o status code da resposta deve ser 200
    E o header "Content-Type" deve ser "application/json; charset=utf-8"
    E o header "Content-Length" deve corresponder ao tamanho do corpo
    E o header "ETag" deve estar presente
    E o header "X-Powered-By" deve ser "Express"

  @contract @regression
  Cenário: Validar contrato da resposta de sucesso
    Quando eu solicito um token com as credenciais válidas
    Então o corpo da resposta deve respeitar o contrato "auth-success"

  @positive @regression
  Cenário: Cada solicitação gera um token diferente
    Quando eu solicito 3 tokens com as credenciais válidas
    Então todos os tokens gerados devem ser válidos e diferentes entre si

  @positive @regression
  Cenário: Gerar token ignorando campos adicionais no corpo
    Quando eu solicito um token com o corpo:
      """
      {"username": "admin", "password": "password123", "campoExtra": "ignorado"}
      """
    Então o status code da resposta deve ser 200
    E a resposta deve conter um token válido

  @positive @regression
  Cenário: Gerar token enviando credenciais como formulário
    Quando eu solicito um token com as credenciais válidas via formulário
    Então o status code da resposta deve ser 200
    E a resposta deve conter um token válido

  @integration @positive @regression
  Cenário: Token gerado autoriza operação protegida
    Dado que existe uma reserva cadastrada
    Quando eu excluo a reserva usando o token gerado
    Então o status code da resposta deve ser 201

  # ---------------------------------------------------------------- Negativos

  @negative @regression
  Esquema do Cenário: Não gerar token com <caso>
    Quando eu solicito um token com "<caso>"
    Então o status code da resposta deve ser 200
    E o header "Content-Type" deve ser "application/json; charset=utf-8"
    E a resposta não deve conter token
    E a mensagem de erro deve ser "Bad credentials"
    E o corpo da resposta deve respeitar o contrato "auth-failure"

    Exemplos:
      | caso                  |
      | senha incorreta       |
      | usuário inexistente   |
      | credenciais em branco |
      | usuário em caixa alta |
      | senha em caixa alta   |
      | usuário com espaços   |
      | senha ausente         |
      | usuário ausente       |
      | credenciais nulas     |
      | tipos numéricos       |
      | SQL injection         |
      | corpo vazio           |
      | array vazio           |

  @negative @regression
  Esquema do Cenário: Não gerar token quando o Content-Type é <descricao>
    Quando eu envio as credenciais válidas com Content-Type "<content_type>"
    Então o status code da resposta deve ser 200
    E a resposta não deve conter token
    E a mensagem de erro deve ser "Bad credentials"

    Exemplos:
      | descricao | content_type |
      | texto     | text/plain   |
      | HTML      | text/html    |
      | ausente   |              |

  @negative @regression
  Cenário: Rejeitar corpo com JSON malformado
    Quando eu solicito um token com o corpo:
      """
      {"username": "admin", "password":
      """
    Então o status code da resposta deve ser 400
    E o header "Content-Type" deve ser "text/plain; charset=utf-8"
    E o corpo da resposta deve ser "Bad Request"

  @negative @regression
  Esquema do Cenário: Rejeitar credenciais JSON declaradas como <content_type>
    Quando eu envio as credenciais válidas com Content-Type "<content_type>"
    Então o status code da resposta deve ser 400
    E o corpo da resposta deve ser "Bad Request"

    Exemplos:
      | content_type    |
      | text/xml        |
      | application/xml |

  @negative @regression
  Esquema do Cenário: Método <metodo> não é suportado no endpoint de autenticação
    Quando eu envio uma requisição "<metodo>" para o endpoint de autenticação
    Então o status code da resposta deve ser 404
    E o header "Content-Type" deve conter "text/plain"

    Exemplos:
      | metodo |
      | GET    |
      | PUT    |
      | PATCH  |
      | DELETE |

  @integration @negative @regression
  Cenário: Token inválido não autoriza operação protegida
    Dado que existe uma reserva cadastrada
    Quando eu excluo a reserva usando o token "tokenInvalido123"
    Então o status code da resposta deve ser 403

  # ---------------------------------------------------------------- Bugs conhecidos
  # Excluídos por padrão (not @bug). Documentam o comportamento esperado segundo boas práticas REST.

  @bug @negative
  Cenário: Credenciais inválidas deveriam retornar 401 Unauthorized
    Quando eu solicito um token com "senha incorreta"
    Então o status code da resposta deve ser 401
