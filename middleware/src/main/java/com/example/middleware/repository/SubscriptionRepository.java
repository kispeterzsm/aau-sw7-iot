package com.example.middleware.repository;

import com.example.middleware.model.Subscription;
import com.example.middleware.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByUser(User user);
}
