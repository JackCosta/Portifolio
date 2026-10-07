package br.com.portifolio.restfulbooker.context;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;

/**
 * Log das requisições/respostas de um cenário. Instanciado por cenário pelo PicoContainer
 * e anexado ao relatório do Cucumber no hook After.
 */
public class HttpLog {

    private final ByteArrayOutputStream buffer = new ByteArrayOutputStream();
    private final PrintStream stream = new PrintStream(buffer, true, StandardCharsets.UTF_8);

    public PrintStream stream() {
        return stream;
    }

    public String content() {
        return buffer.toString(StandardCharsets.UTF_8);
    }

    public boolean isEmpty() {
        return buffer.size() == 0;
    }
}
