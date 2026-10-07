package br.com.portifolio.restfulbooker.steps;

import br.com.portifolio.restfulbooker.context.ScenarioContext;
import br.com.portifolio.restfulbooker.data.AuthDataFactory;
import br.com.portifolio.restfulbooker.models.AuthResponse;
import br.com.portifolio.restfulbooker.models.Credentials;
import br.com.portifolio.restfulbooker.services.AuthService;
import io.cucumber.java.pt.Então;
import io.cucumber.java.pt.Quando;
import io.restassured.http.Method;
import io.restassured.response.Response;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class AuthSteps {

    static final String TOKEN_PATTERN = "^[a-f0-9]{15}$";

    private final AuthService authService;
    private final ScenarioContext context;

    public AuthSteps(AuthService authService, ScenarioContext context) {
        this.authService = authService;
        this.context = context;
    }

    @Quando("eu solicito um token com as credenciais válidas")
    public void solicitarTokenValido() {
        context.addResponse(authService.createToken(Credentials.valid()));
    }

    @Quando("eu solicito {int} tokens com as credenciais válidas")
    public void solicitarVariosTokens(int quantidade) {
        for (int i = 0; i < quantidade; i++) {
            solicitarTokenValido();
        }
    }

    @Quando("eu solicito um token com as credenciais válidas via formulário")
    public void solicitarTokenViaFormulario() {
        Credentials credentials = Credentials.valid();
        context.addResponse(authService.createTokenWithForm(credentials.username(), credentials.password()));
    }

    @Quando("eu solicito um token com {string}")
    public void solicitarTokenComCaso(String caso) {
        context.addResponse(authService.createToken(AuthDataFactory.invalidCredentials(caso)));
    }

    @Quando("eu solicito um token com o corpo:")
    public void solicitarTokenComCorpo(String corpo) {
        context.addResponse(authService.createTokenWithRawBody(corpo, "application/json"));
    }

    @Quando("eu envio as credenciais válidas com Content-Type {string}")
    public void enviarComContentType(String contentType) {
        Credentials c = Credentials.valid();
        String body = "{\"username\":\"%s\",\"password\":\"%s\"}".formatted(c.username(), c.password());
        context.addResponse(authService.createTokenWithRawBody(body, contentType.isBlank() ? null : contentType));
    }

    @Quando("eu envio uma requisição {string} para o endpoint de autenticação")
    public void enviarMetodo(String metodo) {
        context.addResponse(authService.send(Method.valueOf(metodo)));
    }

    @Então("a resposta deve conter um token válido")
    public void respostaContemTokenValido() {
        AuthResponse body = context.lastResponse().as(AuthResponse.class);
        assertThat(body.token()).as("token").isNotBlank().matches(TOKEN_PATTERN);
        assertThat(body.reason()).as("reason").isNull();
    }

    @Então("a resposta não deve conter token")
    public void respostaNaoContemToken() {
        assertThat(context.lastResponse().jsonPath().getMap("$")).doesNotContainKey("token");
    }

    @Então("a mensagem de erro deve ser {string}")
    public void mensagemDeErro(String mensagem) {
        assertThat(context.lastResponse().as(AuthResponse.class).reason()).isEqualTo(mensagem);
    }

    @Então("todos os tokens gerados devem ser válidos e diferentes entre si")
    public void tokensDiferentes() {
        List<Response> responses = context.responses();
        List<String> tokens = responses.stream().map(r -> r.as(AuthResponse.class).token()).toList();

        assertThat(responses).allSatisfy(r -> assertThat(r.statusCode()).isEqualTo(200));
        assertThat(tokens).allSatisfy(t -> assertThat(t).matches(TOKEN_PATTERN)).doesNotHaveDuplicates();
    }
}
