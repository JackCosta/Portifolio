package br.com.portifolio.restfulbooker.steps;

import br.com.portifolio.restfulbooker.config.Config;
import br.com.portifolio.restfulbooker.context.ScenarioContext;
import io.cucumber.java.pt.Então;
import io.restassured.response.Response;

import java.nio.charset.StandardCharsets;

import static io.restassured.module.jsv.JsonSchemaValidator.matchesJsonSchemaInClasspath;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Validações genéricas de resposta: status, headers, corpo, contrato e tempo.
 */
public class CommonSteps {

    private final ScenarioContext context;

    public CommonSteps(ScenarioContext context) {
        this.context = context;
    }

    @Então("o status code da resposta deve ser {int}")
    public void statusCode(int esperado) {
        assertThat(context.lastResponse().statusCode()).as("status code").isEqualTo(esperado);
    }

    @Então("o header {string} deve ser {string}")
    public void headerIgual(String nome, String esperado) {
        assertThat(context.lastResponse().header(nome)).as("header " + nome).isEqualTo(esperado);
    }

    @Então("o header {string} deve conter {string}")
    public void headerContem(String nome, String esperado) {
        assertThat(context.lastResponse().header(nome)).as("header " + nome).contains(esperado);
    }

    @Então("o header {string} deve estar presente")
    public void headerPresente(String nome) {
        assertThat(context.lastResponse().header(nome)).as("header " + nome).isNotBlank();
    }

    @Então("o header \"Content-Length\" deve corresponder ao tamanho do corpo")
    public void contentLengthCorreto() {
        Response response = context.lastResponse();
        int tamanhoCorpo = response.asByteArray().length;
        assertThat(response.header("Content-Length")).as("Content-Length").isEqualTo(String.valueOf(tamanhoCorpo));
    }

    @Então("o corpo da resposta deve ser {string}")
    public void corpoIgual(String esperado) {
        assertThat(new String(context.lastResponse().asByteArray(), StandardCharsets.UTF_8)).isEqualTo(esperado);
    }

    @Então("o corpo da resposta deve respeitar o contrato {string}")
    public void contrato(String schema) {
        org.hamcrest.MatcherAssert.assertThat(context.lastResponse().asString(),
                matchesJsonSchemaInClasspath("schemas/" + schema + ".json"));
    }

    @Então("o tempo de resposta deve ser aceitável")
    public void tempoAceitavel() {
        long limite = Config.maxResponseTimeMs();
        assertThat(context.lastResponse().time()).as("tempo de resposta (ms)").isLessThan(limite);
    }
}
