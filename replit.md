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
- **Pagar.me Integration**: Brazilian payment gateway for recurring subscription billing for professionals
- **Subscription Model**: Monthly recurring payments to maintain active professional profiles

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