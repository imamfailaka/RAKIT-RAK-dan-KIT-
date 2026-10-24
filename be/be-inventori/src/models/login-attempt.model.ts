import mongoose from "mongoose";

const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now },
});
// Old rows clean themselves up a day after the last failed attempt.
schema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.LoginAttempt || mongoose.model("LoginAttempt", schema);
