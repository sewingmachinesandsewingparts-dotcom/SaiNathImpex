import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: "" },
    image: { type: String, default: "" },
    phone: { type: String },
    orders: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    role: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
    permissions: [{ type: String, default: [] }],
    activity: [
      {
        action: { type: String, required: true },
        target: { type: String, default: "" },
        details: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;

