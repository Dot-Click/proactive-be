import nodemailer from "nodemailer";
import BrevoTransport from "nodemailer-brevo-transport";
import { env } from "./env.utils";
import { logger } from "./logger.util";

/**
 * Brevo email service utility
 * Handles all email sending operations using Brevo via Nodemailer
 */

// Email sending options interface
export interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: string;
}

/**
 * Send email using Brevo via Nodemailer
 */
export const sendEmail = async (
  options: SendEmailOptions
): Promise<boolean> => {
  try {
    // Get API key from environment variable
    const apiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;

    if (!apiKey) {
      logger.warn(
        "BREVO_API_KEY not configured. Email not sent. Set BREVO_API_KEY in .env to enable."
      );
      return false;
    }

    // Create transporter using Brevo transport
    const transport = nodemailer.createTransport(
      new BrevoTransport({ apiKey })
    );

    // Send email
    const data = await transport.sendMail({
      from:
        options.from ||
        `"Proactive" <${
          process.env.BREVO_SENDER_EMAIL || "noreply@proactive.com"
        }>`,
      to: options.to,
      subject: options.subject,
      html: options.htmlContent,
      text: options.textContent,
    });
      

    logger.info(
      `Email sent successfully to ${options.to}. Message ID: ${
        data.messageId || "unknown"
      }`
    );
    return true;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`Failed to send email to ${options.to}:`, errorMessage);
    if (error instanceof Error && (error as any).response) {
      logger.error("Brevo API Error:", (error as any).response.body);
    }
    return false;
  }
};

/**
 * Generate email verification link
 */
const getVerificationLink = (token: string): string => {
  const frontendUrl = process.env.FRONTEND_DOMAIN || "http://localhost:4000";
  return `${frontendUrl}/verify-email?token=${token}`;
};

/**
 * Generate password reset link
 */
const getPasswordResetLink = (token: string): string => {
  const frontendUrl = process.env.FRONTEND_DOMAIN || "http://localhost:4000";
  return `${frontendUrl}/reset-password?token=${token}`;
};

/**
 * Send email verification email
 */
export const sendVerificationEmail = async (
  email: string,
  token: string,
  userName?: string
): Promise<boolean> => {
  const verificationLink = getVerificationLink(token);
  const subject = "Verify Your Email Address - Proactive";

  const htmlContent = getEmailVerificationTemplate(
    userName || "User",
    verificationLink,
    token
  );

  const textContent = `Hello ${userName || "User"},

    Please verify your email address by clicking the link below:
    ${verificationLink}

    Or use this verification token: ${token}

    This link will expire in 24 hours.

    If you didn't create an account, please ignore this email.

    Best regards,
    Proactive Team`;

      return sendEmail({
        to: email,
        subject,
        htmlContent,
        textContent,
      });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  userName?: string
): Promise<boolean> => {
  const resetLink = getPasswordResetLink(token);
  const subject = "Reset Your Password - Proactive";

  const htmlContent = getPasswordResetTemplate(
    userName || "User",
    resetLink,
    token
  );

  const textContent = `Hello ${userName || "User"},

You requested to reset your password. Click the link below to reset it:
${resetLink}

Or use this reset token: ${token}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

Best regards,
Proactive Team`;

  return sendEmail({
    to: email,
    subject,
    htmlContent,
    textContent,
  });
};

/**
 * Send welcome email (after email verification)
 */
export const sendWelcomeEmail = async (
  email: string,
  userName?: string
): Promise<boolean> => {
  const subject = "Welcome to Proactive!";
  const frontendUrl = process.env.FRONTEND_DOMAIN || "http://localhost:4000";

  const htmlContent = getWelcomeEmailTemplate(userName || "User", frontendUrl);

  const textContent = `Hello ${userName || "User"},

Welcome to Proactive! Your email has been verified and your account is now active.

You can now log in and start using our platform.

Best regards,
Proactive Team`;

  return sendEmail({
    to: email,
    subject,
    htmlContent,
    textContent,
  });
};

/**
 * Email verification template
 */
const getEmailVerificationTemplate = (
  userName: string,
  verificationLink: string,
  token: string
): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Verify Your Email</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for signing up! Please verify your email address by clicking the button below:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
         
              
              <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                This verification link will expire in <strong>24 hours</strong>.
              </p>
              
              <p style="margin: 20px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you didn't create an account, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                Best regards,<br>
                <strong style="color: #333333;">Proactive Team</strong>
              </p>
              <p style="margin: 10px 0 0; color: #999999; font-size: 12px;">
                If you have any questions, please contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Password reset template
 */
const getPasswordResetTemplate = (
  userName: string,
  resetLink: string,
  token: string
): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Reset Your Password</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 87, 108, 0.3);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Token -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #f5576c;">
                <p style="margin: 0 0 10px; color: #666666; font-size: 14px; font-weight: 600;">
                  Or use this reset token:
                </p>
                <p style="margin: 0; color: #333333; font-size: 16px; font-family: 'Courier New', monospace; word-break: break-all; background-color: #ffffff; padding: 12px; border-radius: 4px;">
                  ${token}
                </p>
              </div>
              
              <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                This reset link will expire in <strong>1 hour</strong>.
              </p>
              
              <p style="margin: 20px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                Best regards,<br>
                <strong style="color: #333333;">Proactive Team</strong>
              </p>
              <p style="margin: 10px 0 0; color: #999999; font-size: 12px;">
                For security reasons, never share this link with anyone.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Welcome email template
 */
const getWelcomeEmailTemplate = (
  userName: string,
  frontendUrl: string
): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Proactive</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to Proactive! 🎉</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Congratulations! Your email has been verified and your account is now active.
              </p>
              
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                You can now log in and start using our platform to manage your tasks and projects efficiently.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}/login" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 172, 254, 0.3);">
                      Get Started
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
                <p style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">
                  What's next?
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                  <li>Complete your profile</li>
                  <li>Explore our features</li>
                  <li>Connect with your team</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                Best regards,<br>
                <strong style="color: #333333;">Proactive Team</strong>
              </p>
              <p style="margin: 10px 0 0; color: #999999; font-size: 12px;">
                We're here to help! If you have any questions, feel free to reach out.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};


export const sendCoordinatorWelcomeEmail = async (
  email: string,
  userName?: string,
  password?: string
): Promise<boolean> => {
  const subject = "Welcome to Proactive!";
  const frontendUrl = process.env.FRONTEND_DOMAIN || "http://localhost:4000";

    const htmlContent = `
    <h2>Welcome to Proactive 👋</h2>

    <p>Hi ${userName || "there"},</p>

    <p>Your email has been successfully verified, and your account is now active.</p>

    <p><strong>Account details:</strong></p>
    <ul>
      <li>Email: <strong>${email}</strong></li>
      <li>Password: <strong>${password}</strong></li>
    </ul>

    <p>You can now log in and start managing your tasks and projects with Proactive.</p>

    <p style="margin-top:16px;">
      For security reasons, we recommend changing your password after your first login.
    </p>

    <p>Best regards,<br/>
    <strong>Proactive Team</strong></p>
  `;

  return sendEmail({
    to: email,
    subject,
    htmlContent,
  });
};

export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<boolean> => {
  try {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      logger.warn("BREVO_API_KEY not set. SMS not sent.");
      return false;
    }

    const res = await fetch(
      "https://api.brevo.com/v3/transactionalSMS/sms",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          sender: "Proactive",
          recipient: phoneNumber,
          content: message,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      logger.error("Brevo SMS error:", data);
      return false;
    }

    logger.info(`SMS sent to ${phoneNumber}`);
    return true;
  } catch (err) {
    logger.error(`Failed to send SMS to ${phoneNumber}`, err);
    return false;
  }
};