import { Resend } from 'resend';
import { randomBytes } from 'crypto';

// Resend Integration - Using Replit Connector
// Documentation: https://resend.com/docs

// Generate a secure random temporary password
export function generateTemporaryPassword(length: number = 12): string {
  const charset = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
  const bytes = randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }
  return password;
}

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

const BRAND_COLOR = '#3C8CAA';
// A logo será carregada do servidor atual dinamicamente
function getLogoUrl(): string {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : process.env.REPLIT_DEPLOYMENT_URL
    ? `https://${process.env.REPLIT_DEPLOYMENT_URL}`
    : 'http://localhost:5000';
  return `${baseUrl}/assets/logo-branca.png`;
}

export function generatePasswordResetEmail(resetUrl: string, professionalName: string): string {
  const logoUrl = getLogoUrl();
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha - Monte Everest</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; line-height: 1.6;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f7fa;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header with Logo -->
                <tr>
                  <td style="background-color: ${BRAND_COLOR}; padding: 30px 40px; text-align: center;">
                    <img src="${logoUrl}" alt="Monte Everest" style="max-width: 200px; height: auto;" />
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Olá, ${professionalName}!</h2>
                    <p style="color: #555555; font-size: 16px; margin: 0 0 15px 0;">
                      Recebemos uma solicitação para redefinir a senha da sua conta.
                    </p>
                    <p style="color: #555555; font-size: 16px; margin: 0 0 25px 0;">
                      Se você não solicitou esta alteração, por favor ignore este email. Sua senha permanecerá inalterada.
                    </p>
                    <!-- Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px auto;">
                      <tr>
                        <td style="background-color: ${BRAND_COLOR}; border-radius: 8px;">
                          <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                            Redefinir Senha
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #777777; font-size: 14px; margin: 25px 0 10px 0;">
                      Ou copie e cole o link abaixo no seu navegador:
                    </p>
                    <p style="background-color: #f8f9fa; padding: 12px 15px; border-radius: 6px; word-break: break-all; font-size: 13px; color: ${BRAND_COLOR}; border: 1px solid #e9ecef;">
                      ${resetUrl}
                    </p>
                    <p style="color: #dc3545; font-size: 14px; font-weight: 600; margin: 20px 0 0 0;">
                      Este link expirará em 1 hora.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #888888; font-size: 13px; margin: 0;">
                      Monte Everest - Conectando profissionais e clientes
                    </p>
                    <p style="color: #aaaaaa; font-size: 12px; margin: 10px 0 0 0;">
                      Este é um email automático, por favor não responda.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function generateCredentialsEmail(professionalName: string, email: string, password: string, loginUrl: string): string {
  const logoUrl = getLogoUrl();
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao Monte Everest</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; line-height: 1.6;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f7fa;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header with Logo -->
                <tr>
                  <td style="background-color: ${BRAND_COLOR}; padding: 30px 40px; text-align: center;">
                    <img src="${logoUrl}" alt="Monte Everest" style="max-width: 200px; height: auto;" />
                  </td>
                </tr>
                <!-- Welcome Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, ${BRAND_COLOR}15 0%, ${BRAND_COLOR}05 100%); padding: 30px 40px; text-align: center;">
                    <h1 style="color: ${BRAND_COLOR}; font-size: 28px; margin: 0;">Bem-vindo ao Monte Everest!</h1>
                    <p style="color: #666666; font-size: 16px; margin: 10px 0 0 0;">${professionalName}</p>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #555555; font-size: 16px; margin: 0 0 20px 0;">
                      Seu cadastro foi aprovado e seu pagamento foi confirmado! Agora você faz parte da nossa rede de profissionais.
                    </p>
                    <p style="color: #555555; font-size: 16px; margin: 0 0 25px 0;">
                      Abaixo estão suas credenciais de acesso ao painel:
                    </p>
                    <!-- Credentials Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 10px; border: 2px solid ${BRAND_COLOR}20; margin: 25px 0;">
                      <tr>
                        <td style="padding: 25px 30px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 8px 0;">
                                <span style="color: #888888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Email</span>
                                <p style="color: #333333; font-size: 18px; font-weight: 600; margin: 5px 0 0 0;">${email}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 15px 0 8px 0; border-top: 1px solid #e9ecef;">
                                <span style="color: #888888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Senha</span>
                                <p style="color: #333333; font-size: 18px; font-weight: 600; margin: 5px 0 0 0; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 8px 12px; border-radius: 6px; display: inline-block;">${password}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    <!-- Security Notice -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fff3cd; border-radius: 8px; margin: 20px 0;">
                      <tr>
                        <td style="padding: 15px 20px;">
                          <p style="color: #856404; font-size: 14px; margin: 0;">
                            <strong>Importante:</strong> Por segurança, recomendamos que você altere sua senha após o primeiro login.
                          </p>
                        </td>
                      </tr>
                    </table>
                    <!-- Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px auto;">
                      <tr>
                        <td style="background-color: ${BRAND_COLOR}; border-radius: 8px; box-shadow: 0 4px 12px ${BRAND_COLOR}40;">
                          <a href="${loginUrl}" style="display: inline-block; padding: 18px 50px; color: #ffffff; text-decoration: none; font-size: 17px; font-weight: 600;">
                            Acessar Meu Painel
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #888888; font-size: 13px; margin: 0;">
                      Monte Everest - Conectando profissionais e clientes
                    </p>
                    <p style="color: #aaaaaa; font-size: 12px; margin: 10px 0 0 0;">
                      Este é um email automático, por favor não responda.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
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
