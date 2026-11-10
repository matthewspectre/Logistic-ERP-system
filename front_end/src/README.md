# Source Structure

- `components/`: reusable UI components shared across features.
- `features/`: domain modules: auth, dashboard, products, suppliers, warehouses, inventory, purchase requests, purchase orders, and goods receipts.
- `hooks/`: shared React hooks.
- `layouts/`: page-level layouts and navigation.
- `pages/`: route-level pages.
- `services/`: API and external-service clients.
- `types/`: shared TypeScript types.
- `assets/`: static assets imported by the application.

Feature-specific components, hooks, and types should live inside their corresponding `features/<module>/` folder as each screen is implemented.
