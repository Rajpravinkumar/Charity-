import mongoose from "mongoose";

const managementLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    actorAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    actorEmail: { type: String, default: "" },
    details: { type: String, default: "" }
  },
  { timestamps: true, collection: "ManagementLog" }
);

export default mongoose.model("ManagementLog", managementLogSchema);
