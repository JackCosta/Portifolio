package br.com.portifolio.restfulbooker.data;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;

/**
 * Massa de dados de autenticação inválida, mantida em testdata/invalid-credentials.json
 * e referenciada pelo nome do caso nos Exemplos das features.
 */
public final class AuthDataFactory {

    private static final JsonNode INVALID = load("testdata/invalid-credentials.json");

    private AuthDataFactory() {
    }

    public static JsonNode invalidCredentials(String caseName) {
        JsonNode body = INVALID.get(caseName);
        if (body == null) {
            throw new IllegalArgumentException("Caso de credencial inválida não cadastrado: " + caseName);
        }
        return body;
    }

    private static JsonNode load(String resource) {
        try (InputStream in = AuthDataFactory.class.getClassLoader().getResourceAsStream(resource)) {
            if (in == null) {
                throw new IllegalStateException("Arquivo de massa não encontrado: " + resource);
            }
            return new ObjectMapper().readTree(in);
        } catch (IOException e) {
            throw new IllegalStateException("Falha ao ler " + resource, e);
        }
    }
}
