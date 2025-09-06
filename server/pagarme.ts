import { Client, PlansController, SubscriptionsController } from '@pagarme/pagarme-nodejs-sdk';
import { storage } from './storage';

// Get Pagar.me API key from system configuration
async function getPagarmeApiKey(): Promise<string> {
  const config = await storage.getSystemConfig('PAGARME_API_KEY');
  if (!config?.value) {
    throw new Error('PAGARME_API_KEY não configurado. Configure nas configurações do sistema.');
  }
  return config.value;
}

// Initialize Pagar.me client dynamically
async function createPagarmeClient() {
  const apiKey = await getPagarmeApiKey();
  
  return new Client({
    basicAuthCredentials: {
      username: apiKey,
      password: ''
    },
    serviceRefererName: 'Monte-Everest',
    timeout: 30000,
  });
}

class PagarMeService {
  async testConnection() {
    try {
      console.log('Testing Pagar.me connection...');
      const client = await createPagarmeClient();
      const plansController = new PlansController(client);
      const result = await plansController.getPlans(1, 1);
      console.log('Connection successful!');
      return result;
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  }

  async createPlan(planData: any) {
    try {
      console.log('Creating plan with data:', JSON.stringify(planData, null, 2));
      const client = await createPagarmeClient();
      const plansController = new PlansController(client);
      const result = await plansController.createPlan(planData);
      console.log('Plan created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  }

  async createSubscription(subscriptionData: any) {
    try {
      console.log('Creating subscription with data:', JSON.stringify(subscriptionData, null, 2));
      const client = await createPagarmeClient();
      const subscriptionsController = new SubscriptionsController(client);
      const result = await subscriptionsController.createSubscription(subscriptionData);
      console.log('Subscription created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating subscription:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  // Método para sincronizar plano local com Pagar.me
  async syncPlanWithPagarMe(localPlan: any) {
    try {
      // Primeiro testar a conexão
      console.log('Testing Pagar.me connection before sync...');
      await this.testConnection();
      console.log('Connection successful! Proceeding with plan sync...');

      const pagarMePlanData = {
        name: localPlan.name,
        description: localPlan.description || `Plano ${localPlan.name}`,
        currency: 'BRL',
        interval: 'month',
        intervalCount: 1,
        billingDays: [], // Array vazio para prepaid - SDK exige o campo
        billingType: 'prepaid',
        paymentMethods: ['credit_card', 'boleto'],
        installments: [1, 2, 3, 6, 12],
        pricingScheme: {
          schemeType: 'unit',
          price: Math.round(localPlan.monthlyPrice * 100), // Pagar.me usa centavos
        },
        metadata: {
          plan_id: localPlan.id,
          created_by: 'monte_everest_system'
        },
        items: [{
          id: localPlan.id,
          name: localPlan.name,
          description: localPlan.description || `Plano ${localPlan.name}`,
          quantity: 1,
          pricingScheme: {
            schemeType: 'unit',
            price: Math.round(localPlan.monthlyPrice * 100), // Pagar.me usa centavos
          },
        }],
        statementDescriptor: 'MONTE EVEREST',
        shippable: false,
      };

      console.log('Dados que serão enviados para Pagar.me:', JSON.stringify(pagarMePlanData, null, 2));

      // Criar novo plano
      return await this.createPlan(pagarMePlanData);
    } catch (error) {
      console.error('Error in syncPlanWithPagarMe:', error);
      throw new Error(`Falha na sincronização com Pagar.me: ${(error as any).message}`);
    }
  }
}

export const pagarmeService = new PagarMeService();