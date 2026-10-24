const bearer = [{ bearerAuth: [] }];
const op = (summary: string, extra: object = {}) => ({ summary, security: bearer, responses: { 200: { description: "OK" }, 403: { description: "Token invalid/expired or role not allowed" } }, ...extra });

export const swaggerDocument = {
  openapi: "3.0.0",
  info: { title: "API Inventori Peralatan Teknisi", version: "1.0.0" },
  components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  paths: {
    "/api/auth/login": { post: { summary: "Login (returns JWT in data)", responses: { 200: { description: "OK" }, 400: { description: "Wrong email/password" }, 403: { description: "Inactive account" } } } },
    "/api/auth/me": { get: op("Current user") },
    "/api/users": { get: op("List users (admin)"), post: op("Create user (admin)") },
    "/api/users/{id}": { put: op("Update user (admin)") },
    "/api/categories": { get: op("List categories"), post: op("Create category (admin)") },
    "/api/categories/{id}": { put: op("Update category (admin)"), delete: op("Delete unused category (admin)") },
    "/api/equipment": { get: op("List equipment (filters: status, condition, category, search)"), post: op("Create equipment (admin)") },
    "/api/equipment/{id}": { get: op("Equipment detail"), put: op("Update equipment (admin)") },
    "/api/loans": { get: op("List loans (technician: own only)"), post: op("Lend a unit (admin); 409 if unavailable") },
    "/api/loans/mine": { get: op("My loans") },
    "/api/loans/{id}/return": { post: op("Return a unit with returnCondition (admin); 409 if already returned") },
    "/api/scan/category/{id}": { get: op("Category QR: every unit in the category, its holder, and the action allowed for the caller (read-only)") },
    "/api/scan/{serial}": { get: op("Scan QR: equipment info and the action available to the caller (read-only)") },
    "/api/scan/{serial}/borrow": { post: op("Technician borrows the scanned equipment for themself; 409 if not available") },
    "/api/scan/{serial}/return": { post: op("Technician returns their own scanned loan with returnCondition") },
    "/api/dashboard": { get: op("Dashboard (admin: all; technician: own loans)") },
  },
};
