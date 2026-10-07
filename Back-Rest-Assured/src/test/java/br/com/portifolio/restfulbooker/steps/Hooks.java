package br.com.portifolio.restfulbooker.steps;

import br.com.portifolio.restfulbooker.context.HttpLog;
import br.com.portifolio.restfulbooker.context.ScenarioContext;
import br.com.portifolio.restfulbooker.models.AuthResponse;
import br.com.portifolio.restfulbooker.models.Credentials;
import br.com.portifolio.restfulbooker.services.AuthService;
import br.com.portifolio.restfulbooker.services.BookingService;
import io.cucumber.java.After;
import io.cucumber.java.Scenario;

public class Hooks {

    private final ScenarioContext context;
    private final HttpLog log;
    private final AuthService authService;
    private final BookingService bookingService;

    public Hooks(ScenarioContext context, HttpLog log, AuthService authService, BookingService bookingService) {
        this.context = context;
        this.log = log;
        this.authService = authService;
        this.bookingService = bookingService;
    }

    /** Remove reservas que o cenário criou e não excluiu (ex.: tentativa com token inválido). */
    @After(order = 10)
    public void limparReservas() {
        if (context.bookingId() != null) {
            String token = authService.createToken(Credentials.valid()).as(AuthResponse.class).token();
            bookingService.delete(context.bookingId(), token);
        }
    }

    /** Anexa todo o tráfego HTTP do cenário ao relatório (executa antes da limpeza). */
    @After(order = 20)
    public void anexarLogHttp(Scenario scenario) {
        if (!log.isEmpty()) {
            scenario.attach(log.content(), "text/plain", "Requisições e respostas HTTP");
        }
    }
}
