# language: pt
@navigation
Funcionalidade: Navegação após o login até o formulário do comprador
  Como cliente autenticado da loja Swag Labs
  Quero navegar dos produtos até o formulário de dados do comprador
  Para informar meus dados e seguir com a compra

  Contexto:
    Dado que eu fiz login com credenciais válidas

  @positive @smoke
  Cenário: Navegar do login até o formulário de dados do comprador
    Quando eu adiciono os produtos ao carrinho:
      | Sauce Labs Backpack   |
      | Sauce Labs Bike Light |
    Então o carrinho deve indicar 2 produtos
    Quando eu abro o carrinho
    Então devo estar na página do carrinho com os produtos:
      | Sauce Labs Backpack   |
      | Sauce Labs Bike Light |
    Quando eu sigo para o checkout
    Então o formulário de dados do comprador deve ser exibido

  @positive
  Cenário: Enviar o formulário com dados válidos avança para a revisão do pedido
    Quando eu adiciono os produtos ao carrinho:
      | Sauce Labs Backpack |
    E eu abro o carrinho
    E eu sigo para o checkout
    E eu preencho o formulário com dados válidos
    E eu envio o formulário
    Então devo ver a revisão do pedido com os produtos:
      | Sauce Labs Backpack |

  @negative
  Esquema do Cenário: Formulário do comprador com <campo> em branco
    Quando eu adiciono os produtos ao carrinho:
      | Sauce Labs Backpack |
    E eu abro o carrinho
    E eu sigo para o checkout
    E eu preencho o formulário com nome "<nome>", sobrenome "<sobrenome>" e CEP "<cep>"
    E eu envio o formulário
    Então devo ver no formulário a mensagem de erro "<mensagem>"
    E devo permanecer no formulário de dados do comprador

    Exemplos:
      | campo     | nome  | sobrenome | cep       | mensagem                        |
      | nome      |       | Silva     | 01310-100 | Error: First Name is required   |
      | sobrenome | Maria |           | 01310-100 | Error: Last Name is required    |
      | CEP       | Maria | Silva     |           | Error: Postal Code is required  |
      | todos     |       |           |           | Error: First Name is required   |
