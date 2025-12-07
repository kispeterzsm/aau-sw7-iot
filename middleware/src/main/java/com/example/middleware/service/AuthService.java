package com.example.middleware.service;

import com.example.middleware.dto.ChangePasswordRequest;
import com.example.middleware.dto.RegisterRequest;
import com.example.middleware.dto.ResetPasswordRequest;
import com.example.middleware.model.MfaEmailOtp;
import com.example.middleware.model.Subscription;
import com.example.middleware.model.User;
import com.example.middleware.repository.MfaEmailOtpRepository;
import com.example.middleware.repository.PasswordResetTokenRepository;
import com.example.middleware.repository.SubscriptionRepository;
import com.example.middleware.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
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
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private static final SecureRandom secureRandom = new SecureRandom();

    private String hashOtp(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


    private String hash(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(password.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public ResponseEntity<?> register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "message", "Email already exists: " + request.getEmail()
                    ));
        }

        User u = new User();
        u.setEmail(request.getEmail());
        u.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        userRepository.save(u);

        return ResponseEntity.ok(
                Map.of(
                        "message", "Registration successful",
                        "user", u
                )
        );
    }

    public ResponseEntity<?> login(RegisterRequest request) {

        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid login"));
        }

        boolean matches = passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash()
        );

        if (!matches) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid login"));
        }

        return ResponseEntity.ok(
                Map.of(
                        "message", "Login successful",
                        "user", user
                )
        );
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


    public ResponseEntity<?> changePassword(ChangePasswordRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElse(null);

        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "user not found"));
        }

        // verify old password
        boolean oldMatches = matchesPassword(request.getOldPassword(), user.getPasswordHash());

        if (!oldMatches) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "old password is incorrect"));
        }

        // optional: check new != old
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "new password must be different from old password"));
        }

        // update password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));;
        userRepository.save(user);

        return ResponseEntity.ok(
                Map.of("message", "Password changed successfully")
        );
    }


    public ResponseEntity<Map<String, Object>> resetPasswordWithOtp(ResetPasswordRequest req) {

        User user = userRepository.findByEmail(req.getEmail()).orElse(null);

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
        String providedHash = hashOtp(req.getCode());

        if (!expectedHash.equals(providedHash)) {
            otp.setAttempts((short) (otp.getAttempts() + 1));
            mfaEmailOtpRepository.save(otp);

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "invalid code"));
        }

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);

        otp.setUsed(true);
        mfaEmailOtpRepository.save(otp);

        return ResponseEntity.ok(Map.of("status", "password_reset_success"));
    }

    public void sendPasswordResetOtp(String email) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return;
        }

        String code = generateOtpCode();
        String codeHash = hashOtp(code);

        MfaEmailOtp otp = new MfaEmailOtp();
        otp.setUser(user);
        otp.setCodeHash(codeHash);
        otp.setExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        otp.setUsed(false);
        otp.setAttempts((short) 0);

        mfaEmailOtpRepository.save(otp);

        mailService.sendPasswordResetOtpEmail(user.getEmail(), code);
    }


    private boolean matchesPassword(String rawPassword, String storedHash) {
        // If it looks like BCrypt, use BCrypt
        if (storedHash != null && storedHash.startsWith("$2")) {
            return passwordEncoder.matches(rawPassword, storedHash);
        }

        // Legacy SHA-256 check
        String legacyHash = hashOtp(rawPassword); // your old SHA-256 method
        return legacyHash.equals(storedHash);
    }

}
