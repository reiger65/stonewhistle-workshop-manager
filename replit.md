# Stonewhistle Workshop Management System

## Overview

This is a comprehensive workshop management system for Stonewhistle, a company that creates custom handcrafted flutes and other instruments. The system manages the complete production workflow from Shopify order import to final delivery, including inventory management, production tracking, and customer communication.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **State Management**: TanStack Query for server state management
- **UI Components**: Shadcn/ui component library built on Radix UI
- **Styling**: Tailwind CSS with custom theme configuration
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL (hosted on Neon)
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Custom password-based authentication with scrypt hashing
- **API Design**: RESTful API with TypeScript interfaces

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Database Schema**: Comprehensive schema covering orders, items, inventory, users, and production tracking
- **Backup Strategy**: Automated daily backups with Google Drive integration
- **File Storage**: Local file system for backup files

## Key Components

### Order Management
- **Shopify Integration**: Automatic order import from Shopify API
- **Order Processing**: Complete order lifecycle tracking from creation to delivery
- **Item Management**: Individual item tracking with serial numbers and specifications
- **Status Tracking**: Multi-stage production workflow with checkbox-based progress tracking

### Production Workflow
- **Status Stages**: ordered → validated → building → testing → terrasigillata → firing → smokefiring → tuning1 → tuning2 → quality_check → ready → shipping → delivered → archived
- **Mold Management**: Inventory tracking for production molds with mapping to instrument types
- **Material Inventory**: Comprehensive inventory management for production materials
- **Quality Control**: Built-in quality assurance checkpoints

### Instrument Types
- **INNATO**: Three-chambered vessel flutes with complex tuning systems
- **NATEY**: Single-chamber flutes with Native American flute characteristics
- **DOUBLE**: Dual-chamber flutes for stereo playing
- **ZEN**: Meditation flutes in various sizes
- **CARDS**: Educational card products

### Customer Management
- **Customer Data**: Comprehensive customer information including shipping details
- **Reseller Support**: Special handling for reseller accounts with bulk operations
- **Communication**: Email integration for customer notifications

## Data Flow

### Order Import Process
1. Shopify webhook triggers or manual sync initiated
2. Order data fetched from Shopify API
3. Orders parsed and validated
4. Individual items created with specifications
5. Serial numbers generated automatically
6. Initial status set to "ordered"

### Production Tracking
1. Items progress through defined status stages
2. Each status change is timestamped
3. Checkboxes provide visual progress indicators
4. Quality checkpoints ensure product standards
5. Shipping integration for final delivery

### Inventory Management
1. Real-time tracking of mold availability
2. Material consumption tracking
3. Automated reorder notifications
4. Historical usage analytics

## External Dependencies

### Third-party Services
- **Shopify API**: Order import and fulfillment updates
- **Google Drive API**: Automated backup storage
- **SendGrid**: Email notifications (configured but not actively used)
- **Neon Database**: PostgreSQL hosting

### Development Dependencies
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Production build optimization
- **TSX**: TypeScript execution for development
- **Tailwind CSS**: Utility-first styling

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Direct connection to Neon PostgreSQL
- **Environment Variables**: `.env` file for local configuration

### Production Deployment
- **Build Process**: Vite builds frontend, ESBuild bundles backend
- **Server**: Node.js Express server
- **Database**: Neon PostgreSQL with connection pooling
- **Backup**: Automated daily backups to Google Drive

### Database Management
- **Migrations**: Drizzle migrations for schema changes
- **Backup**: Daily automated backups with retention policy
- **Restore**: Manual restore capability from backup files

## Changelog

- July 06, 2025. Initial setup
- July 06, 2025. Implemented durable color detection system for all flute types using shared utility (`client/src/lib/color-utils.ts`) ensuring consistent color code display between worksheet and popup components
- July 06, 2025. Fixed comprehensive color detection logic with correct mappings: SB=Smokefired Blue, B=Blue, T=Smokefired Terra and Black, TB=Smokefired Terra with Bronze Bubbles, C=Smokefired Black with Copper Bubbles. System now handles all database color specification variations accurately.

## User Preferences

Preferred communication style: Simple, everyday language.