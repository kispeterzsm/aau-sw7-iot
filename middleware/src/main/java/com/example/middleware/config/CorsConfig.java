package com.example.middleware.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Apply to all endpoints
                        .allowedOrigins(
                            // Local Development
                            "http://localhost:3000", 
                            "http://127.0.0.1:3000",
                            
                            // Kubernetes NodePort Access
                            "http://localhost:30000",
                            // Master Node Tailscale IP
                            
                            // Public Ngrok Access
                            "https://retaliatory-bruna-unofficious.ngrok-free.dev",
                            "http://retaliatory-bruna-unofficious.ngrok-free.dev"
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}