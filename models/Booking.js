// models/Booking.js

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    mobile: { type: String },
    from: { type: String },
    to: { type: String },
    date: { type: Date },
    requestDate: { type: Date, default: Date.now },
    status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
    
    // This links to the agency who gets the request
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
    
    // These are added on approval
    driverName: { type: String },
    fare: { type: String }
    
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);