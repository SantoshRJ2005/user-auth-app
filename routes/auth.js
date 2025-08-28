const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const router = express.Router();

// --- Schemas ---
// Assuming User schema is in '../models/User'
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
    role: { type: String, default: 'driver' }
});

// Password hashing middleware for Driver schema
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
        // Instead of redirecting, which can be problematic for API calls,
        // you might consider sending a 401 Unauthorized status.
        // But for a traditional web app, redirect is fine.
        return res.redirect('/login');
    }
}

// --- GET Routes ---
router.get('/', (req, res) => res.render('login', { message: '' }));
router.get('/login', (req, res) => res.render('login', { message: '' }));
router.get('/signup', (req, res) => res.render('signup', { message: '' }));

// Renders the page to add a new driver
router.get('/addDriver', isAuthenticated, (req, res) => {
    res.render('addDriver'); 
});

// Fetches and displays the list of drivers for the logged-in agency
// **FIXED and CONSOLIDATED ROUTE**
router.get('/viewDriver', isAuthenticated, async (req, res) => {
    try {
        // Find all drivers that belong to the currently logged-in agency
        const drivers = await Driver.find({ agencyId: req.session.userId })
                                  .sort({ fullName: 1 }); // Sort alphabetically by name

        // Render the viewDriver page and pass the list of drivers to it
        res.render('viewDriver', { 
            drivers: drivers,
            error: null // Pass null for error when successful
        });

    } catch (err) {
        console.error("Error fetching drivers:", err);
        // If an error occurs, render the same page but with an error message
        res.render('viewDriver', { 
            drivers: [], // Pass an empty array to prevent template errors
            error: "Could not fetch the list of drivers. Please try again later."
        });
    }
});

// Renders the page for a user to request a booking
router.get('/booking-request', isAuthenticated, (req, res) => {
    res.render('bookingRequest', { message: '' });
});

// Fetches and displays booking requests and drivers for an agency to manage
// **FIXED AND SECURED**
router.get('/manageBooking', isAuthenticated, async (req, res) => {
    try {
        // Fetch pending bookings and the agency's drivers at the same time
        const [pendingBookings, agencyDrivers] = await Promise.all([
            Booking.find({
                agencyId: req.session.userId, // <-- CRITICAL FIX: Only fetch bookings for THIS agency
                status: 'pending'
            }).sort({ requestDate: -1 }),
            
            Driver.find({
                agencyId: req.session.userId
            }).select('fullName').sort({ fullName: 1 }) // Only get names, sort alphabetically
        ]);

        // Pass both lists to the template
        res.render('manageBooking', { 
            bookings: pendingBookings, 
            drivers: agencyDrivers,
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

// Renders the main user/agency dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', {
        name: req.session.userName,
        email: req.session.userEmail,
        age: req.session.userAge,
        role: req.session.userRole
    });
});

// Logs the user out
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            // Log the error and redirect anyway
            console.error("Session destruction error:", err);
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid'); // The default session cookie name
        res.redirect('/login');
    });
});

// --- POST Routes ---

// Handles user/agency login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { message: 'Invalid credentials.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { message: 'Invalid credentials.' });
        }
        req.session.userId = user._id;
        req.session.userName = user.name;
        req.session.userEmail = user.email;
        req.session.userAge = user.age || 'N/A';
        req.session.userRole = user.role; 
        
        if (user.role === 'agency') {
            res.redirect('/manageBooking');
        } else {
            res.redirect('/dashboard');
        }
    } catch (err) {
        console.error("Login error:", err);
        res.render('login', { message: 'Server error. Please try again.' });
    }
});

// Handles new user/agency registration
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, age, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('signup', { message: 'User with that email already exists.' });
        }
        // Password will be hashed by the User model's pre-save hook (assuming it exists like the Driver one)
        const user = new User({ name, email, password, age: Number(age) || undefined, role });
        await user.save();
        res.render('login', { message: 'Signup successful! Please log in.' });
    } catch (err) {
        console.error("Signup error:", err);
        res.render('signup', { message: 'Server error. Please try again.' });
    }
});

// Handles a user submitting a new booking request
router.post('/bookingrequest', isAuthenticated, async (req, res) => {
    try {
        const { from, to, date } = req.body;
        // Note: This assigns the booking to the *first* agency found.
        const agency = await User.findOne({ role: "agency" });
        if (!agency) {
            return res.render('bookingRequest', { message: 'Sorry, no agencies are available at the moment.' });
        }
        const newBooking = new Booking({ 
            name: req.session.userName, 
            email: req.session.userEmail, 
            from, 
            to, 
            date, 
            agencyId: agency._id 
        });
        await newBooking.save();
        res.render('bookingRequest', { message: 'Booking request submitted successfully!' });
    } catch (err) {
        console.error("Booking request error:", err);
        res.render('bookingRequest', { message: 'Error submitting booking. Please try again.' });
    }
});

// Handles an agency adding a new driver
// This route is well-written and responds with JSON, suitable for fetch/AJAX calls from the frontend.
router.post('/adddriver', isAuthenticated, async (req, res) => {
    const { fullName, age, gender, mobile, email, license, address, tempPassword } = req.body;

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
            agencyId: req.session.userId // Link driver to the logged-in agency
        });

        await newDriver.save();
        
        res.status(201).json({ message: 'Driver registered successfully!' });

    } catch (err) {
        console.error("Error adding driver:", err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// Handles an agency approving a booking
router.post('/approvebooking', isAuthenticated, async (req, res) => {
    try {
        const { requestId, driverName, fare } = req.body;
        await Booking.findOneAndUpdate(
            { _id: requestId, agencyId: req.session.userId }, 
            { status: 'approved', driverName, fare: Number(fare) }
        );
        res.redirect('/manageBooking');
    } catch (err) {
        console.error("Approve booking error:", err);
        res.redirect('/manageBooking'); // Redirect even on error to avoid hanging
    }
});

// Handles an agency rejecting a booking
router.post('/rejectbooking', isAuthenticated, async (req, res) => {
    try {
        const { requestId } = req.body;
        await Booking.findOneAndUpdate(
            { _id: requestId, agencyId: req.session.userId }, 
            { status: 'rejected' }
        );
        res.redirect('/manageBooking');
    } catch (err) {
        console.error("Reject booking error:", err);
        res.redirect('/manageBooking');
    }
});

module.exports = router;