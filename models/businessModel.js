const mongoose = require("mongoose");
const businessSchema = new mongoose.Schema({
    business_id: { type: String, },
  active: { type: Boolean,  },
  display_name: { type: String,  },
  project_ids: { type: [String] },
  user_name: { type: String },
  email: { type: String },
  created_at: { type: Date },
  updated_at: { type: Date },
  company: { type: String },
  contact: { type: String },
  currency: { type: String },
  timezone: { type: String },
  partner_id: { type: String },
  type: { type: String },
  createdOn: { type: Date },
  companySize: { type: Number },
  password: { type: Boolean },
  created_at: { type: Date, default: Date.now },
})
module.exports = mongoose.model("Business",businessSchema);