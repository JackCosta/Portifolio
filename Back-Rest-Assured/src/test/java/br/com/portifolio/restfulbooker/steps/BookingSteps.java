package br.com.portifolio.restfulbooker.steps;

import br.com.portifolio.restfulbooker.context.ScenarioContext;
import br.com.portifolio.restfulbooker.models.AuthResponse;
import br.com.portifolio.restfulbooker.models.Credentials;
import br.com.portifolio.restfulbooker.services.AuthService;
import br.com.portifolio.restfulbooker.services.BookingService;
import io.cucumber.java.pt.Dado;
import io.cucumber.java.pt.Quando;
import io.restassured.response.Response;

import static org.assertj.core.api.Assertions.assertThat;

public class BookingSteps {

    private final BookingService bookingService;
    private final AuthService authService;
    private final ScenarioContext context;

    public BookingSteps(BookingService bookingService, AuthService authService, ScenarioContext context) {
        this.bookingService = bookingService;
        this.authService = authService;
        this.context = context;
    }

    @Dado("que existe uma reserva cadastrada")
    public void existeReserva() {
        Response response = bookingService.create();
        assertThat(response.statusCode()).as("pré-condição: criação da reserva").isEqualTo(200);
        context.bookingId(response.jsonPath().getInt("bookingid"));
    }

    @Quando("eu excluo a reserva usando o token gerado")
    public void excluirComTokenGerado() {
        Response auth = authService.createToken(Credentials.valid());
        String token = auth.as(AuthResponse.class).token();
        assertThat(token).as("pré-condição: token gerado").isNotBlank();
        excluirComToken(token);
    }

    @Quando("eu excluo a reserva usando o token {string}")
    public void excluirComToken(String token) {
        Response response = bookingService.delete(context.bookingId(), token);
        context.addResponse(response);
        if (response.statusCode() == 201) {
            context.bookingId(null);
        }
    }
}
