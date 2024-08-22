const mongoose = require("mongoose");
const projectSchema = new mongoose.Schema({
    type: { type: String,  },
    id: { type: String,  },
    name: { type: String,  },
    business_id: { type: String,  },
    partner_id: { type: String,  },
    plan_activated_on: { type: Number },
    status: { type: String,  },
    sandbox: { type: Boolean, },
    active_plan: { type: String },
    created_at: { type: Number },
    updated_at: { type: Number },
    plan_renewal_on: { type: Number },
    scheduled_subscription_changes: { type: String },
    wa_number: { type: String },
    wa_messaging_tier: { type: String },
    billing_currency: { type: String },
    timezone: { type: String },
    subscription_started_on: { type: Number },
    is_whatsapp_verified: { type: Boolean },
    daily_template_limit: { type: Number },
    remainingQuota: { type: Number },
    mau_usage: { type: Number }
})
module.exports = mongoose.model("Projects",projectSchema);