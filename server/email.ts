import nodemailer from 'nodemailer';
import { db } from './db';
import { systemConfigs } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Email configuration from database system_configs table
// Required keys: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function getSystemConfig(key: string): Promise<string | null> {
  try {
    const [config] = await db.select()
      .from(systemConfigs)
      .where(eq(systemConfigs.key, key))
      .limit(1);
    
    return config?.value || null;
  } catch (error) {
    console.error(`[email] Erro ao buscar configuração ${key}:`, error);
    return null;
  }
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  // Get SMTP configuration from database
  const SMTP_HOST = await getSystemConfig('SMTP_HOST');
  const SMTP_PORT = await getSystemConfig('SMTP_PORT');
  const SMTP_USER = await getSystemConfig('SMTP_USER');
  
  // Get password from environment variable (Replit Secrets)
  const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

  // Check if email is configured
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.warn('[email] ⚠️ Email não configurado!');
    console.warn('[email] SMTP_HOST:', SMTP_HOST);
    console.warn('[email] SMTP_USER:', SMTP_USER);
    console.warn('[email] SMTP_PASSWORD:', SMTP_PASSWORD ? '***configurado***' : 'NÃO CONFIGURADO');
    console.warn('[email] Email que seria enviado:', {
      to: options.to,
      subject: options.subject,
      from: 'servicosmonteeverest@gmail.com'
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587'),
    secure: SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: '"Monte Everest" <servicosmonteeverest@gmail.com>', // Always use this as sender
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ [email] Email enviado com sucesso para ${options.to}`);
  } catch (error) {
    console.error('❌ [email] Erro ao enviar email:', error);
    throw new Error('Falha ao enviar email');
  }
}

export function generatePasswordResetEmail(resetUrl: string, professionalName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Monte Everest</h1>
          </div>
          <div class="content">
            <h2>Olá, ${professionalName}!</h2>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p>Se você não solicitou esta alteração, por favor ignore este email. Sua senha permanecerá inalterada.</p>
            <p>Para criar uma nova senha, clique no botão abaixo:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Redefinir Senha</a>
            </p>
            <p>Ou copie e cole o seguinte link no seu navegador:</p>
            <p style="word-break: break-all; background-color: #fff; padding: 10px; border-radius: 3px;">${resetUrl}</p>
            <p><strong>Este link expirará em 1 hora.</strong></p>
          </div>
          <div class="footer">
            <p>Monte Everest - Conectando profissionais e clientes</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateCredentialsEmail(professionalName: string, email: string, password: string, loginUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .credentials { background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Monte Everest</h1>
          </div>
          <div class="content">
            <h2>Bem-vindo, ${professionalName}!</h2>
            <p>Seu cadastro foi aprovado! Abaixo estão suas credenciais de acesso:</p>
            <div class="credentials">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Senha:</strong> ${password}</p>
            </div>
            <p>Por favor, altere sua senha após o primeiro login.</p>
            <p style="text-align: center;">
              <a href="${loginUrl}" class="button">Acessar Painel</a>
            </p>
          </div>
          <div class="footer">
            <p>Monte Everest - Conectando profissionais e clientes</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Email service object for compatibility
export const emailService = {
  async sendEmail(options: EmailOptions): Promise<void> {
    return sendEmail(options);
  },

  async sendCredentialsEmail(options: {
    to: string;
    professionalName: string;
    email: string;
    password: string;
  }): Promise<boolean> {
    const loginUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/professional-login`;
    const html = generateCredentialsEmail(options.professionalName, options.email, options.password, loginUrl);
    
    try {
      await sendEmail({
        to: options.to,
        subject: 'Bem-vindo ao Monte Everest - Credenciais de Acesso',
        html,
      });
      return true;
    } catch (error) {
      console.error('[emailService] Erro ao enviar email de credenciais:', error);
      return false;
    }
  },

  async sendPasswordResetEmail(options: {
    to: string;
    professionalName: string;
    resetUrl: string;
  }): Promise<boolean> {
    const html = generatePasswordResetEmail(options.resetUrl, options.professionalName);
    
    try {
      await sendEmail({
        to: options.to,
        subject: 'Monte Everest - Recuperação de Senha',
        html,
      });
      return true;
    } catch (error) {
      console.error('[emailService] Erro ao enviar email de recuperação:', error);
      return false;
    }
  },
};
