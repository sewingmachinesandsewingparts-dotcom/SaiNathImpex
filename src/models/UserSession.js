import mongoose from "mongoose";

const userSessionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, index: true },
    tab_id: { type: String, required: true, index: true },
    access_token_hash: { type: String, required: true },
    refresh_token_hash: { type: String, required: true },
    device_fingerprint: { type: String, default: "unknown" },
    created_at: { type: Date, default: Date.now },
    last_activity: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true },
    status: { type: String, enum: ["active", "inactive", "expired"], default: "active" },
  },
  {
    timestamps: false,
  },
);

const UserSession = mongoose.models.UserSession || mongoose.model("UserSession", userSessionSchema);
export default UserSession;
