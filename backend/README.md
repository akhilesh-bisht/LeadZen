# Backend Architecture

The backend uses a small MVC structure. HTTP concerns stay in the routes and controllers, while persistence and external integrations remain behind focused modules.

- `server.ts`: Express entry point, middleware setup, route mounting, and Vite serving.
- `routes/`: Defines the public `/api/*` endpoints and forwards requests to controllers.
- `controllers/`: Validates request input, coordinates services/providers, and builds responses.
- `models/`: Mongoose schemas and backend domain models.
- `middlewares/`: Authentication and authorization middleware shared by protected routes.
- `services/`: Application services such as authentication workflows.
- `providers/`: Integrations with external business and social data APIs.
- `mongodb.ts`: Persistence adapter with MongoDB and local-file fallback support.

Frontend-only formatting helpers remain in `src/lib/utils.ts` because React components import them directly. The backend imports only the shared types from `src/types` and the export formatter from `src/lib/utils.ts`.
