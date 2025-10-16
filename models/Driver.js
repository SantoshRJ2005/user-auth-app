const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    address: String,
    licenseNumber: String,
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Agency" },

    // Vehicle reference
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Driver", driverSchema);
