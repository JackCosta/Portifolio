package br.com.portifolio.restfulbooker.core;

import br.com.portifolio.restfulbooker.config.Config;
import br.com.portifolio.restfulbooker.context.HttpLog;
import io.qameta.allure.restassured.AllureRestAssured;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.filter.log.LogDetail;
import io.restassured.filter.log.RequestLoggingFilter;
import io.restassured.filter.log.ResponseLoggingFilter;
import io.restassured.specification.RequestSpecification;

import static io.restassured.RestAssured.given;

/**
 * Base dos "page objects" da API (service objects): concentra URL base, filtros de log e relatório.
 */
public abstract class BaseService {

    private final RequestSpecification spec;

    protected BaseService(HttpLog log) {
        this.spec = new RequestSpecBuilder()
                .setBaseUri(Config.baseUrl())
                .addFilter(new RequestLoggingFilter(LogDetail.ALL, false, log.stream()))
                .addFilter(new ResponseLoggingFilter(LogDetail.ALL, false, log.stream()))
                .addFilter(new AllureRestAssured())
                .build();
    }

    protected RequestSpecification request() {
        return given().spec(spec);
    }
}
