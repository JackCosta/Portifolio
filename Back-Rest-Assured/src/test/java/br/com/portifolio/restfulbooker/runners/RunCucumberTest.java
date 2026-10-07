package br.com.portifolio.restfulbooker.runners;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.Suite;

import static io.cucumber.junit.platform.engine.Constants.GLUE_PROPERTY_NAME;

/**
 * Ponto de entrada da suíte. Plugins, tags e paralelismo ficam em junit-platform.properties
 * para poderem ser sobrescritos via -D na linha de comando.
 */
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME, value = "br.com.portifolio.restfulbooker.steps")
public class RunCucumberTest {
}
