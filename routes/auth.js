const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { put } = require('@vercel/blob'); // 👈 Import Vercel Blob
const router = express.Router();

// --- Models ---
const User = require('../models/User');
// (Your other models like Booking, Vehicle, Driver remain the same)
const bookingSchema = new mongoose.Schema({ name: { type: String, required: true }, email: { type: String, required: true }, from: { type: String, required: true }, to: { type: String, required: true }, date: { type: Date, required: true }, requestDate: { type: Date, default: Date.now }, status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] }, agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, driverName: { type: String }, fare: { type: Number }});
const Booking = mongoose.model('Booking', bookingSchema);
const vehicleSchema = new mongoose.Schema({ vehicle_name: { type: String, required: true }, model: { type: String, required: true }, number_plate: { type: String, required: true, unique: true }, rc_number: { type: String, required: true, unique: true }, insurance_number: { type: String, required: true, unique: true }, owner_name: { type: String, required: true }, ac_type: { type: String, enum: ['AC', 'Non-AC', 'Both'], required: true }, vehicle_type: { type: String, enum: ['Premium', 'Normal', 'Sedan', 'SUV'], required: true }, max_capacity: { type: Number, required: true }, rate_per_km: { type: Number, required: true }, agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, createdAt: { type: Date, default: Date.now }, assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null }});
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const driverSchema = new mongoose.Schema({ fullName: { type: String, required: true }, email: { type: String, required: true, unique: true }, password: { type: String, required: true }, age: { type: Number, required: true }, gender: { type: String, required: true }, mobile: { type: String, required: true, unique: true }, address: { type: String, required: true }, licenseNumber: { type: String, required: true, unique: true }, agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, role: { type: String, default: 'driver' }, assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null }});
driverSchema.pre('save', async function(next) { if (!this.isModified('password')) { return next(); } const salt = await bcrypt.genSalt(10); this.password = await bcrypt.hash(this.password, salt); next(); });
const Driver = mongoose.model('Driver', driverSchema);


// --- Multer Configuration for In-Memory Storage ---
// We only use this to temporarily hold the file before uploading to Blob.
const memoryUpload = multer({ storage: multer.memoryStorage() });


// --- Middleware ---
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    return res.redirect('/login');
}

// --- GET Routes (no changes here) ---
router.get('/', (req, res) => res.render('login', { message: '' }));
router.get('/login', (req, res) => res.render('login', { message: '' }));
router.get('/signup', (req, res) => res.render('signup', { message: '' }));
// ... (Your other GET routes remain the same) ...
router.get('/booking-request', isAuthenticated, (req, res) => res.render('bookingRequest', { message: '' }));
router.get('/addDriver', isAuthenticated, async (req, res) => { try { const availableVehicles = await Vehicle.find({ agencyId: req.session.userId, assignedDriver: null }).sort({ vehicle_name: 1 }); res.render('addDriver', { vehicles: availableVehicles }); } catch (err) { console.error("Error fetching available vehicles:", err); res.render('addDriver', { vehicles: [] }); }});
router.get('/viewDriver', isAuthenticated, async (req, res) => { try { const agencyDrivers = await Driver.find({ agencyId: req.session.userId }).populate('assignedVehicle').sort({ fullName: 1 }); const availableVehicles = await Vehicle.find({ agencyId: req.session.userId, assignedDriver: null }); res.render('viewDriver', { drivers: agencyDrivers, availableVehicles: availableVehicles, error: null }); } catch (err) { console.error("Error fetching drivers:", err); res.render('viewDriver', { drivers: [], availableVehicles: [], error: "Could not fetch the driver list. Please try again." }); }});
router.get('/addVehicles', isAuthenticated, (req, res) => res.render('addVehicles'));
router.get('/viewVehicles', isAuthenticated, async (req, res) => { try { const vehicles = await Vehicle.find({ agencyId: req.session.userId }).sort({ createdAt: -1 }); res.render('viewVehicles', { vehicles, error: null }); } catch (err) { console.error("Error fetching vehicles:", err); res.render('viewVehicles', { vehicles: [], error: 'Could not fetch vehicles.' }); }});
router.get('/manageBooking', isAuthenticated, async (req, res) => { try { const [pendingBookings, agencyDrivers] = await Promise.all([ Booking.find({ status: 'pending' }).sort({ requestDate: -1 }), Driver.find({ agencyId: req.session.userId }).select('fullName').sort({ fullName: 1 }) ]); res.render('manageBooking', { bookings: pendingBookings, drivers: agencyDrivers, error: null }); } catch (err) { console.error("Error fetching bookings/drivers:", err); res.render('manageBooking', { bookings: [], drivers: [], error: "Could not fetch data." }); }});
router.get('/register-agency', (req, res) => res.render('agencySignup'));
router.get('/logout', (req, res) => { req.session.destroy(err => { if (err) return res.redirect('/dashboard'); res.clearCookie('connect.sid'); res.redirect('/login'); }); });

// --- DASHBOARD ROUTE (with .lean() fix) ---
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const agency = await User.findById(req.session.userId).lean(); // Use .lean() for safety
        if (!agency || agency.role !== 'agency') {
            return res.redirect('/login');
        }
        res.render('dashboard', { agency: agency });
    } catch (err) {
        console.error("DASHBOARD_ROUTE_ERROR:", err);
        res.status(500).send("Error loading your dashboard. Please try again later.");
    }
});


// --- POST Routes ---

// 👇 NEW: API Route for uploading file to Vercel Blob
router.post('/api/upload', memoryUpload.single('gumastaLicense'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Sanitize the filename to be URL-friendly
    const sanitizedFilename = req.file.originalname.replace(/\s+/g, '-');
    const filename = `${Date.now()}-${sanitizedFilename}`;

    try {
        // Upload the file's buffer to Vercel Blob
        const blob = await put(filename, req.file.buffer, {
            access: 'public',
        });
        // Send back the blob object, which contains the public URL
        res.status(200).json(blob);
    } catch (error) {
        console.error("Error uploading to Vercel Blob:", error);
        res.status(500).json({ message: 'Error uploading file.' });
    }
});

// 👇 UPDATED: Agency Registration Route
router.post('/register-agency', async (req, res) => {
    try {
        const {
            agencyName, ownerName, oprateStation, agencyEmail, agencyMobile,
            agencyLicense, gstNumber, panNumber, password,
            gumastaLicenseUrl // This is the URL from the frontend
        } = req.body;

        const existingAgency = await User.findOne({
            $or: [
                { email: agencyEmail }, { agencyMobile }, { gstNumber }, { panNumber }
            ]
        });

        if (existingAgency) {
            return res.status(409).json({ message: 'An agency with this email, mobile, GST, or PAN already exists.' });
        }

        const newAgency = new User({
            email: agencyEmail,
            password,
            role: 'agency',
            agencyName,
            ownerName,
            oprateStation,
            agencyMobile,
            agencyLicense,
            gstNumber,
            panNumber,
            gumastaLicensePath: gumastaLicenseUrl || null // Save the URL
        });

        await newAgency.save();
        res.status(201).json({ message: 'Agency registered successfully! You can now log in.' });

    } catch (err) {
        console.error("Error registering agency:", err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// --- Other POST Routes (no changes) ---
router.post('/login', async (req, res) => { const { email, password } = req.body; try { const user = await User.findOne({ email }); if (!user) return res.render('login', { message: 'Invalid credentials.' }); const isMatch = await bcrypt.compare(password, user.password); if (!isMatch) return res.render('login', { message: 'Invalid credentials.' }); req.session.userId = user._id; req.session.userName = user.name; req.session.userEmail = user.email; req.session.userAge = user.age || 'N/A'; req.session.userRole = user.role; res.redirect(user.role === 'agency' ? '/manageBooking' : '/dashboard'); } catch (err) { res.render('login', { message: 'Server error. Please try again.' }); }});
router.post('/adddriver', isAuthenticated, async (req, res) => { const { fullName, age, gender, mobile, email, license, address, tempPassword, assignedVehicle } = req.body; try { if (await Driver.findOne({ $or: [{ email }, { mobile }, { licenseNumber: license }] })) { return res.status(409).json({ message: 'A driver with this email, mobile, or license already exists.' }); } const newDriver = new Driver({ fullName, email, password: tempPassword, age, gender, mobile, address, licenseNumber: license, agencyId: req.session.userId, assignedVehicle: assignedVehicle || null }); await newDriver.save(); if (assignedVehicle) { await Vehicle.findByIdAndUpdate(assignedVehicle, { assignedDriver: newDriver._id }); } res.status(201).json({ message: 'Driver registered successfully!' }); } catch (err) { console.error("Error adding driver:", err); res.status(500).json({ message: 'Server error. Please try again.' }); }});
router.post('/editDriver', isAuthenticated, async (req, res) => { try { const { driverId, fullName, email, mobile, licenseNumber, address, assignedVehicle } = req.body; const originalDriver = await Driver.findById(driverId); if (!originalDriver) return res.redirect('/viewDriver'); const oldVehicleId = originalDriver.assignedVehicle; await Driver.findByIdAndUpdate(driverId, { fullName, email, mobile, licenseNumber, address, assignedVehicle: assignedVehicle || null }); if (oldVehicleId?.toString() !== assignedVehicle) { if (oldVehicleId) await Vehicle.findByIdAndUpdate(oldVehicleId, { assignedDriver: null }); if (assignedVehicle) await Vehicle.findByIdAndUpdate(assignedVehicle, { assignedDriver: driverId }); } res.redirect('/viewDriver'); } catch (err) { console.error("Error updating driver:", err); res.redirect('/viewDriver'); }});
router.post('/deleteDriver', isAuthenticated, async (req, res) => { try { const { driverId } = req.body; const driverToDelete = await Driver.findById(driverId); if (driverToDelete) { if (driverToDelete.assignedVehicle) { await Vehicle.findByIdAndUpdate(driverToDelete.assignedVehicle, { assignedDriver: null }); } await Driver.findByIdAndDelete(driverId); } res.redirect('/viewDriver'); } catch (err) { console.error("Error deleting driver:", err); res.redirect('/viewDriver'); }});
router.post('/addvehicle', isAuthenticated, async (req, res) => { const { vehicle_name, model, number_plate, rc_number, insurance_number, owner_name, ac_type, vehicle_type, max_capacity, rate_per_km } = req.body; try { if (await Vehicle.findOne({ number_plate })) { return res.status(409).json({ message: 'Vehicle with this number plate already exists.' }); } await new Vehicle({ vehicle_name, model, number_plate, rc_number, insurance_number, owner_name, ac_type, vehicle_type, max_capacity, rate_per_km, agencyId: req.session.userId }).save(); res.status(201).json({ message: 'Vehicle added successfully!' }); } catch (err) { console.error("Error adding vehicle:", err); res.status(500).json({ message: 'Server error. Please try again.' }); }});
router.post('/bookingrequest', isAuthenticated, async (req, res) => { try { const { from, to, date } = req.body; const agency = await User.findOne({ role: "agency" }); if (!agency) return res.render('bookingRequest', { message: 'Sorry, no agencies are available.' }); await new Booking({ name: req.session.userName, email: req.session.userEmail, from, to, date, agencyId: agency._id }).save(); res.render('bookingRequest', { message: 'Booking request submitted successfully!' }); } catch (err) { res.render('bookingRequest', { message: 'Error submitting booking. Please try again.' }); }});
router.post('/approvebooking', isAuthenticated, async (req, res) => { try { const { requestId, driverName, fare } = req.body; await Booking.findByIdAndUpdate(requestId, { status: 'approved', driverName, fare }); res.redirect('/manageBooking'); } catch (err) { res.redirect('/manageBooking'); }});
router.post('/rejectbooking', isAuthenticated, async (req, res) => { try { const { requestId } = req.body; await Booking.findByIdAndUpdate(requestId, { status: 'rejected' }); res.redirect('/manageBooking'); } catch (err) { res.redirect('/manageBooking'); }});

module.exports = router;
