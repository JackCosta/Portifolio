package br.com.portifolio.restfulbooker.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Resposta do POST /auth: {@code token} em caso de sucesso ou {@code reason} em caso de falha.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AuthResponse(String token, String reason) {
}
