# language: pt
@login
Funcionalidade: Login no SauceDemo
  Como cliente da loja Swag Labs
  Quero acessar o sistema com meu usuário e senha
  Para visualizar e comprar os produtos

  Contexto:
    Dado que eu estou na página de login

  @positive @smoke
  Cenário: Exibir a tela de login
    Então a tela de login deve ser exibida corretamente

  @positive @smoke
  Cenário: Login com credenciais válidas
    Quando eu faço login com credenciais válidas
    Então devo ser redirecionado para a página de produtos
    E devo ver 6 produtos listados
    E a sessão deve pertencer ao usuário "standard_user"
    E nenhuma mensagem de erro deve ser exibida

  @positive
  Cenário: Login submetendo o formulário com a tecla Enter
    Quando eu informo o usuário "standard_user" e a senha "secret_sauce" e pressiono Enter
    Então devo ser redirecionado para a página de produtos

  @positive
  Cenário: Logout após login com sucesso
    Dado que eu fiz login com credenciais válidas
    Quando eu faço logout
    Então a tela de login deve ser exibida corretamente
    E a sessão não deve existir

  @negative
  Esquema do Cenário: Não permitir login com <caso>
    Quando eu tento fazer login com "<caso>"
    Então devo ver a mensagem de erro "<mensagem>"
    E os campos de login devem ser destacados com erro
    E devo permanecer na página de login

    Exemplos:
      | caso                      | mensagem                                                                  |
      | usuário e senha em branco | Epic sadface: Username is required                                        |
      | usuário em branco         | Epic sadface: Username is required                                        |
      | senha em branco           | Epic sadface: Password is required                                        |
      | senha incorreta           | Epic sadface: Username and password do not match any user in this service |
      | usuário inexistente       | Epic sadface: Username and password do not match any user in this service |
      | usuário em caixa alta     | Epic sadface: Username and password do not match any user in this service |
      | senha em caixa alta       | Epic sadface: Username and password do not match any user in this service |
      | usuário com espaços       | Epic sadface: Username and password do not match any user in this service |
      | injeção de SQL            | Epic sadface: Username and password do not match any user in this service |
      | usuário bloqueado         | Epic sadface: Sorry, this user has been locked out.                       |

  @negative
  Cenário: Fechar a mensagem de erro
    Quando eu tento fazer login com "senha incorreta"
    E eu fecho a mensagem de erro
    Então nenhuma mensagem de erro deve ser exibida
    E os ícones de erro não devem ser exibidos

  @negative
  Esquema do Cenário: Bloquear acesso direto a <pagina> sem login
    Quando eu acesso a página "<pagina>" sem estar logado
    Então devo ver a mensagem de erro "Epic sadface: You can only access '<pagina>' when you are logged in."
    E devo permanecer na página de login

    Exemplos:
      | pagina                  |
      | /inventory.html         |
      | /cart.html              |
      | /checkout-step-one.html |
