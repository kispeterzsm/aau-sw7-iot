package com.example.middleware.controller;

import com.example.middleware.dto.RegisterRequest;
import com.example.middleware.model.Subscription;
import com.example.middleware.model.User;
import com.example.middleware.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity register(@RequestBody RegisterRequest request) {

        return authService.register(request);
    }

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, Object> login(@RequestBody RegisterRequest request) {
        try {
            User user = authService.login(request);
            Map<String, Object> resp = new HashMap<>();
            resp.put("id", user.getId());
            resp.put("email", user.getEmail());
            return resp;
        } catch (RuntimeException e) {
            throw new RuntimeException("invalid login");
        }
    }

    @PostMapping("/subscribe")
    public Map<String, String> subscribe(@RequestParam("user_id") Long userId,
                                         @RequestParam("plan") String plan) {
        authService.subscribe(userId, plan);
        return Map.of("status", "ok");
    }

    @GetMapping("/subscriptions/{userId}")
    public List<Subscription> subscriptions(@PathVariable Long userId) {
        return authService.subscriptions(userId);
    }

    @PostMapping("/mfa/email/enable")
    public Map<String, String> enableEmailMfa(@RequestParam("user_id") Long userId,
                                              @RequestParam("enabled") boolean enabled) {
        authService.setEmailMfaEnabled(userId, enabled);
        return Map.of("status", "ok");
    }

    @PostMapping("/mfa/email/request")
    public Map<String, String> requestEmailOtp(@RequestParam("user_id") Long userId) {
        authService.sendEmailMfaOtp(userId);
        return Map.of("status", "otp_sent");
    }

    @PostMapping("/mfa/email/verify")
    public ResponseEntity<Map<String, Object>> verifyEmailOtp(
            @RequestParam("user_id") Long userId,
            @RequestParam("code") String code) {

        return authService.verifyEmailMfaOtp(userId, code);

    }

}
