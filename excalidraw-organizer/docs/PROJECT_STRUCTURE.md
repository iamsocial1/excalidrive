# Project Structure

## Directory Overview

```
src/
├── components/     # Reusable React components
├── contexts/       # React Context providers for global state
├── pages/          # Page-level components (routes)
├── services/       # API service classes and business logic
├── types/          # TypeScript type definitions and interfaces
└── utils/          # Utility functions and helpers
```

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:

- `@/*` - Root src directory
- `@/components/*` - Components directory
- `@/services/*` - Services directory
- `@/contexts/*` - Contexts directory
- `@/types/*` - Types directory
- `@/utils/*` - Utils directory
- `@/pages/*` - Pages directory

## Environment Variables

Environment variables are configured in `.env` files and must be prefixed with `VITE_` to be accessible in the application.

Example:
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
