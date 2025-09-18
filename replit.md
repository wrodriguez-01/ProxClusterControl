# Overview

ProxClusterControl is a modern web-based control panel for Proxmox Virtual Environment that provides a clean, enterprise-grade interface for managing virtual machines and containers. The project is hosted at https://github.com/wrodriguez-01/ProxClusterControl. The application focuses on monitoring, resource management, and administrative tasks for Proxmox infrastructure with an emphasis on real-time data visualization and user-friendly interactions.

The system is designed to replace or supplement the default Proxmox web interface with a more intuitive and visually appealing experience, featuring comprehensive dashboards, resource monitoring, and streamlined VM/container management workflows.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Routing**: Wouter for lightweight client-side routing without the complexity of React Router
- **State Management**: TanStack React Query for server state management, providing caching, synchronization, and background updates
- **UI Framework**: Radix UI primitives with shadcn/ui components for accessibility and consistent design
- **Styling**: Tailwind CSS with custom design system supporting both light and dark themes
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript for full-stack type safety
- **Database Integration**: Drizzle ORM with PostgreSQL (Neon serverless) for data persistence
- **API Design**: RESTful endpoints with `/api` prefix for clear separation from frontend routes
- **Development Setup**: Hot module replacement and middleware-based development server

## Component Design System
- **Design Philosophy**: Material Design principles adapted for enterprise applications
- **Theme System**: Comprehensive CSS custom properties supporting light/dark modes with system preference detection
- **Typography**: Inter/Roboto for UI text, JetBrains Mono for technical content (IDs, IPs, commands)
- **Color Palette**: Professional blue primary colors with semantic status colors (green=running, red=error, yellow=warning)
- **Layout System**: Sidebar navigation with collapsible panels and responsive grid layouts

## Data Management
- **Schema**: Drizzle schema definitions in shared directory for type-safe database operations
- **Storage Interface**: Abstracted storage layer supporting both in-memory (development) and PostgreSQL (production)
- **Type Safety**: Zod schemas for runtime validation integrated with Drizzle types
- **Session Management**: Express sessions with PostgreSQL session store for user authentication

## Development Workflow
- **Monorepo Structure**: Client and server code in separate directories with shared types
- **Path Aliases**: TypeScript path mapping for clean imports (`@/` for client, `@shared/` for shared code)
- **Hot Reloading**: Vite HMR for frontend, tsx watch mode for backend development
- **Build Process**: Separate client (Vite) and server (esbuild) build pipelines

# External Dependencies

## Database Services
- **Neon Serverless PostgreSQL**: Cloud-native PostgreSQL with connection pooling and serverless scaling
- **Connection Management**: WebSocket-based connections with automatic reconnection handling

## UI Component Libraries
- **Radix UI**: Headless UI primitives for accessibility-compliant components (dialogs, dropdowns, tooltips, etc.)
- **shadcn/ui**: Pre-built component library built on Radix with consistent styling
- **Recharts**: Data visualization library for resource monitoring charts and graphs
- **Lucide React**: Icon system providing consistent iconography throughout the application

## Development Tools
- **TypeScript**: Full-stack type safety with strict configuration
- **ESLint/Prettier**: Code quality and formatting (implied by project structure)
- **PostCSS**: CSS processing with Tailwind and autoprefixer plugins

## Build and Runtime
- **Vite**: Frontend build tool with plugin ecosystem for React and development features
- **esbuild**: Backend bundling for production deployment
- **Express Middleware**: Body parsing, static file serving, and custom logging middleware

## Authentication and Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **Crypto**: Node.js built-in module for secure ID generation and hashing

## Proxmox Integration
The application is designed to integrate with Proxmox VE APIs, though the current implementation includes mock data structures suggesting future API integration for:
- Virtual machine management and monitoring
- Container (LXC) lifecycle operations  
- Node status and resource monitoring
- Storage pool management
- User and permission management
- Activity logging and task monitoring