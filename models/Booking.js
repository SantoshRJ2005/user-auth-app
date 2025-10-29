const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    // FIX 1: Changed 'name' to 'customerName' to match EJS/database
    customerName: { type: String },
    
    // FIX 2: Changed 'email' to 'customerEmail' to match EJS/database
    customerEmail: { type: String },
    
    mobile: { type: String },
    from: { type: String },
    to: { type: String },
    date: { type: Date },
    requestDate: { type: Date, default: Date.now },
    status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
    
    // FIX 3: Changed ref to 'Agencies' (plural) to match your import in auth.js
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agencies' },
    
    // FIX 4: ADDED THE MISSING vehicleID FIELD
    // This was the cause of your StrictPopulateError
    vehicleId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Vehicle'  // Make sure your vehicle model is named 'Vehicle'
    },
   driverID: {  // <-- Uppercase D
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Drivers'  },

    // These are added on approval
    driverName: { type: String },
    fare: { type: String }
    
}, { timestamps: true });

// Note: Mongoose automatically pluralizes 'Booking' to 'bookings' for the collection name.
// This export name 'Booking' is correct.
module.exports = mongoose.model("Booking", bookingSchema);