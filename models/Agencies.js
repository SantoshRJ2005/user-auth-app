// models/Agencies.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const agencySchema = new mongoose.Schema({
    // --- Common Fields ---
    password: { type: String, required: true },
    role: { type: String, default: 'agency' },

    // --- Agency-Specific Fields ---
    agencyName: { type: String },
    ownerName: { type: String },
    oprateStation: { type:String },
    agencyEmail: { type: String,  sparse: true, trim: true, lowercase: true }, 
    agencyMobile: { type: String,  sparse: true }, 
    agencyLicense: { type: String,  sparse: true },
    gstNumber: { type: String, sparse: true },
    panNumber: { type: String,  sparse: true },
    gumastaLicenseUrl: { type: String }

}, { timestamps: true });

agencySchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

const Agency = mongoose.model('Agency', agencySchema);
module.exports = Agency;
