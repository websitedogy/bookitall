import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !port || !user || !pass) {
      this.logger.warn('SMTP credentials not configured. Email sending is disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    this.transporter.verify((error) => {
      if (error) {
        this.logger.error(`SMTP connection failed: ${error.message}`);
        this.transporter = null;
      } else {
        this.logger.log('SMTP connection established');
      }
    });
  }

  async sendBookingConfirmation(to: string, bookingDetails: {
    bookingNumber: string;
    serviceName: string;
    total: string;
    scheduledAt?: Date;
  }) {
    if (!this.transporter) {
      this.logger.warn('Email sending not configured');
      return;
    }

    const subject = `Booking Confirmed - ${bookingDetails.bookingNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Booking Confirmed</h2>
        <p>Dear Customer,</p>
        <p>Your booking has been confirmed successfully.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Booking Number:</strong> ${bookingDetails.bookingNumber}</p>
          <p><strong>Service:</strong> ${bookingDetails.serviceName}</p>
          <p><strong>Total Amount:</strong> ₹${bookingDetails.total}</p>
          ${bookingDetails.scheduledAt ? `<p><strong>Scheduled Date:</strong> ${new Date(bookingDetails.scheduledAt).toLocaleDateString()}</p>` : ''}
        </div>
        <p>Thank you for choosing BookItAll!</p>
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM') || 'noreply@bookitall.com',
        to,
        subject,
        html,
      });
      this.logger.log(`Booking confirmation email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  async sendProfileCompletionReminder(to: string, missingFields: string[]) {
    if (!this.transporter) {
      this.logger.warn('Email sending not configured');
      return;
    }

    const subject = 'Complete Your Profile - BookItAll';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Complete Your Profile</h2>
        <p>Dear Customer,</p>
        <p>To continue booking services, please complete your profile.</p>
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p><strong>Missing Information:</strong></p>
          <ul>
            ${missingFields.map(field => `<li>${field}</li>`).join('')}
          </ul>
        </div>
        <p>Please visit your account page to complete your profile:</p>
        <p><a href="${this.config.get<string>('SITE_URL') || 'http://localhost:3000'}/account" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Complete Profile</a></p>
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM') || 'noreply@bookitall.com',
        to,
        subject,
        html,
      });
      this.logger.log(`Profile completion reminder sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }
}
