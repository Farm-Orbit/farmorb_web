# FarmOrbit - Farm Management Platform

FarmOrbit is a comprehensive farm management platform built with **Next.js 15**, **React 19**, **TypeScript**, and **Tailwind CSS**. It provides farmers with everything they need to manage their farms, livestock, teams, and operations in one integrated platform.

![FarmOrbit Dashboard](./banner.png)

## Overview

FarmOrbit helps farmers streamline their operations by providing:
- **Farm Management**: Create and manage multiple farms with detailed information
- **Team Collaboration**: Invite team members, manage roles, and collaborate effectively
- **Livestock Management**: Track animals, groups, health records, and breeding information
- **Real-time Notifications**: Stay updated with invitation acceptances, updates, and alerts
- **Modern UI**: Beautiful, responsive interface with dark mode support

## Tech Stack

FarmOrbit is built on modern, production-ready technologies:

- **Framework**: Next.js 15.x (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS V4
- **State Management**: Redux Toolkit
- **Backend API**: Go 1.23.6 with PostgreSQL
- **Authentication**: JWT with refresh token rotation
- **Testing**: Cypress for E2E, Jest for unit tests

## Features

### ✅ Core Features (Implemented)

- **User Authentication**: Registration, login, logout, profile management
- **Farm Management**: Create, view, edit, and delete farms
- **Team Collaboration**: Invite members, manage roles, accept/decline invitations
- **User Profile**: Update personal information, change password, email management
- **Notifications**: Toast notification system with multiple notification types
- **Responsive Design**: Mobile-first approach with card layouts for small screens
- **Dark Mode**: Full dark mode support across all components
- **Livestock Management**: Groups and animals tracking (backend complete, frontend in progress)

### 🚧 Coming Soon

- **Health Records**: Track vaccinations, treatments, and veterinary visits
- **Breeding Management**: Monitor breeding cycles, pregnancies, and offspring
- **Feeding & Nutrition**: Track feed consumption and costs
- **Analytics & Reporting**: Comprehensive dashboards and data visualization
- **Mobile App**: Native mobile application for field use

## Installation

### Prerequisites

- Node.js 20.x or later
- Yarn package manager
- Go 1.23.6 or later (for backend development)
- PostgreSQL 14+ (for database)

### Getting Started

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd farmorb
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**:
   ```bash
   yarn dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:3000`

### Backend Setup

See the [Backend README](../farmorb_api/README.md) for detailed backend setup instructions.

## Project Structure

```
farmorb/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (admin)/           # Admin pages (protected routes)
│   │   └── (full-width-pages)/ # Auth and error pages
│   ├── components/             # React components
│   │   ├── animals/           # Animal management components
│   │   ├── auth/              # Authentication components
│   │   ├── farms/             # Farm management components
│   │   ├── groups/            # Group management components
│   │   └── ui/                # Reusable UI components
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API service layer
│   ├── store/                 # Redux store and slices
│   └── types/                 # TypeScript type definitions
├── cypress/                   # E2E tests
├── docs/                      # Documentation
└── public/                    # Static assets
```

## Development

### Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn test` - Run tests
- `yarn test:e2e` - Run Cypress E2E tests

### Code Style

- Use TypeScript for all new files
- Follow the established typography system (see `docs/TYPOGRAPHY.md`)
- Maintain dark mode support for all components
- Use `data-testid` attributes for E2E testing
- Follow the component architecture guidelines

## Testing

FarmOrbit includes comprehensive testing:

- **E2E Tests**: Cypress tests for critical user flows
- **Integration Tests**: Real API integration tests (no mocking)
- **Unit Tests**: Component and utility function tests

See `cypress/README.md` for testing guidelines.

## Documentation

- [Features Implementation Status](./docs/FEATURES.md)
- [Product Features](./docs/PRODUCT_FEATURES.md)
- [Product Roadmap](./docs/PRODUCT_ROADMAP.md)
- [Typography System](./docs/TYPOGRAPHY.md)
- [Backend API Documentation](../farmorb_api/README.md)

## Contributing

1. Follow the coding standards and conventions
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting

## License

FarmOrbit is released under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**FarmOrbit** - Modern farm management for the digital age 🌾
