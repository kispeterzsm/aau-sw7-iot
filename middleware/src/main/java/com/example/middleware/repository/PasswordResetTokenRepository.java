package com.example.middleware.repository;

import com.example.middleware.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;


@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken>
    findFirstByTokenHashAndUsedFalseAndExpiresAtAfter(String tokenHash, Instant now);

}
