package com.exe101.exe.service.impl;

import com.exe101.exe.config.MailProperties;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.exception.ExternalServiceException;
import com.exe101.exe.service.MailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
@Profile("!mock-mail")
@RequiredArgsConstructor
@Slf4j
public class ResendMailService implements MailService {

    private static final String RESEND_EMAILS_PATH = "/emails";
    private static final List<String> PERSONAL_EMAIL_DOMAINS = List.of(
            "gmail.com",
            "googlemail.com",
            "yahoo.com",
            "outlook.com",
            "hotmail.com",
            "live.com"
    );

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
        validateMailConfig();
        String recipientEmail = resolveRecipient(toEmail);

        try {
            RestClient.builder()
                    .baseUrl(mailProperties.getBaseUrl())
                    .defaultHeader("Authorization", "Bearer " + mailProperties.getApiKey())
                    .build()
                    .post()
                    .uri(RESEND_EMAILS_PATH)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new ResendEmailRequest(
                            buildFromAddress(),
                            List.of(recipientEmail),
                            subject,
                            buildOtpEmailHtml(title, messageText, otp, toEmail)
                    ))
                    .retrieve()
                    .toBodilessEntity();
            log.info("OTP email sent to {}{}", recipientEmail, recipientEmail.equals(toEmail) ? "" : " for " + toEmail);
        } catch (Exception ex) {
            log.warn("Failed to send OTP email to {}", toEmail, ex);
            throw new ExternalServiceException(ErrorCode.INTERNAL_ERROR, "Failed to send OTP email", ex);
        }
    }

    private void validateMailConfig() {
        if (isBlank(mailProperties.getApiKey())) {
            throw new ExternalServiceException(ErrorCode.INTERNAL_ERROR, "Missing RESEND_API_KEY");
        }
        if (isBlank(mailProperties.getFrom())) {
            throw new ExternalServiceException(ErrorCode.INTERNAL_ERROR, "Missing MAIL_FROM");
        }
        if (usesPersonalEmailDomain(mailProperties.getFrom())) {
            throw new ExternalServiceException(
                    ErrorCode.INTERNAL_ERROR,
                    "MAIL_FROM must be onboarding@resend.dev or an address from a verified Resend domain"
            );
        }
    }

    private String buildFromAddress() {
        if (isBlank(mailProperties.getFromName())) {
            return mailProperties.getFrom();
        }
        return "%s <%s>".formatted(mailProperties.getFromName(), mailProperties.getFrom());
    }

    private String resolveRecipient(String toEmail) {
        if (isBlank(mailProperties.getTestRecipient())) {
            return toEmail;
        }
        return mailProperties.getTestRecipient();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private boolean usesPersonalEmailDomain(String email) {
        int atIndex = email.lastIndexOf('@');
        if (atIndex < 0 || atIndex == email.length() - 1) {
            return false;
        }
        String domain = email.substring(atIndex + 1).toLowerCase();
        return PERSONAL_EMAIL_DOMAINS.contains(domain);
    }

    private String buildOtpEmailHtml(String title, String messageText, String otp, String originalRecipient) {
        String testRecipientNotice = isBlank(mailProperties.getTestRecipient())
                ? ""
                : """
                          <tr>
                            <td style="padding:0 32px 14px;">
                              <p style="margin:0;text-align:center;font-size:13px;line-height:20px;color:#9ca3af;">Test mode original recipient: %s</p>
                            </td>
                          </tr>
                """.formatted(originalRecipient);

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
                          %s
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
                """.formatted(title, messageText, otp, testRecipientNotice);
    }

    private record ResendEmailRequest(
            String from,
            List<String> to,
            String subject,
            String html
    ) {
    }
}
