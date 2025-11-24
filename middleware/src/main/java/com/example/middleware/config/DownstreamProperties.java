package com.example.middleware.config;


import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "downstream")
public class DownstreamProperties {
    private String baseUrl;
    private String linkPath;
    private String textPath;
    private int timeoutSec;
    private String authHeader;
    private String authToken;

    public String getLinkUrl() {
        return baseUrl.replaceAll("/$", "") + linkPath;
    }

    public String getTextUrl() {
        return baseUrl.replaceAll("/$", "") + textPath;
    }
}
