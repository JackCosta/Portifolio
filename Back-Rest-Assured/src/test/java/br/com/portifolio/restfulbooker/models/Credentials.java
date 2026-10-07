package br.com.portifolio.restfulbooker.models;

import br.com.portifolio.restfulbooker.config.Config;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Corpo da requisição POST /auth.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record Credentials(String username, String password) {

    public static Credentials valid() {
        return new Credentials(Config.username(), Config.password());
    }
}
