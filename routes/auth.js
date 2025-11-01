const express = require('express');
const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs'); // Removed
const multer = require('multer');
const path = require('path');
const { put } = require('@vercel/blob');
const router = express.Router();
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require("fs");

require("dotenv").config();

// --- Models ---
const Agency = require('../models/Agencies'); // This path is correct
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const OTP = require('../models/OTP');

// --- FIX: Corrected path to be in the same folder ---
const { mumbaiNetworkData } = require('../models/mumbaiAPI.js');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
        user: process.env.USER,
        pass: process.env.PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    debug: true,
    logger: true
});


// Verify email configuration on startup
transporter.verify(function (error, success) {
    if (error) {
        console.log('❌ Email transporter verification failed:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

// --- Multer Configuration ---
const storageMemory = multer.memoryStorage();
const uploadMemory = multer({ storage: storageMemory });

// --- Middleware ---
function isAuthenticated(req, res, next) {
    if (req.session && req.session.AgenciesId) {
        return next();
    }
    return res.redirect('/login');
}

// --- GET Routes ---
router.get('/', (req, res) => res.render('login', { message: '' }));
router.get('/login', (req, res) => res.render('login', { message: '' }));
router.get('/signup', (req, res) => res.render('signup', { message: '' }));
router.get('/booking-request', isAuthenticated, (req, res) => res.render('bookingRequest', { message: '' }));

// --- UPDATED /register-agency Route ---
router.get('/register-agency', (req, res) => {
    try {
        // 1. Extract all station names from the API data
        const allStations = mumbaiNetworkData.routes.flatMap(route => 
            route.stations.map(station => station.station_name)
        );
        
        // 2. Get unique, sorted station names
        const uniqueStations = [...new Set(allStations)].sort();

        // 3. Render the page, passing the stations array
        res.render('agencySignup', { 
            stations: uniqueStations, // Pass the station list
            message: '' // Pass an empty message
        });
    } catch (err) {
        console.error("Error processing station data:", err);
        res.render('agencySignup', { 
            stations: [], // Pass an empty array on error
            message: 'Could not load station data.' 
        });
    }
});

router.get('/approvedRides', isAuthenticated, async (req, res) => {
    // ... (rest of your route)
    try {
        if (!req.session.AgenciesId) {
            return res.render('approvedRides', {
                approvedList: [],
                error: "Could not find your agency ID. Please log in again."
            });
        }
        const approvideAllRides = await Booking.find({
            agencyId: req.session.AgenciesId ,
            status: { $in: ['approved', 'ongoing', 'completed'] }
        });
        res.render('approvedRides', {
            approvedList: approvideAllRides,
            error: null
        });
    } catch (err) {
        res.render('approvedRides', {
            approvedList: [],
            error: "An error occurred while fetching rides." 
        });
    }
});

router.get('/addDriver', isAuthenticated, async (req, res) => {
    // ... (rest of your route)
    try {
        const availableVehicles = await Vehicle.find({
            agencyId: req.session.AgenciesId,
            assignedDriver: null
        }).sort({ vehicle_name: 1 });
        res.render('addDriver', { vehicles: availableVehicles });
    } catch (err) {
        res.render('addDriver', { vehicles: [] });
    }
});

router.get('/viewDriver', isAuthenticated, async (req, res) => {
    // ... (rest of your route)
    try {
        const agencyDrivers = await Driver.find({
            agencyId: req.session.AgenciesId
        })
        .populate('assignedVehicle')
        .sort({ fullName: 1 });

        const availableVehicles = await Vehicle.find({
            agencyId: req.session.AgenciesId,
            assignedDriver: null
        });

        res.render('viewDriver', {
            drivers: agencyDrivers,
            availableVehicles: availableVehicles,
            error: null
        });
    } catch (err) {
        res.render('viewDriver', {
            drivers: [],
            availableVehicles: [],
            error: "Could not fetch the driver list. Please try again."
        });
    }
});

router.get('/addVehicles', isAuthenticated, (req, res) => res.render('addVehicles'));

router.get('/viewVehicles', isAuthenticated, async (req, res) => {
    // ... (rest of your route)
    try {
        const vehicles = await Vehicle.find({ agencyId: req.session.AgenciesId }).sort({ createdAt: -1 });
        res.render('viewVehicles', { vehicles, error: null });
    } catch (err) {
        res.render('viewVehicles', { vehicles: [], error: 'Could not fetch vehicles.' });
    }
});

router.get('/manageBooking', isAuthenticated, async (req, res) => {
    // ... (rest of your route)
    try {
        const agencyId = req.session.AgenciesId;
        const pendingBookings = await Booking.find({ 
            status: 'pending', 
            agencyId: agencyId 
        })
        .populate('vehicleId', 'vehicle_name number_plate') 
        .sort({ requestDate: -1 });

        const vehicleIds = pendingBookings
            .map(booking => booking.vehicleId._id)
            .filter((value, index, self) => self.indexOf(value) === index);

        const agencyDrivers = await Driver.find({
            assignedVehicle: { $in: vehicleIds }, 
        })
        .select('fullName assignedVehicle')
        .populate('assignedVehicle', 'vehicle_name number_plate') 
        .sort({ fullName: 1 });

        res.render('manageBooking', {
            bookings: pendingBookings,
            drivers: agencyDrivers, 
            error: null
        });
    } catch (err) {
        res.render('manageBooking', { bookings: [], drivers: [], error: "Could not fetch data." });
    }
});

router.get('/dashboard', isAuthenticated, async (req, res) => {
    // ... (rest of your route)
    try {
        let user = await Agency.findById(req.session.AgenciesId);
        if (!user) {
            user = await Driver.findById(req.session.AgenciesId);
        }
        if (!user) {
            return res.redirect('/login');
        }
        if (user.role === 'agency') {
            res.render('dashboard', { agency: user });
        } else if (user.role === 'driver') {
            res.send(`Welcome Driver ${user.fullName}`);
        } else {
            res.send(`Welcome User ${user.name}`);
        }
    } catch (err) {
        res.status(500).send("Error loading your dashboard. Please try again later.");
    }
});

router.get('/logout', (req, res) => {
    // ... (rest of your route)
    req.session.destroy(err => {
        if (err) return res.redirect('/dashboard');
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// --- POST Routes ---

router.post('/api/upload', uploadMemory.single('gumastaLicense'), async (req, res) => {
    // ... (rest of your route)
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    const sanitizedFilename = req.file.originalname.replace(/\s+/g, '-');
    const filename = `${Date.now()}-${sanitizedFilename}`;
    try {
        const blob = await put(filename, req.file.buffer, { access: 'public' });
        res.status(200).json(blob);
    } catch (error) {
        res.status(500).json({ message: 'Error uploading file.' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await Agency.findOne({ agencyEmail: email });

        if (!user) {
            user = await Driver.findOne({ email: email });
        }

        if (!user) return res.render('login', { message: 'Invalid credentials.' });

        // --- PASSWORD FIX: Plain text comparison ---
        const isMatch = (password === user.password);
        
        if (!isMatch) return res.render('login', { message: 'Invalid credentials.' });

        req.session.AgenciesId = user._id;
        req.session.AgenciesName = user.agencyName || user.fullName;
        req.session.AgenciesEmail = user.agencyEmail || user.email;
        req.session.AgenciesRole = user.role;

        if (user.role === 'agency') {
            res.redirect('/manageBooking');
        } else if (user.role === 'driver') {
            res.redirect('/dashboard');
        } else {
            res.redirect('/dashboard');
        }
    } catch (err) {
        res.render('login', { message: 'Server error. Please try again.' });
    }
});

router.post('/register-agency', uploadMemory.single('gumastaLicense'), async (req, res) => {
    // ... (rest of your route)
    try {
        const {
            agencyName, ownerName, oprateStation, agencyEmail, agencyMobile,
            agencyLicense, gstNumber, panNumber, password,
            gumastaLicenseUrl
        } = req.body;

        let finalBlobUrl = gumastaLicenseUrl;

        if (req.file) {
             const sanitizedFilename = req.file.originalname.replace(/\s+/g, '-');
             const filename = `gumasta-${Date.now()}-${sanitizedFilename}`;
             const blob = await put(filename, req.file.buffer, { access: 'public' });
             finalBlobUrl = blob.url;
        }

        if (!finalBlobUrl) {
            return res.status(400).json({ message: 'Gumasta License file is required.' });
        }

        const newAgency = new Agency({
            agencyEmail,
            password,
            agencyName,
            ownerName,
            oprateStation,
            agencyMobile,
            agencyLicense,
            gstNumber,
            panNumber,
            gumastaLicenseUrl: finalBlobUrl
        });

        await newAgency.save();
        res.status(201).json({ message: 'Agency registered successfully! You can now log in.' });

    } catch (err) {
        console.error("Error registering agency:", err);
        if (err.code === 11000) {
             return res.status(409).json({ message: 'An agency with this email, mobile, GST, or PAN already exists.' });
        }
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

router.post('/adddriver', isAuthenticated, async (req, res) => {
    // ... (rest of your route)
    const { fullName, age, gender, mobile, email, license, address, tempPassword, assignedVehicle } = req.body;
    try {
        if (await Driver.findOne({
            $or: [{ email }, { mobile }, { licenseNumber: license }]
        })) {
            return res.status(409).json({ message: 'A driver with this email, mobile, or license already exists.' });
        }

        const newDriver = new Driver({
            fullName,
            email,
            password: tempPassword,
            age,
            gender,
            mobile,
            address,
            licenseNumber: license,
            agencyId: req.session.AgenciesId,
            assignedVehicle: assignedVehicle || null
        });

        await newDriver.save();

        if (assignedVehicle) {
            await Vehicle.findByIdAndUpdate(assignedVehicle, { assignedDriver: newDriver._id });
        }
        res.status(201).json({ message: 'Driver registered successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

router.post('/editDriver', isAuthenticated, async (req, res) => {
    // ... (rest of your route)
    try {
        const { driverID, fullName, email, mobile, licenseNumber, address, assignedVehicle } = req.body;
        const originalDriver = await Driver.findById(driverID);
        if (!originalDriver) {
            return res.redirect('/viewDriver');
        }
        const oldVehicleId = originalDriver.assignedVehicle;
        await Driver.findByIdAndUpdate(driverID, {
            fullName, email, mobile, licenseNumber, address,
            assignedVehicle: assignedVehicle || null
        });
        if (oldVehicleId?.toString() !== assignedVehicle) {
            if (oldVehicleId) {
                await Vehicle.findByIdAndUpdate(oldVehicleId, { assignedDriver: null });
            }
            if (assignedVehicle) {
                await Vehicle.findByIdAndUpdate(assignedVehicle, { assignedDriver: driverID });
            }
        }
        res.redirect('/viewDriver');
    } catch (err) {
        res.redirect('/viewDriver');
    }
});

router.post('/deleteDriver', isAuthenticated, async (req, res) => {
    // ... (rest of your route)
    try {
        const { driverID } = req.body;
        const driverToDelete = await Driver.findById(driverID);
        if (driverToDelete) {
            if (driverToDelete.assignedVehicle) {
                await Vehicle.findByIdAndUpdate(driverToDelete.assignedVehicle, {
                    assignedDriver: null
                });
            }
            await Driver.findByIdAndDelete(driverID);
        }
        res.redirect('/viewDriver');
    } catch (err) {
        res.redirect('/viewDriver');
    }
});

router.post('/addvehicle', isAuthenticated, async (req, res) => {
    // ... (rest of your route)
    const { vehicle_name, model, number_plate, rc_number, insurance_number, owner_name, ac_type, vehicle_type, max_capacity, rate_per_km } = req.body;
    const vehicleNumber = number_plate;
    try {
        if (!vehicleNumber) {
             return res.status(400).json({ message: 'Number plate is required.' });
        }
        if (await Vehicle.findOne({ number_plate: vehicleNumber })) {
            return res.status(409).json({ message: 'Vehicle with this number plate already exists.' });
        }
        await new Vehicle({
            vehicle_name, model, 
            number_plate: vehicleNumber,
            vehicleNumber: vehicleNumber,
            rc_number, insurance_number, owner_name, ac_type, 
            vehicle_type, max_capacity, rate_per_km,
            agencyId: req.session.AgenciesId
        }).save();
        res.status(201).json({ message: 'Vehicle added successfully!' });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'A vehicle with this number plate already exists.' });
        }
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

router.post('/bookingrequest', isAuthenticated, async (req, res) => {
    // ... (rest of your route)
    try {
        const { from, to, date } = req.body;
        const agency = await Agency.findOne({ role: "agency" });
        if (!agency) {
            return res.render('bookingRequest', { message: 'Sorry, no agencies are available.' });
        }
        await new Booking({
            name: req.session.AgenciesName,
            email: req.session.AgenciesEmail,
            from, to, date,
            agencyId: agency._id
        }).save();
        res.render('bookingRequest', { message: 'Booking request submitted successfully!' });
    } catch (err) {
        res.render('bookingRequest', { message: 'Error submitting booking. Please try again.' });
    }
});

router.post('/approvebooking', isAuthenticated, async (req, res) => {
    // ... (rest of your route)
    try {
        const { requestId, driverID, fare } = req.body;
        if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
            return res.redirect('/manageBooking');
        }
        if (!driverID || !mongoose.Types.ObjectId.isValid(driverID)) {
            return res.redirect('/manageBooking');
        }
        const booking = await Booking.findById(requestId);
        if (!booking) {
            return res.redirect('/manageBooking');
        }
        const assignedDriver = await Driver.findById(driverID);
        const driverName = assignedDriver ? assignedDriver.fullName : 'N/A';
        await Booking.findByIdAndUpdate(requestId, { 
            status: 'approved',
            assigneddriverID: driverID,
            fare: fare 
        });
        await transporter.sendMail({
            from: process.env.USER || 'sharingyatra@gmail.com',
            to: booking.customerEmail, 
            subject: 'Confirmation: Your Sharing Yatra Ride is Approved', 
            html: `... (your email HTML) ...` // Email HTML omitted for brevity
        });
        res.redirect('/manageBooking');
    } catch (err) {
        res.redirect('/manageBooking'); 
    }
});

router.post('/rejectbooking', isAuthenticated, async (req, res) => {
    // ... (rest of your route)
    try {
        const { requestId } = req.body;
        await Booking.findByIdAndUpdate(requestId, { status: 'rejected' });
        res.redirect('/manageBooking');
    } catch (err) {
        res.redirect('/manageBooking');
    }
});


/**
 * Fetches and calculates earnings data for a specific agency within a date range.
 *
 * @param {string} agencyId - The ID of the agency.
 * @param {string} startDate - The start date in "YYYY-MM-DD" format.
 * @param {string} endDate - The end date in "YYYY-MM-DD" format.
 * @returns {Promise<object>} An object containing totalEarnings and driverEarnings array.
 */
async function getEarningsData(agencyId, startDate, endDate) {
    
    // --- FIX: Create correct date range ---
    
    // 1. Create a Date object from the startDate string.
    // This correctly becomes the start of the day (e.g., "2025-11-01T00:00:00.000Z")
    const startOfDay = new Date(startDate); 

    // 2. Create a Date object from the endDate string.
    const endOfDay = new Date(endDate);

    // 3. Set the endOfDay to the *very end* of that day in UTC.
    // This ensures you include all bookings *during* the entire endDate.
    endOfDay.setUTCHours(23, 59, 59, 999);
    // --- End of Fix ---

    const completedBookings = await Booking.find({
        agencyId: agencyId,
        status: 'completed',
        date: { 
            $gte: startOfDay, // Use the new start-of-day Date object
            $lte: endOfDay    // Use the modified end-of-day Date object
        }
    });

    let totalEarnings = 0;
    const driverMap = new Map();
    
    for (const booking of completedBookings) {
        const fare = Number(booking.fare) || 0;
        totalEarnings += fare;
        
        // Your original logic below is correct.
        // It aggregates earnings by driver, but only if the
        // booking has both a driverID and a driverName.
        if (booking.driverID && booking.driverName) {
            const driverId = booking.driverID.toString();
            const driverName = booking.driverName;
            
            if (driverMap.has(driverId)) {
                driverMap.get(driverId).total += fare;
            } else {
                driverMap.set(driverId, { name: driverName, total: fare });
            }
        }
    }
    
    const driverEarnings = [];
    for (const [driverId, data] of driverMap.entries()) {
        const contribution = (totalEarnings > 0) ? (data.total / totalEarnings) * 100 : 0;
        driverEarnings.push({
            name: data.name,
            total: data.total,
            contribution: contribution.toFixed(2)
        });
    }
    
    // Sort the leaderboard from highest earner to lowest
    driverEarnings.sort((a, b) => b.total - a.total);
    
    return { totalEarnings, driverEarnings };
}

router.get('/earning', isAuthenticated, async (req, res) => {
    // ... (rest of your route)
    try {
        const todayString = new Date().toISOString().split('T')[0];
        const { totalEarnings, driverEarnings } = await getEarningsData(
            req.session.AgenciesId,
            todayString,
            todayString
        );
        res.render('earning', {
            totalEarnings,
            driverEarnings,
            startDate: todayString,
            endDate: todayString,
            error: null
        });
    } catch (err) {
        res.render('earning', {
            totalEarnings: 0,
            driverEarnings: [],
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            error: "Could not fetch earnings data. Please try again."
        });
    }
});

router.post('/earning', isAuthenticated, async (req, res) => {
    // ... (rest of your route)
    try {
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            return res.redirect('/earning');
        }
        const { totalEarnings, driverEarnings } = await getEarningsData(
            req.session.AgenciesId,
            startDate,
            endDate
        );
        res.render('earning', {
            totalEarnings,
            driverEarnings,
            startDate: startDate,
            endDate: endDate,
            error: null
        });
    } catch (err) {
        res.render('earning', {
            totalEarnings: 0,
            driverEarnings: [],
            startDate: req.body.startDate || new Date().toISOString().split('T')[0],
            endDate: req.body.endDate || new Date().toISOString().split('T')[0],
            error: "Could not fetch earnings for the selected date range."
        });
    }
});

module.exports = router;

