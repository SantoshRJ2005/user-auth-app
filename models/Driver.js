// models/Driver.js

const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
    // --- Driver-Specific Fields ---
    fullName: { type: String },
    email: { type: String, unique: true, sparse: true, trim: true, lowercase: true }, // For Driver login
    password: { type: String, required: true },
    age: { type: Number },
    gender: { type: String },
    mobile: { type: String, unique: true, sparse: true },
    address: { type: String },
    licenseNumber: { type: String, unique: true, sparse: true },
    
    // This correctly links to the 'Agency' model
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' }, 
    
    assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    
    role: { type: String, default: 'driver' }

}, { timestamps: true });

driverSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});


module.exports = mongoose.model("Driver", driverSchema);