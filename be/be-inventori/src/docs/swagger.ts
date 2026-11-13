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
    "/api/scan/{serial}/borrow": { post: op("Technician borrows the scanned equipment for themself; body must include location {lat, lng, accuracy?} (400 if missing); 409 if not available") },
    "/api/scan/{serial}/return": { post: op("Technician returns their own scanned loan with returnCondition and location {lat, lng, accuracy?} (400 if missing)") },
    "/api/locations/checkin": { post: op("Technician sends current phone GPS: body { location: { lat, lng, accuracy? } }; 409 when holding no equipment (privacy)") },
    "/api/locations": { get: op("Admin: latest position of technicians currently holding equipment + location history (query days=1..90, default 7)") },
    "/api/locations/tracker": { get: op("Technician: own Traccar Client device id (null if none) and number of items held"), post: op("Technician: create/replace own Traccar Client device id") },
    "/api/traccar": { post: { summary: "Traccar Client receiver (no JWT; device id is the key). JSON or OsmAnd params id/lat/lon/accuracy/timestamp. Points are stored only while the technician holds equipment; otherwise 200 ignored", responses: { 200: { description: "Saved" }, 400: { description: "Invalid data" }, 404: { description: "Unknown device" } } } },
    "/api/telegram/daily": { get: { summary: "Vercel Cron: send daily warehouse summary to the Telegram group (Authorization: Bearer CRON_SECRET)", responses: { 200: { description: "OK" }, 403: { description: "Wrong/missing CRON_SECRET" } } } },
    "/api/dashboard": { get: op("Dashboard (admin: all; technician: own loans)") },
  },
};
