# Overview

Monte Everest is a service marketplace platform that connects service providers (professionals) with potential clients. The platform serves as a digital directory where professionals can register their services, get evaluated through customer reviews, and be ranked within their respective categories. The application facilitates direct communication between clients and service providers while maintaining quality through a verification and payment system.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built with React and TypeScript using a modern component-based architecture:

- **React Router**: Using Wouter for client-side routing with pages for home, search results, professional profiles, admin dashboard, and registration
- **State Management**: React Query (TanStack Query) for server state management with optimistic updates and caching
- **UI Framework**: Radix UI components with Tailwind CSS for styling, following the shadcn/ui design system
- **Form Handling**: React Hook Form with Zod validation for type-safe form validation
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture

The backend follows a REST API architecture using Express.js:

- **API Structure**: RESTful endpoints organized by resource (professionals, categories, reviews, contacts, payments)
- **Authentication**: JWT-based authentication for admin users with role-based access control
- **Middleware**: Custom logging, error handling, and authentication middleware
- **File Structure**: Modular organization with separate route handlers and storage abstraction layer

## Data Storage

The application uses PostgreSQL with Drizzle ORM:

- **Database Schema**: Well-structured relational schema with tables for users, categories, professionals, reviews, payments, contacts, and system logs
- **ORM Layer**: Drizzle ORM provides type-safe database operations with schema validation
- **Migrations**: Database schema versioning through Drizzle Kit
- **Connection Pooling**: Neon serverless PostgreSQL with connection pooling for scalability

## Key Data Models

- **Professionals**: Service providers with profiles, categories, service areas, and verification status
- **Categories**: Service categories with slugs and metadata for organization
- **Reviews**: Customer feedback system with ratings and comments
- **Payments**: Subscription management for professional accounts
- **Contacts**: Interaction tracking between clients and professionals
- **Password Reset Tokens**: Secure token management for professional password recovery with expiration and single-use validation

## Authentication & Authorization

- **Admin Authentication**: JWT-based authentication for administrative users
- **Professional Registration**: Multi-step registration process with payment verification
- **Professional Password Recovery**: Email-based password reset system with secure token validation
- **Role-based Access**: Different access levels for admin users and public visitors
- **Session Management**: Token-based sessions with secure storage

# External Dependencies

## Payment Processing
- **Pagar.me Integration**: Brazilian payment gateway for recurring subscription billing for professionals using hosted Checkout solution
- **Subscription Model**: Monthly recurring payments to maintain active professional profiles

### Pagar.me Payment Links API Documentation

**API Endpoint**: `POST https://api.pagar.me/core/v5/payment-links`
**Test Endpoint**: `POST https://sdx-api.pagar.me/core/v5/paymentlinks` (for test accounts)
**Authentication**: Basic Auth using Secret Key (sk_test_ for test or sk_ for production)

#### Required Body Parameters:

1. **type** (string, required): Define o tipo do link de pagamento
   - `"order"` - Para criação de pedidos
   - `"subscription"` - Para recorrências

2. **payment_settings** (object, required): Configurações de pagamento do link
   - **accepted_payment_methods** (array): Lista de métodos aceitos: `["pix", "credit_card"]`
   - **pix_settings** (object, required if PIX is accepted):
     - `expires_in` (integer, required): Data de expiração do Pix em segundos
     - `expires_at` (datetime, optional): Alternativa ao expires_in no formato ISO 8601
     - `additional_information` (array of objects, optional): Informações adicionais visíveis ao consumidor
   - **credit_card_settings** (object, required if credit card is accepted):
     - `operation_type` (string): `"auth_and_capture"` ou `"auth_only"`
     - `installments` (array): Lista de parcelamentos aceitos
       - `number` (integer): Número de parcelas
       - `total` (integer): Valor total em centavos

3. **cart_settings** (object, required): Dados do carrinho
   - **items** (array, required): Lista de itens
     - `amount` (integer): Valor em centavos
     - `name` (string): Nome do item
     - `default_quantity` (integer): Quantidade padrão

#### Optional Parameters:

- **is_building** (boolean, default: false): Se true, link criado com status building (inativo)
- **name** (string): Nome exibido no dashboard (máximo 64 caracteres)
- **expires_at** (date): Data de expiração do link (formato ISO 8601)
- **expires_in** (int32): Tempo de expiração em minutos após ativar
- **max_sessions** (int32): Máximo de pedidos gerados
- **max_paid_sessions** (int32): Máximo de pedidos pagos
- **customer_settings** (object): Dados do cliente
- **layout_settings** (object): Configurações de layout

#### Example Request:

```json
{
  "is_building": false,
  "type": "order",
  "name": "Professional Name - Plan Name",
  "payment_settings": {
    "accepted_payment_methods": ["pix", "credit_card"],
    "pix_settings": {
      "expires_in": 2592000,
      "additional_information": [
        {
          "name": "Plano",
          "value": "Plan Name"
        }
      ]
    },
    "credit_card_settings": {
      "operation_type": "auth_and_capture",
      "installments": [
        { "number": 1, "total": 5990 }
      ]
    }
  },
  "cart_settings": {
    "items": [
      {
        "amount": 5990,
        "name": "Plan Name - Monthly Subscription",
        "default_quantity": 1
      }
    ]
  }
}
```

#### Important Notes:

- **PIX Settings Required**: If PIX is in accepted_payment_methods, pix_settings must be provided
- **Credit Card Settings Required**: If credit_card is in accepted_payment_methods, credit_card_settings must be provided
- **Customer Data for PIX**: PIX payments require customer name, email, document, and phones
- **QR Code Expiration**: Maximum expiration time for PIX QR Code is 10 years
- **Amounts in Cents**: All monetary values must be in cents (e.g., R$ 59,90 = 5990)

## Location Services
- **ViaCEP API**: Brazilian postal code validation service for address verification
- **Geographic Search**: Location-based filtering for finding nearby service providers

## Communication Channels
- **WhatsApp Integration**: Direct messaging capability through WhatsApp Business API
- **Phone Integration**: Click-to-call functionality for immediate contact
- **Email Service**: Nodemailer integration for transactional emails (password recovery, credentials delivery)

## Database Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling
- **Connection Management**: WebSocket connections for real-time capabilities

## Development Tools
- **Replit Integration**: Development environment optimization with runtime error handling
- **Font Resources**: Google Fonts integration for typography (Inter, DM Sans, Fira Code, Geist Mono)

## Monitoring & Analytics
- **System Logging**: Comprehensive logging system for tracking user interactions and system events
- **Contact Tracking**: Analytics for measuring professional engagement and conversion rates