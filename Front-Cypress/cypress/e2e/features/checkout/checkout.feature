# language: pt
@checkout
Funcionalidade: Checkout de compra no SauceDemo
  Como cliente da loja Swag Labs
  Quero adicionar produtos ao carrinho, informar meus dados e finalizar a compra
  Para receber os produtos escolhidos

  # O SauceDemo não possui campos de cartão nem de endereço completo: a etapa de
  # informações pede Nome, Sobrenome e CEP, e o pagamento é fixo ("SauceCard #31337").
  # Os cenários de "endereço incompleto" usam esses campos obrigatórios.

  Regra: Compra realizada pelo usuário padrão

    Contexto:
      Dado que eu estou logado com o usuário "standard_user"

    @positive @smoke
    Cenário: Compra completa com dados válidos
      Então os produtos devem ser exibidos com os preços:
        | produto               | preço  |
        | Sauce Labs Backpack   | $29.99 |
        | Sauce Labs Bike Light | $9.99  |
      Quando eu adiciono ao carrinho os produtos:
        | produto               |
        | Sauce Labs Backpack   |
        | Sauce Labs Bike Light |
      Então o ícone do carrinho deve exibir 2 itens
      E os produtos devem exibir o botão "Remove":
        | produto               |
        | Sauce Labs Backpack   |
        | Sauce Labs Bike Light |
      Quando eu acesso o carrinho
      Então o carrinho deve conter exatamente os produtos:
        | produto               | quantidade | preço  |
        | Sauce Labs Backpack   | 1          | $29.99 |
        | Sauce Labs Bike Light | 1          | $9.99  |
      Quando eu prossigo para o checkout
      Então a etapa de informações do comprador deve ser exibida
      Quando eu preencho os dados do comprador com "cliente válido"
      E eu continuo o checkout
      Então a revisão do pedido deve ser exibida
      E a revisão do pedido deve conter exatamente os produtos:
        | produto               | quantidade | preço  |
        | Sauce Labs Backpack   | 1          | $29.99 |
        | Sauce Labs Bike Light | 1          | $9.99  |
      E a forma de pagamento deve ser "SauceCard #31337"
      E a forma de entrega deve ser "Free Pony Express Delivery!"
      E o resumo deve exibir subtotal "$39.98", taxa "$3.20" e total "$43.18"
      E o subtotal deve corresponder à soma dos preços dos produtos
      E o total deve corresponder ao subtotal somado à taxa
      Quando eu finalizo a compra
      Então a confirmação do pedido deve ser exibida
      E o ícone do carrinho deve estar vazio
      Quando eu volto para a página de produtos
      Então os produtos devem exibir o botão "Add to cart":
        | produto               |
        | Sauce Labs Backpack   |
        | Sauce Labs Bike Light |

    @positive
    Cenário: Remover um produto do carrinho recalcula o pedido
      Dado que eu adicionei ao carrinho os produtos "Sauce Labs Backpack" e "Sauce Labs Bike Light"
      Quando eu acesso o carrinho
      E eu removo do carrinho o produto "Sauce Labs Bike Light"
      Então o carrinho deve conter exatamente os produtos:
        | produto             | quantidade | preço  |
        | Sauce Labs Backpack | 1          | $29.99 |
      E o ícone do carrinho deve exibir 1 itens
      Quando eu prossigo para o checkout
      E eu preencho os dados do comprador com "cliente válido"
      E eu continuo o checkout
      Então o resumo deve exibir subtotal "$29.99", taxa "$2.40" e total "$32.39"
      Quando eu finalizo a compra
      Então a confirmação do pedido deve ser exibida

    @positive
    Cenário: Cancelar na revisão do pedido mantém os produtos no carrinho
      Dado que eu iniciei o checkout com os produtos "Sauce Labs Backpack" e "Sauce Labs Bike Light"
      Quando eu preencho os dados do comprador com "cliente válido"
      E eu continuo o checkout
      E eu cancelo a revisão do pedido
      Então a página de produtos deve ser exibida
      E o ícone do carrinho deve exibir 2 itens

    @negative
    Esquema do Cenário: Não avançar no checkout com dados incompletos: <caso>
      Dado que eu iniciei o checkout com os produtos "Sauce Labs Backpack" e "Sauce Labs Bike Light"
      Quando eu preencho os dados do comprador com "<caso>"
      E eu continuo o checkout
      Então devo ver a mensagem de erro do checkout "<mensagem>"
      E os campos do comprador devem ser destacados com erro
      E devo permanecer na etapa de informações do comprador
      E o ícone do carrinho deve exibir 2 itens

      Exemplos:
        | caso                      | mensagem                       |
        | nome em branco            | Error: First Name is required  |
        | sobrenome em branco       | Error: Last Name is required   |
        | CEP em branco             | Error: Postal Code is required |
        | todos os campos em branco | Error: First Name is required  |

    @negative
    Cenário: Corrigir os dados após o erro permite concluir a compra
      Dado que eu iniciei o checkout com os produtos "Sauce Labs Backpack" e "Sauce Labs Bike Light"
      Quando eu preencho os dados do comprador com "CEP em branco"
      E eu continuo o checkout
      Então devo ver a mensagem de erro do checkout "Error: Postal Code is required"
      Quando eu fecho a mensagem de erro do checkout
      E eu preencho os dados do comprador com "cliente válido"
      E eu continuo o checkout
      Então a revisão do pedido deve ser exibida
      Quando eu finalizo a compra
      Então a confirmação do pedido deve ser exibida

    @negative
    Cenário: Cancelar na etapa de informações volta ao carrinho sem perder os produtos
      Dado que eu iniciei o checkout com os produtos "Sauce Labs Backpack" e "Sauce Labs Bike Light"
      Quando eu cancelo a etapa de informações do comprador
      Então o carrinho deve conter exatamente os produtos:
        | produto               | quantidade | preço  |
        | Sauce Labs Backpack   | 1          | $29.99 |
        | Sauce Labs Bike Light | 1          | $9.99  |

    @bug @negative
    Cenário: [BUG] Checkout não deveria ser permitido com o carrinho vazio
      Quando eu acesso o carrinho
      Então o carrinho deve estar vazio
      E o botão de checkout deve estar desabilitado

    @bug @negative
    Esquema do Cenário: [BUG] Não deveria avançar no checkout com <caso>
      Dado que eu iniciei o checkout com os produtos "Sauce Labs Backpack" e "Sauce Labs Bike Light"
      Quando eu preencho os dados do comprador com "<caso>"
      E eu continuo o checkout
      Então devo permanecer na etapa de informações do comprador

      Exemplos:
        | caso                         |
        | campos com apenas espaços    |
        | CEP com caracteres especiais |

  Regra: Usuários de teste com defeitos conhecidos

    @bug
    Esquema do Cenário: [BUG] <usuário> deveria concluir uma compra com dados válidos
      Dado que eu estou logado com o usuário "<usuário>"
      E que eu iniciei o checkout com os produtos "Sauce Labs Backpack" e "Sauce Labs Bike Light"
      Quando eu preencho os dados do comprador com "cliente válido"
      Então os dados do comprador devem estar preenchidos com "cliente válido"
      Quando eu continuo o checkout
      Então a revisão do pedido deve ser exibida
      Quando eu finalizo a compra
      Então a confirmação do pedido deve ser exibida

      Exemplos:
        | usuário      |
        | problem_user |
        | error_user   |

  Regra: Acesso às etapas da compra exige autenticação

    @negative
    Esquema do Cenário: Bloquear acesso direto a <página> sem login
      Quando eu acesso a página "<página>" sem estar logado
      Então devo ver a mensagem de erro "Epic sadface: You can only access '<página>' when you are logged in."
      E devo permanecer na página de login

      Exemplos:
        | página                  |
        | /cart.html              |
        | /checkout-step-one.html |
        | /checkout-step-two.html |
        | /checkout-complete.html |
