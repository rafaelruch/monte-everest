import { Resend } from 'resend';

// Resend Integration - Using Replit Connector
// Documentation: https://resend.com/docs

let connectionSettings: any;

async function getResendCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email || 'servicosmonteeverest@gmail.com'
  };
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
async function getResendClient() {
  const { apiKey, fromEmail } = await getResendCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: `Monte Everest <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });
    
    if (result.error) {
      console.error('❌ [email/Resend] Erro ao enviar email:', result.error);
      throw new Error(result.error.message || 'Falha ao enviar email');
    }
    
    console.log(`✅ [email/Resend] Email enviado com sucesso para ${options.to}`, result.data);
  } catch (error) {
    console.error('❌ [email/Resend] Erro ao enviar email:', error);
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
          .header { background-color: #3C8BAB; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; background-color: #3C8BAB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
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
          .header { background-color: #3C8BAB; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .credentials { background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #ddd; }
          .button { display: inline-block; background-color: #3C8BAB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
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
            <p>Seu cadastro foi aprovado e seu pagamento foi confirmado! Abaixo estão suas credenciais de acesso:</p>
            <div class="credentials">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Senha:</strong> ${password}</p>
            </div>
            <p><strong>Importante:</strong> Por favor, altere sua senha após o primeiro login.</p>
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
    planName?: string;
  }): Promise<boolean> {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';
    const loginUrl = `${baseUrl}/professional-login`;
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
