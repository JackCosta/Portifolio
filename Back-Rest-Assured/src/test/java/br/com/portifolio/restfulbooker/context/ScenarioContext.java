package br.com.portifolio.restfulbooker.context;

import io.restassured.response.Response;

import java.util.ArrayList;
import java.util.List;

/**
 * Estado compartilhado entre as classes de steps de um mesmo cenário (injetado pelo PicoContainer).
 */
public class ScenarioContext {

    private final List<Response> responses = new ArrayList<>();
    private Integer bookingId;

    public void addResponse(Response response) {
        responses.add(response);
    }

    public Response lastResponse() {
        if (responses.isEmpty()) {
            throw new IllegalStateException("Nenhuma requisição foi executada neste cenário");
        }
        return responses.getLast();
    }

    public List<Response> responses() {
        return List.copyOf(responses);
    }

    public Integer bookingId() {
        return bookingId;
    }

    public void bookingId(Integer bookingId) {
        this.bookingId = bookingId;
    }
}
