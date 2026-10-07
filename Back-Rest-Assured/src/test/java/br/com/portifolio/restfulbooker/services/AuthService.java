package br.com.portifolio.restfulbooker.services;

import br.com.portifolio.restfulbooker.context.HttpLog;
import br.com.portifolio.restfulbooker.core.BaseService;
import io.restassured.http.ContentType;
import io.restassured.http.Method;
import io.restassured.response.Response;

import java.nio.charset.StandardCharsets;

/**
 * Service object do endpoint /auth.
 */
public class AuthService extends BaseService {

    private static final String AUTH = "/auth";

    public AuthService(HttpLog log) {
        super(log);
    }

    /** Envia qualquer corpo serializável (record, Map, JsonNode) como JSON. */
    public Response createToken(Object body) {
        return request()
                .contentType(ContentType.JSON)
                .body(body)
                .post(AUTH);
    }

    /** Envia o corpo exatamente como informado, com o Content-Type desejado (ou nenhum, se nulo). */
    public Response createTokenWithRawBody(String body, String contentType) {
        var request = request();
        if (contentType != null) {
            request.contentType(contentType).body(body);
        } else {
            // Bytes evitam que o Rest Assured exija/infira um Content-Type.
            request.noContentType().body(body.getBytes(StandardCharsets.UTF_8));
        }
        return request.post(AUTH);
    }

    public Response createTokenWithForm(String username, String password) {
        return request()
                .contentType(ContentType.URLENC)
                .formParam("username", username)
                .formParam("password", password)
                .post(AUTH);
    }

    public Response send(Method method) {
        return request().request(method, AUTH);
    }
}
