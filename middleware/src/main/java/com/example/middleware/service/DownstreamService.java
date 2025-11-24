package com.example.middleware.service;

import com.example.middleware.config.DownstreamProperties;
import com.example.middleware.dto.WrapData;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DownstreamService {

    private final WebClient webClient;
    private final DownstreamProperties props;
    private final ObjectMapper objectMapper;

    public String normalizeUrl(String u) {
        try {
            URI p = new URI(u.trim());
            String scheme = (p.getScheme() == null ? "https" : p.getScheme()).toLowerCase();
            String host = p.getHost() != null ? p.getHost().toLowerCase() : "";
            String path = p.getPath() == null || p.getPath().isBlank()
                    ? "/"
                    : p.getPath().replaceAll("/+$", "");
            String query = p.getQuery();
            StringBuilder sb = new StringBuilder();
            sb.append(scheme).append("://").append(host).append(path);
            if (query != null && !query.isBlank()) {
                sb.append("?").append(query);
            }
            return sb.toString();
        } catch (URISyntaxException e) {
            return u.trim();
        }
    }

    public String cacheKey(String input, Integer depth) {
        if (depth == null) depth = 0;
        return normalizeUrl(input) + "::d" + depth;
    }

    public record DownstreamResult(int statusCode, JsonNode body, int elapsedMs){}

    public DownstreamResult callDownstream(String url, Map<String, Object> payload) {
        long start = System.nanoTime();
        JsonNode body;
        int status;

        try {
            String raw = webClient.post()
                    .uri(url)
                    .header(props.getAuthHeader(), props.getAuthToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(payload)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, resp ->
                            resp.bodyToMono(String.class)
                                    .map(msg -> new HttpClientErrorException(resp.statusCode(), msg)))
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(props.getTimeoutSec()));

            body = objectMapper.readTree(raw);
            status = 200;
        } catch (HttpClientErrorException e) {
            status = e.getStatusCode().value();
            try {
                body = objectMapper.readTree(e.getResponseBodyAsString());
            } catch (Exception ex) {
                body = objectMapper.createObjectNode().put("raw", e.getResponseBodyAsString());
            }
        } catch (Exception e) {
            int elapsedMs = (int) ((System.nanoTime() - start) / 1_000_000);
            throw new RuntimeException("Downstream connection error: " + e.getMessage() +
                    " (elapsed " + elapsedMs + " ms)", e);
        }

        int elapsedMs = (int) ((System.nanoTime() - start) / 1_000_000);
        return new DownstreamResult(status, body, elapsedMs);
    }

    public WrapData extractWrapData(JsonNode rawNode) {
        try {
            JsonNode candidate = rawNode;
            if (rawNode.has("data") && rawNode.get("data").isObject()) {
                candidate = rawNode.get("data");
            }
            return objectMapper.treeToValue(candidate, WrapData.class);
        } catch (Exception e) {
            throw new RuntimeException("Downstream payload did not match expected schema", e);
        }
    }
}
