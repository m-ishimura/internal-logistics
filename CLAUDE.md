# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an internal logistics management system for iCube Corporation - a Japanese company's headquarters mail delivery system. The application allows shipping departments to register items, manage shipments, and track deliveries, while management departments can view all department data.

## Tech Stack

- **Frontend**: React 18 + TypeScript with Next.js 15 (App Router)
- **Styling**: Tailwind CSS following Japanese government design system guidelines
- **Backend**: Next.js API routes + Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Session hybrid with Microsoft Entra ID SSO support
- **Deployment**: Vercel (full-stack)

## Development Commands

```bash
# Development
npm run dev                    # Start development server at http://localhost:3000

# Database
npm run db:generate           # Generate Prisma client
npm run db:migrate           # Run database migrations
npm run db:seed              # Seed database with sample data
npm run db:reset             # Reset database and re-run migrations
npm run db:studio            # Open Prisma Studio

# Build & Deploy
npm run build                # Build for production (includes Prisma generation)
npm run start                # Start production server
npm run lint                 # Run ESLint
```

## Database Schema Architecture

The application uses a multi-tenant architecture with department-based access control:

### Core Models
- **User**: Authentication (Entra ID + password), department association, role-based access
- **Department**: Organizational units with management hierarchy
- **Item**: Department-specific inventory items
- **Shipment**: Delivery records with sender, recipient, tracking
- **BulkImport**: CSV/Excel batch import functionality

### Key Relationships
- Users belong to departments with role-based permissions
- Items are department-scoped for data isolation
- Shipments track movement between departments
- Management users can access all department data

## Authentication System

### Dual Authentication Support
- **Microsoft Entra ID**: Enterprise SSO (primary)
- **Password**: Fallback authentication

### JWT + Session Hybrid
- JWT tokens stored in secure HTTP-only cookies
- Edge Runtime compatible verification in middleware
- User context managed via React Context (`AuthContextType`)

### Role-Based Access Control
- `DEPARTMENT_USER`: Access own department data only
- `MANAGEMENT_USER`: Access all department data

## API Architecture

### REST API Pattern
All API routes follow REST conventions under `/api/`:
- `/api/auth/*` - Authentication endpoints
- `/api/items/*` - Item management
- `/api/shipments/*` - Shipment operations
- `/api/departments/*` - Department data
- `/api/users/*` - User management
- `/api/bulk-imports/*` - Bulk import handling

### Authentication Middleware
`src/middleware.ts` handles:
- JWT verification using Edge Runtime
- Protected route access control
- User context injection via headers
- Automatic login redirects

### Request/Response Types
All API responses follow `ApiResponse<T>` interface with consistent error handling.

## Frontend Architecture

### App Router Structure
- `src/app/` - Next.js 15 App Router pages
- `src/components/` - Reusable UI components
- `src/lib/` - Utility functions and configurations

### UI Component System
Following Japanese government design system:
- Typography: Noto Sans JP (main), Noto Sans Mono (monospace)
- Accessibility: WCAG 2.1 AA compliance
- Components in `src/components/ui/` with consistent API

### State Management
- React Context for authentication state
- Server components for data fetching
- Client components for interactive functionality

## File Upload & Bulk Import

### CSV/Excel Support
- Uses `papaparse` for CSV parsing
- `xlsx` library for Excel file handling
- Server-side validation with detailed error reporting
- Bulk import tracking with `BulkImport` and `BulkImportError` models

### Validation
- Joi schema validation on all API endpoints
- TypeScript interfaces in `src/types/index.ts`
- Client and server-side validation consistency

## Security Implementation

### Authentication Security
- CSRF protection via SameSite cookies
- Secure HTTP-only cookie storage
- JWT expiration handling
- Password hashing with bcrypt (12 rounds)

### Authorization
- Department-based data isolation
- Role-based feature access
- Middleware-enforced route protection

### Data Security
- Prisma ORM prevents SQL injection
- Input sanitization via Joi validation
- No sensitive data in client bundles

## Environment Setup

Required environment variables in `.env.local`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/internal_logistics"
JWT_SECRET="your-jwt-secret"
SESSION_SECRET="your-session-secret"
AZURE_CLIENT_ID=""           # Optional: Entra ID SSO
AZURE_CLIENT_SECRET=""       # Optional: Entra ID SSO  
AZURE_TENANT_ID=""          # Optional: Entra ID SSO
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Development Testing

### Sample Users (after running `npm run db:seed`)
- Admin: admin@icube.co.jp (password: password123)
- IT User: it.user@icube.co.jp (password: password123)
- Sales User: sales.user@icube.co.jp (password: password123)

### Key Testing Paths
- Authentication: `/login`
- Dashboard: `/dashboard`
- Item Management: `/items`
- Shipment Management: `/shipments`
- Bulk Import: `/shipments/bulk`
- Management Views: Access with management role

## Important Implementation Notes

### TypeScript Configuration
- Path aliases: `@/*` maps to `src/*`
- Strict mode enabled with comprehensive type checking
- Edge Runtime compatibility considerations

### Next.js Configuration
- Webpack config for server-side package compatibility
- Experimental features for optimal performance
- Vercel deployment optimizations

### Database Considerations
- PostgreSQL-specific features used
- Prisma migrations for schema evolution
- Connection pooling for production deployment

### Accessibility & Internationalization
- Screen reader support with proper ARIA attributes
- Keyboard navigation implementation
- Japanese language support with appropriate fonts