import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    user: { type: String, required: true },
    phone: { type: String },
    location: { type: String },
    status: {
      type: String,
      enum: ["open", "pending", "in_working", "seen", "resolved"],
      default: "open",
    },
    assignedTo: { type: String, default: "" },
    repairPhone: { type: String, default: "" },
    at: { type: String, required: true },
    description: { type: String, required: true },
    images: { type: [String], default: [] },
  },
  {
    timestamps: true,
  },
);

const Issue = mongoose.models.Issue || mongoose.model("Issue", issueSchema);
export default Issue;
