package br.com.portifolio.restfulbooker.services;

import br.com.portifolio.restfulbooker.context.HttpLog;
import br.com.portifolio.restfulbooker.core.BaseService;
import io.restassured.http.ContentType;
import io.restassured.response.Response;

import java.time.LocalDate;
import java.util.Map;

/**
 * Service object mínimo de /booking, usado para provar que o token gerado em /auth autoriza operações protegidas.
 */
public class BookingService extends BaseService {

    private static final String BOOKING = "/booking";

    public BookingService(HttpLog log) {
        super(log);
    }

    public Response create() {
        LocalDate checkin = LocalDate.now().plusDays(30);
        Map<String, Object> booking = Map.of(
                "firstname", "Rest",
                "lastname", "Assured",
                "totalprice", 150,
                "depositpaid", true,
                "bookingdates", Map.of(
                        "checkin", checkin.toString(),
                        "checkout", checkin.plusDays(3).toString()),
                "additionalneeds", "Breakfast");

        return request()
                .contentType(ContentType.JSON)
                .accept("application/json")
                .body(booking)
                .post(BOOKING);
    }

    public Response delete(int bookingId, String token) {
        return request()
                .cookie("token", token)
                .delete(BOOKING + "/{id}", bookingId);
    }
}
