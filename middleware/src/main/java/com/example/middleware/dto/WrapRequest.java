package com.example.middleware.dto;


import lombok.Data;
import org.antlr.v4.runtime.misc.NotNull;

@Data
public class WrapRequest {

    @NotNull
    private String input;

    private Long userId;

    private Integer searchDepth = 2;
}
