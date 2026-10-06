import { attach } from "@badeball/cypress-cucumber-preprocessor";

const SENSITIVE_HEADERS = ["cookie", "authorization"];

const maskHeaders = (headers = {}) =>
  Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      SENSITIVE_HEADERS.includes(key.toLowerCase()) ? "***" : value,
    ]),
  );

/**
 * Page Object base para serviços da API.
 * Centraliza headers padrão, desabilita a falha automática por status (as asserções
 * de status ficam nos steps) e anexa request/response ao relatório Cucumber.
 */
export default class BasePage {
  constructor(endpoint = "") {
    this.endpoint = endpoint;
    this.defaultHeaders = { "Content-Type": "application/json", Accept: "application/json" };
  }

  request({ method = "GET", path = "", qs, body, headers = {}, report = true } = {}) {
    const requestHeaders = { ...this.defaultHeaders, ...headers };
    const url = `${this.endpoint}${path}`;

    return cy
      .request({ method, url, qs, body, headers: requestHeaders, failOnStatusCode: false })
      .then((response) => {
        if (report) {
          attach(
            JSON.stringify(
              {
                request: { method, url, qs, headers: maskHeaders(requestHeaders), body },
                response: {
                  status: response.status,
                  statusText: response.statusText,
                  durationMs: response.duration,
                  headers: { "content-type": response.headers["content-type"] },
                  body: response.body,
                },
              },
              null,
              2,
            ),
            { mediaType: "text/plain", fileName: `${method} ${url}` },
          );
        }
        return cy.wrap(response, { log: false });
      });
  }
}
