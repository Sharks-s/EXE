package com.exe101.exe.service.impl;

import com.exe101.exe.config.MailProperties;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.exception.ExternalServiceException;
import com.exe101.exe.service.MailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
@Profile("!mock-mail")
@RequiredArgsConstructor
@Slf4j
public class SmtpMailService implements MailService {

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    @Override
    public void sendRegisterOtp(String toEmail, String otp) {
        sendOtp(
                toEmail,
                "Verify your Focus Buddy account",
                "Verify your email",
                "Use this code to finish creating your Focus Buddy account.",
                otp
        );
    }

    @Override
    public void sendResetPasswordOtp(String toEmail, String otp) {
        sendOtp(
                toEmail,
                "Reset your Focus Buddy password",
                "Reset your password",
                "Use this code to reset your Focus Buddy password.",
                otp
        );
    }

    private void sendOtp(String toEmail, String subject, String title, String messageText, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            if (mailProperties.getFrom() != null && !mailProperties.getFrom().isBlank()) {
                String fromName = mailProperties.getFromName();
                if (fromName != null && !fromName.isBlank()) {
                    helper.setFrom(new InternetAddress(mailProperties.getFrom(), fromName));
                } else {
                    helper.setFrom(mailProperties.getFrom());
                }
            }
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(buildOtpEmailHtml(title, messageText, otp), true);
            mailSender.send(message);
            log.info("OTP email sent to {}", toEmail);
        } catch (MailException | MessagingException | UnsupportedEncodingException ex) {
            log.warn("Failed to send OTP email to {}", toEmail, ex);
            throw new ExternalServiceException(ErrorCode.INTERNAL_ERROR, "Failed to send OTP email", ex);
        }
    }

    private String buildOtpEmailHtml(String title, String messageText, String otp) {
        return """
                <!doctype html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Focus Buddy OTP</title>
                </head>
                <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
                          <tr>
                            <td style="padding:28px 32px 18px;text-align:center;">
                              <div style="font-size:34px;font-weight:700;letter-spacing:0;color:#111827;">
                                F<span style="color:#2f80ed;">o</span>cus <span style="color:#2f80ed;">Buddy</span>
                              </div>
                              <div style="margin-top:4px;font-size:14px;color:#8b949e;">Focus today, archive tomorrow.</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:16px 32px 8px;">
                              <h1 style="margin:0;text-align:center;font-size:24px;line-height:32px;color:#111827;">%s</h1>
                              <p style="margin:12px 0 0;text-align:center;font-size:15px;line-height:24px;color:#4b5563;">%s</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:22px 32px;text-align:center;">
                              <div style="display:inline-block;background:#eef6ff;border:1px solid #bfdbfe;border-radius:14px;padding:18px 28px;">
                                <div style="font-size:13px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1.4px;">Verification code</div>
                                <div style="margin-top:8px;font-size:38px;line-height:44px;font-weight:800;color:#111827;letter-spacing:8px;">%s</div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 32px 28px;">
                              <p style="margin:0;text-align:center;font-size:14px;line-height:22px;color:#6b7280;">This code expires in 5 minutes. If you did not request it, you can ignore this email.</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="background:#f9fafb;padding:18px 32px;text-align:center;font-size:12px;line-height:18px;color:#9ca3af;">
                              Focus Buddy security email
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(title, messageText, otp);
    }
}
