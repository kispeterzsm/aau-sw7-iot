package com.example.middleware.dto;

import lombok.Data;

@Data
public class WrapResponse {

    private String status;
    private boolean cached;
    private String sourceUrl;
    private int downstreamMs;
    private WrapData data;
}
