package com.example.middleware.repository;

import com.example.middleware.model.MfaEmailOtp;
import com.example.middleware.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MfaEmailOtpRepository extends JpaRepository<MfaEmailOtp, UUID> {
    Optional<MfaEmailOtp> findFirstByUserAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            User user,
            Instant now
    );
}
