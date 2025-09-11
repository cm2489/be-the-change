# Overview

Be The Change is a democracy advocacy platform built as a Progressive Web App (PWA) using Next.js 15. The application empowers citizens to engage in democratic processes by providing AI-powered advocacy scripts, representative contact information, and civic engagement tools. The platform allows users to find their elected officials, generate personalized advocacy content, and participate in political processes through organized digital activism.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 15 with React 19 running in App Router mode
- **Styling**: Tailwind CSS 4.0 for utility-first responsive design
- **TypeScript**: Full TypeScript integration for type safety
- **PWA Features**: Service worker implementation with offline support, app manifest for mobile installation
- **Client-Side Routing**: Next.js App Router with protected routes for authenticated users

## Authentication & User Management
- **Authentication Provider**: Supabase Auth with email/password and OAuth (Google) integration
- **Session Management**: Client-side session handling using Supabase Auth helpers
- **User Flow**: Landing page → Authentication → Onboarding → Dashboard workflow
- **Protected Routes**: Dashboard and feature pages require authentication

## Data Architecture
- **Primary Database**: Supabase (PostgreSQL) for user profiles, interests, and application data
- **Client Library**: Supabase JavaScript client for real-time database operations
- **Data Models**: User profiles with location data, interest categories, and representative information
- **API Layer**: Next.js API routes for server-side operations and external service integration

## Progressive Web App Features
- **Service Worker**: Caching strategy for offline functionality
- **App Manifest**: Native app-like installation on mobile devices
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Offline Support**: Cached content accessibility when internet is unavailable

## Application Structure
- **Onboarding Flow**: Multi-step user setup collecting interests, location, and preferences
- **Dashboard**: Central hub for user actions and personalized content
- **Representatives Module**: Location-based representative discovery and contact information
- **Location Services**: Geolocation API integration with manual address fallback

# External Dependencies

## Core Services
- **Supabase**: Backend-as-a-Service providing PostgreSQL database, authentication, and real-time subscriptions
- **Next.js**: React framework providing server-side rendering, API routes, and build optimization

## Third-Party APIs
- **ProPublica Congress API**: Federal representative data and congressional information
- **OpenStates API**: State-level representative information and legislative data
- **Geolocation API**: Browser-based location services for representative lookup
- **Google OAuth**: Social authentication integration through Supabase

## Development Tools
- **ESLint**: Code linting with Next.js core web vitals configuration
- **TypeScript**: Static type checking and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development

## Hosting & Environment
- **Replit Deployment**: Configured for Replit's autoscale deployment with proper port mapping resolution
- **Environment Variables**: Supabase connection strings and API keys managed through environment configuration
- **Port Configuration**: Development uses port 5000, production deployment uses port 3000 with single external port mapping to resolve Cloud Run conflicts