package com.example.middleware.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {
    private final JavaMailSender mailSender;



    public void sendEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }

    // Existing MFA OTP email
    public void sendOtpEmail(String to, String code) {
        String subject = "Your MFA OTP Code";
        String text = "Your verification code is: " + code;
        sendEmail(to, subject, text);
    }

    // Password reset OTP email
    public void sendPasswordResetOtpEmail(String to, String code) {
        String subject = "Your password reset code";
        String text = "Your password reset code is: " + code + "\n\n"
                + "It is valid for 10 minutes.";
        sendEmail(to, subject, text);
    }
}
