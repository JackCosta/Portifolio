package br.com.portifolio.restfulbooker.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Configuração centralizada. Ordem de precedência:
 * system property (-Dbase.url) &gt; variável de ambiente (BASE_URL) &gt; config.properties.
 */
public final class Config {

    private static final Properties FILE = load();

    private Config() {
    }

    public static String baseUrl() {
        return get("base.url");
    }

    public static String username() {
        return get("auth.username");
    }

    public static String password() {
        return get("auth.password");
    }

    public static long maxResponseTimeMs() {
        return Long.parseLong(get("max.response.time.ms"));
    }

    private static String get(String key) {
        String envKey = key.toUpperCase().replace('.', '_');
        String value = firstNonBlank(System.getProperty(key), System.getenv(envKey), FILE.getProperty(key));
        if (value == null) {
            throw new IllegalStateException("Configuração ausente: '%s' (ou variável %s)".formatted(key, envKey));
        }
        return value;
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static Properties load() {
        Properties properties = new Properties();
        try (InputStream in = Config.class.getClassLoader().getResourceAsStream("config.properties")) {
            if (in != null) {
                properties.load(in);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível ler config.properties", e);
        }
        return properties;
    }
}
