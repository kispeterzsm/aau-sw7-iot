package com.example.middleware.service;

import com.example.middleware.dto.RegisterRequest;
import com.example.middleware.model.Subscription;
import com.example.middleware.model.User;
import com.example.middleware.repository.SubscriptionRepository;
import com.example.middleware.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;

    private String hash(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(password.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public User register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email already exists: " + request.getEmail()
            );
        }


        User u = new User();
        u.setEmail(request.getEmail());
        u.setPasswordHash(hash(request.getPassword()));
        return userRepository.save(u);
    }

    public User login(RegisterRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("invalid login"));

        String expected = hash(request.getPassword());
        if (!expected.equals(user.getPasswordHash())) {
            throw new RuntimeException("invalid login");
        }
        return user;
    }

    public void subscribe(Long userId, String plan) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("user not found"));

        Subscription s = new Subscription();
        s.setUser(user);
        s.setPlan(plan);
        s.setActive(true);
        subscriptionRepository.save(s);
    }

    public List<Subscription> subscriptions(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("user not found"));
        return subscriptionRepository.findByUser(user);
    }
}
