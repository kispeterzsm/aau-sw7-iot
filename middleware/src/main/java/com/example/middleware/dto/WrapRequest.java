package com.example.middleware.dto;


import lombok.Data;
import org.antlr.v4.runtime.misc.NotNull;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class WrapRequest {

    @NotNull
    private String input;

    @JsonProperty("userId")
    private Long userId;

    @JsonProperty("search_depth")
    private Integer searchDepth = 2;

    @JsonProperty("job_id")
    private String jobId;
}
