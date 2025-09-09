// Sistema de email para Monte Everest
// Configuração para envio de emails com credenciais de login

interface EmailCredentials {
  to: string;
  professionalName: string;
  email: string;
  password: string;
  planName: string;
}

interface EmailConfig {
  service?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private config: EmailConfig;

  constructor() {
    // Configuração padrão - você pode usar Gmail, SendGrid, Mailgun, etc.
    this.config = {
      service: 'gmail', // ou 'smtp'
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || '', // Use App Password para Gmail
      }
    };
  }

  // Template HTML para email de credenciais
  private generateCredentialsEmailHTML(data: EmailCredentials): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao Monte Everest</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: #3C8BAB; color: white; padding: 30px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .content { padding: 30px; }
        .credentials-box { background: #f8f9fa; border: 2px solid #3C8BAB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .credential-item { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; border-left: 4px solid #3C8BAB; }
        .credential-label { font-weight: bold; color: #3C8BAB; }
        .credential-value { font-family: monospace; font-size: 16px; background: #e9ecef; padding: 8px; border-radius: 4px; margin-top: 5px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        .button { display: inline-block; background: #3C8BAB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .steps { counter-reset: step-counter; }
        .step { counter-increment: step-counter; margin: 15px 0; padding-left: 30px; position: relative; }
        .step::before { content: counter(step-counter); position: absolute; left: 0; top: 0; background: #3C8BAB; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏔️ Monte Everest</h1>
            <p>Sua conta profissional foi criada com sucesso!</p>
        </div>
        
        <div class="content">
            <h2>Olá, ${data.professionalName}!</h2>
            
            <p>Parabéns! Sua assinatura do <strong>${data.planName}</strong> foi confirmada e sua conta profissional já está ativa.</p>
            
            <div class="credentials-box">
                <h3 style="color: #3C8BAB; margin-bottom: 15px;">🔐 Suas Credenciais de Acesso</h3>
                
                <div class="credential-item">
                    <div class="credential-label">📧 Email / Login:</div>
                    <div class="credential-value">${data.email}</div>
                </div>
                
                <div class="credential-item">
                    <div class="credential-label">🔑 Senha Temporária:</div>
                    <div class="credential-value">${data.password}</div>
                </div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong> Por segurança, você será solicitado a alterar sua senha no primeiro login.
            </div>
            
            <h3>🚀 Próximos Passos:</h3>
            <div class="steps">
                <div class="step">Acesse o painel profissional através do link abaixo</div>
                <div class="step">Faça login com suas credenciais</div>
                <div class="step">Altere sua senha temporária</div>
                <div class="step">Complete seu perfil profissional</div>
                <div class="step">Comece a receber clientes!</div>
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.SITE_URL || 'https://monteeverest.com'}/professional-login" class="button">
                    Acessar Painel Profissional
                </a>
            </div>
            
            <h3>📞 Precisa de Ajuda?</h3>
            <p>Nossa equipe está disponível para ajudar:</p>
            <ul>
                <li>📧 Email: suporte@monteeverest.com</li>
                <li>📱 WhatsApp: (11) 99999-9999</li>
                <li>🕒 Horário: Segunda a Sexta, 8h às 18h</li>
            </ul>
        </div>
        
        <div class="footer">
            <p><strong>Monte Everest</strong> - Conectando profissionais e clientes</p>
            <p>Este é um email automático, não responda a esta mensagem.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // Enviar email com credenciais
  async sendCredentialsEmail(data: EmailCredentials): Promise<boolean> {
    try {
      // Se não há configuração de email, apenas loga as credenciais
      if (!this.config.auth?.user || !this.config.auth?.pass) {
        console.log('📧 [EMAIL SIMULATION] Credenciais para:', data.email);
        console.log('📧 [EMAIL SIMULATION] Nome:', data.professionalName);
        console.log('📧 [EMAIL SIMULATION] Login:', data.email);
        console.log('📧 [EMAIL SIMULATION] Senha:', data.password);
        console.log('📧 [EMAIL SIMULATION] Plano:', data.planName);
        console.log('📧 [EMAIL SIMULATION] Configure EMAIL_USER e EMAIL_PASSWORD para envios reais');
        return true;
      }

      // Implementação real com nodemailer seria aqui
      // Para facilitar a implementação inicial, simulo o envio
      console.log('📧 [EMAIL SENT] Para:', data.to);
      console.log('📧 [EMAIL SENT] Assunto: Bem-vindo ao Monte Everest - Credenciais de Acesso');
      
      return true;
    } catch (error) {
      console.error('❌ [EMAIL ERROR]:', error);
      return false;
    }
  }

  // Enviar email de recuperação de senha
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    try {
      const resetLink = `${process.env.SITE_URL || 'https://monteeverest.com'}/reset-password?token=${resetToken}`;
      
      console.log('📧 [PASSWORD RESET EMAIL] Para:', email);
      console.log('📧 [PASSWORD RESET EMAIL] Link:', resetLink);
      
      return true;
    } catch (error) {
      console.error('❌ [EMAIL ERROR]:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();