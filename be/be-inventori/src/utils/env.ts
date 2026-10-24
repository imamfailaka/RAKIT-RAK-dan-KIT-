import "dotenv/config";

export const env = {
  get PORT() { return Number(process.env.PORT || 3000); },
  get DATABASE_URL() { return process.env.DATABASE_URL || ""; },
  get SECRET() { return process.env.SECRET || ""; },
  get CLIENT_HOST() { return process.env.CLIENT_HOST || "http://localhost:3001"; },
  get OVERDUE_DAYS() { return Number(process.env.OVERDUE_DAYS || 7); },
};
