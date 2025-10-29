const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
    vehicle_name: { type: String, required: true },
    model: { type: String, required: true },
    number_plate: { type: String, required: true, },
    rc_number: { type: String, required: true },
    insurance_number: { type: String, required: true },
    owner_name: { type: String, required: true },
    ac_type: { type: String, required: true },
    vehicle_type: { type: String, required: true },
    max_capacity: { type: String, required: true },
    rate_per_km: { type: String, required: true },

    // --- THIS IS THE FIX ---
    // The ref name must match the model name you export (Agencies)
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agencies', required: true },
    
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null }

}, { timestamps: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);