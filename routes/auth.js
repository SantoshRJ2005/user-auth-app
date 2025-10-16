const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const router = express.Router();

// --- Schemas ---
const User = require('../models/User');

const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    date: { type: Date, required: true },
    requestDate: { type: Date, default: Date.now },
    status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    driverName: { type: String },
    fare: { type: Number }
});
const Booking = mongoose.model('Booking', bookingSchema);

const driverSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, default: 'driver' },
    // ADDED: The vehicleDetails field to the schema
   
});

// --- Vehicle Schema ---
const vehicleSchema = new mongoose.Schema({
    vehicle_name: { type: String, required: true },
    model: { type: String, required: true },
    number_plate: { type: String, required: true, unique: true },
    rc_number: { type: String, required: true, unique: true },
    insurance_number: { type: String, required: true, unique: true },
    owner_name: { type: String, required: true },
    ac_type: { type: String, enum: ['AC', 'Non-AC', 'Both'], required: true },
    vehicle_type: { type: String, enum: ['Premium', 'Normal', 'Sedan', 'SUV'], required: true },
    max_capacity: { type: Number, required: true },
    rate_per_km: { type: Number, required: true },
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);


driverSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const Driver = mongoose.model('Driver', driverSchema);

// --- Middleware ---
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.redirect('/login');
    }
}

// --- GET Routes ---
router.get('/', (req, res) => res.render('login', { message: '' }));
router.get('/login', (req, res) => res.render('login', { message: '' }));
router.get('/signup', (req, res) => res.render('signup', { message: '' }));

router.get('/addDriver', isAuthenticated, (req, res) => {
    res.render('addDriver');
});

router.get('/addVehicles', isAuthenticated, (req, res) => {
    res.render('addVehicles');
});


router.get('/viewVechicles', isAuthenticated, (req, res) => {
    res.render('viewVechicles');
});
// --- Add Vehicle Route ---
router.post('/addvehicle', isAuthenticated, async (req, res) => {
    try {
        const {
            vehicle_name, model, number_plate, rc_number,
            insurance_number, owner_name, ac_type,
            vehicle_type, max_capacity, rate_per_km
        } = req.body;

        // Check if number plate already exists
        const existing = await Vehicle.findOne({ number_plate });
        if (existing) {
            return res.status(409).json({ message: 'Vehicle with this number plate already exists.' });
        }

        const newVehicle = new Vehicle({
            vehicle_name,
            model,
            number_plate,
            rc_number,
            insurance_number,
            owner_name,
            ac_type,
            vehicle_type,
            max_capacity,
            rate_per_km,
            agencyId: req.session.userId
        });

        await newVehicle.save();
        res.status(201).json({ message: 'Vehicle added successfully!' });

    } catch (err) {
        console.error("Error adding vehicle:", err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// CORRECTED /viewDriver ROUTE
router.get('/viewDriver', isAuthenticated, async (req, res) => {
    try {
        // Fetch all drivers that belong to the currently logged-in agency
        const agencyDrivers = await Driver.find({
            agencyId: req.session.userId
        }).sort({ fullName: 1 }); // Sort alphabetically by name

        // Render the viewDriver page and pass the list of drivers
        res.render('viewDriver', {
            drivers: agencyDrivers,
            error: null
        });

    } catch (err) {
        console.error("Error fetching drivers:", err);
        // If an error occurs, render the page with an error message
        res.render('viewDriver', {
            drivers: [],
            error: "Could not fetch the driver list. Please try again."
        });
    }
});


router.get('/booking-request', isAuthenticated, (req, res) => {
    res.render('bookingRequest', { message: '' });
});


router.get('/manageBooking', isAuthenticated, async (req, res) => {
    try {
        // Fetch pending bookings and the agency's drivers at the same time
        const [pendingBookings, agencyDrivers] = await Promise.all([
            Booking.find({
               
                status: 'pending' 
            }).sort({ requestDate: -1 }),

            Driver.find({
                agencyId: req.session.userId,
            }).select('fullName').sort({ fullName: 1 }) // Only get names, sort alphabetically
        ]);

        // Pass both lists to the template
        res.render('manageBooking', {
            bookings: pendingBookings,
            drivers: agencyDrivers, // The new list of drivers
            error: null
        });

    } catch (err) {
        console.error("Error fetching bookings or drivers:", err);
        // Pass empty arrays on error to prevent the template from crashing
        res.render('manageBooking', {
            bookings: [],
            drivers: [],
            error: "Could not fetch booking requests or driver list."
        });
    }
});

router.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', {
        name: req.session.userName,
        email: req.session.userEmail,
        age: req.session.userAge,
        role: req.session.userRole
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.redirect('/dashboard');
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// --- POST Routes ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.render('login', { message: 'Invalid credentials.' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.render('login', { message: 'Invalid credentials.' });
        req.session.userId = user._id;
        req.session.userName = user.name;
        req.session.userEmail = user.email;
        req.session.userAge = user.age || 'N/A';
        req.session.userRole = user.role;
        if (user.role === 'agency') res.redirect('/manageBooking');
        else res.redirect('/dashboard');
    } catch (err) {
        res.render('login', { message: 'Server error. Please try again.' });
    }
});

router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, age, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.render('signup', { message: 'User with that email already exists.' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword, age: Number(age) || undefined, role });
        await user.save();
        res.render('login', { message: 'Signup successful! Please log in.' });
    } catch (err) {
        res.render('signup', { message: 'Server error. Please try again.' });
    }
});

router.post('/bookingrequest', isAuthenticated, async (req, res) => {
    try {
        const { from, to, date } = req.body;
        const agency = await User.findOne({ role: "agency" });
        if (!agency) return res.render('bookingRequest', { message: 'Sorry, no agencies are available.' });
        const newBooking = new Booking({ name: req.session.userName, email: req.session.userEmail, from, to, date, agencyId: agency._id });
        await newBooking.save();
        res.render('bookingRequest', { message: 'Booking request submitted successfully!' });
    } catch (err) {
        res.render('bookingRequest', { message: 'Error submitting booking. Please try again.' });
    }
});

router.post('/approvebooking', isAuthenticated, async (req, res) => {
    try {
        const { requestId, driverName, fare } = req.body;
        await Booking.findOneAndUpdate({ _id: requestId, agencyId: req.session.userId }, { status: 'approved', driverName, fare });
        res.redirect('/manageBooking');
    } catch (err) {
        res.redirect('/manageBooking');
    }
});

router.post('/adddriver', isAuthenticated, async (req, res) => {
    const { fullName, age, gender, mobile, email, license, address, tempPassword } = req.body;

    // Server-side validation
    if (!fullName || !age || !gender || !mobile || !email || !license || !address || !tempPassword) {
        return res.status(400).json({ message: 'Please fill out all required fields.' });
    }

    try {
        const existingDriver = await Driver.findOne({ $or: [{ email }, { mobile }, { licenseNumber: license }] });
        if (existingDriver) {
            let message = 'A driver with this information already exists.';
            if (existingDriver.email === email) message = 'This email is already registered.';
            if (existingDriver.mobile === mobile) message = 'This mobile number is already registered.';
            if (existingDriver.licenseNumber === license) message = 'This license number is already registered.';
            return res.status(409).json({ message }); // 409 Conflict
        }

        const newDriver = new Driver({
            fullName,
            email,
            password: tempPassword, // Hashing is handled by the model's pre-save hook
            age,
            gender,
            mobile,
            address,
            licenseNumber: license,
            agencyId: req.session.userId, // Link driver to the logged-in agency
            // ADDED: Saving the vehicle details
        
        });

        await newDriver.save();

        // Respond with success
        res.status(201).json({ message: 'Driver registered successfully!' });

    } catch (err) {
        console.error("Error adding driver:", err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

router.post('/rejectbooking', isAuthenticated, async (req, res) => {
    try {
        const { requestId } = req.body;
        await Booking.findOneAndUpdate({ _id: requestId, agencyId: req.session.userId }, { status: 'rejected' });
        res.redirect('/manageBooking');
    } catch (err) {
        res.redirect('/manageBooking');
    }
});


router.get('/viewVehicles', isAuthenticated, async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ agencyId: req.session.userId }).sort({ createdAt: -1 });
        res.render('viewVehicles', { vehicles, error: null });
    } catch (err) {
        console.error("Error fetching vehicles:", err);
        res.render('viewVehicles', { vehicles: [], error: 'Could not fetch vehicles.' });
    }
});


module.exports = router;
