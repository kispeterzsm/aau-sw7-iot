package com.example.middleware.service;

import com.example.middleware.dto.RegisterRequest;
import com.example.middleware.model.MfaEmailOtp;
import com.example.middleware.model.Subscription;
import com.example.middleware.model.User;
import com.example.middleware.repository.MfaEmailOtpRepository;
import com.example.middleware.repository.SubscriptionRepository;
import com.example.middleware.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final MfaEmailOtpRepository mfaEmailOtpRepository;
    private final MailService mailService;

    private String hash(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(password.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public ResponseEntity register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return new ResponseEntity("Email already exists: " + request.getEmail(),HttpStatus.BAD_REQUEST
            );
        }


        User u = new User();
        u.setEmail(request.getEmail());
        u.setPasswordHash(hash(request.getPassword()));
        userRepository.save(u);
        return ResponseEntity.ok(u);
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

    private String generateOtpCode() {
        int code = (int) (Math.random() * 900000) + 100000; // 6-digit
        return String.valueOf(code);
    }

    public void setEmailMfaEnabled(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("user not found"));

        user.setMfaEmailEnabled(enabled);
        userRepository.save(user);
    }

    public void sendEmailMfaOtp(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("user not found"));

        String code = generateOtpCode();
        String codeHash = hash(code);

        MfaEmailOtp otp = new MfaEmailOtp();
        otp.setUser(user);
        otp.setCodeHash(codeHash);
        otp.setExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));

        mfaEmailOtpRepository.save(otp);

        mailService.sendOtpEmail(user.getEmail(), code);
    }


    public ResponseEntity<Map<String, Object>> verifyEmailMfaOtp(Long userId, String code) {

        User user = userRepository.findById(userId)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "user not found"));
        }

        MfaEmailOtp otp = mfaEmailOtpRepository
                .findFirstByUserAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(user, Instant.now())
                .orElse(null);

        if (otp == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "no valid otp"));
        }

        if (otp.getAttempts() >= 5) {
            otp.setUsed(true);
            mfaEmailOtpRepository.save(otp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "too many attempts"));
        }

        String expectedHash = otp.getCodeHash();
        String providedHash = hash(code);

        if (!expectedHash.equals(providedHash)) {
            otp.setAttempts((short) (otp.getAttempts() + 1));
            mfaEmailOtpRepository.save(otp);

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "invalid code"));
        }

        otp.setUsed(true);
        mfaEmailOtpRepository.save(otp);

        return ResponseEntity.ok(Map.of("status", "verified"));
    }




}
