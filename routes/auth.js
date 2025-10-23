const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { put } = require('@vercel/blob');
const router = express.Router();

// --- Models ---
const Agencies = require('../models/Agencies');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');

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
router.get('/register-agency', (req, res) => res.render('agencySignup'));

router.get('/addDriver', isAuthenticated, async (req, res) => {
    try {
        const availableVehicles = await Vehicle.find({
            agencyId: req.session.AgenciesId,
            assignedDriver: null
        }).sort({ vehicle_name: 1 });
        res.render('addDriver', { vehicles: availableVehicles });
    } catch (err) {
        console.error("Error fetching available vehicles:", err);
        res.render('addDriver', { vehicles: [] });
    }
});

router.get('/viewDriver', isAuthenticated, async (req, res) => {
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
        console.error("Error fetching drivers:", err);
        res.render('viewDriver', {
            drivers: [],
            availableVehicles: [],
            error: "Could not fetch the driver list. Please try again."
        });
    }
});

router.get('/addVehicles', isAuthenticated, (req, res) => res.render('addVehicles'));

router.get('/viewVehicles', isAuthenticated, async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ agencyId: req.session.AgenciesId }).sort({ createdAt: -1 });
        res.render('viewVehicles', { vehicles, error: null });
    } catch (err) {
        console.error("Error fetching vehicles:", err);
        res.render('viewVehicles', { vehicles: [], error: 'Could not fetch vehicles.' });
    }
});

router.get('/manageBooking', isAuthenticated, async (req, res) => {
    try {
        const pendingBookings = await Booking.find({ status: 'pending' }).sort({ requestDate: -1 });

        const agencyDrivers = await Driver.find({
            agencyId: req.session.AgenciesId
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
        console.error("Error fetching bookings/drivers:", err);
        res.render('manageBooking', { bookings: [], drivers: [], error: "Could not fetch data." });
    }
});

router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        let user = await Agencies.findById(req.session.AgenciesId);
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
        console.error("Error fetching dashboard:", err);
        res.status(500).send("Error loading your dashboard. Please try again later.");
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.redirect('/dashboard');
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// --- POST Routes ---

router.post('/api/upload', uploadMemory.single('gumastaLicense'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    const sanitizedFilename = req.file.originalname.replace(/\s+/g, '-');
    const filename = `${Date.now()}-${sanitizedFilename}`;
    try {
        const blob = await put(filename, req.file.buffer, { access: 'public' });
        res.status(200).json(blob);
    } catch (error) {
        console.error("Error uploading to Vercel Blob:", error);
        res.status(500).json({ message: 'Error uploading file.' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await Agencies.findOne({ agencyEmail: email });
        
        if (!user) {
            user = await Driver.findOne({ email: email });
        }

        if (!user) return res.render('login', { message: 'Invalid credentials.' });

        const isMatch = await bcrypt.compare(password, user.password);
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

        // --- FIX START: More robust duplicate check ---
        // Build a query to check for duplicates only on non-empty fields
        // const orQuery = [
        //     { agencyEmail } // Email is always required and checked
        // ];
        // if (agencyMobile) orQuery.push({ agencyMobile });
        // if (gstNumber) orQuery.push({ gstNumber });
        // if (panNumber) orQuery.push({ panNumber });

        // const existingAgency = await Agencies.findOne({ $or: orQuery });
        // // --- FIX END ---

        // if (existingAgency) {
        //     return res.status(409).json({ message: 'An agency with this email, mobile, GST, or PAN already exists.' });
        // }

        const newAgency = new Agencies({
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
        console.error("Error adding driver:", err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

router.post('/editDriver', isAuthenticated, async (req, res) => {
    try {
        const { driverId, fullName, email, mobile, licenseNumber, address, assignedVehicle } = req.body;

        const originalDriver = await Driver.findById(driverId);
        
        if (!originalDriver) {
            return res.redirect('/viewDriver');
        }

        const oldVehicleId = originalDriver.assignedVehicle;

        await Driver.findByIdAndUpdate(driverId, {
            fullName, email, mobile, licenseNumber, address,
            assignedVehicle: assignedVehicle || null
        });

        if (oldVehicleId?.toString() !== assignedVehicle) {
            if (oldVehicleId) {
                await Vehicle.findByIdAndUpdate(oldVehicleId, { assignedDriver: null });
            }
            if (assignedVehicle) {
                await Vehicle.findByIdAndUpdate(assignedVehicle, { assignedDriver: driverId });
            }
        }
        res.redirect('/viewDriver');
    } catch (err) {
        console.error("Error updating driver:", err);
        res.redirect('/viewDriver');
    }
});

router.post('/deleteDriver', isAuthenticated, async (req, res) => {
    try {
        const { driverId } = req.body;

        const driverToDelete = await Driver.findById(driverId);

        if (driverToDelete) {
            if (driverToDelete.assignedVehicle) {
                await Vehicle.findByIdAndUpdate(driverToDelete.assignedVehicle, {
                    assignedDriver: null
                });
            }
            await Driver.findByIdAndDelete(driverId);
        }

        res.redirect('/viewDriver');
    } catch (err) {
        console.error("Error deleting driver:", err);
        res.redirect('/viewDriver');
    }
});


// --- FIX START: Corrected /addvehicle route ---
router.post('/addvehicle', isAuthenticated, async (req, res) => {
    const { vehicle_name, model, number_plate, rc_number, insurance_number, owner_name, ac_type, vehicle_type, max_capacity, rate_per_km } = req.body;
    

    const vehicleNumber = number_plate;

    try {
        // Check for duplicates on the field with the unique index
        if (!vehicleNumber) {
             return res.status(400).json({ message: 'Number plate is required.' });
        }

        // Check if a vehicle with this number plate already exists
        // We check 'vehicleNumber' field because that's where the unique index is
        if (await Vehicle.findOne({ number_plate: vehicleNumber })) {
            return res.status(409).json({ message: 'Vehicle with this number plate already exists.' });
        }
        
        await new Vehicle({
            vehicle_name, 
            model, 
            number_plate: vehicleNumber,    // The field from your screenshot
            vehicleNumber: vehicleNumber,  // The field from the error log's index
            rc_number, 
            insurance_number, 
            owner_name, 
            ac_type, 
            vehicle_type, 
            max_capacity, 
            rate_per_km,
            agencyId: req.session.AgenciesId
        }).save();

        res.status(201).json({ message: 'Vehicle added successfully!' });

    } catch (err) {
        console.error("Error adding vehicle:", err);
        // Handle the duplicate error gracefully
        if (err.code === 11000) {
            return res.status(409).json({ message: 'A vehicle with this number plate already exists.' });
        }
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});
// --- FIX END ---

router.post('/bookingrequest', isAuthenticated, async (req, res) => {
    try {
        const { from, to, date } = req.body;
        const agency = await Agencies.findOne({ role: "agency" });
        if (!agency) {
            return res.render('bookingRequest', { message: 'Sorry, no agencies are available.' });
        }
        await new Booking({
            name: req.session.AgenciesName,
            email: req.session.AgenciesEmail,
            from,
            to,
            date,
            agencyId: agency._id
        }).save();
        res.render('bookingRequest', { message: 'Booking request submitted successfully!' });
    } catch (err) {
        res.render('bookingRequest', { message: 'Error submitting booking. Please try again.' });
    }
});

router.post('/approvebooking', isAuthenticated, async (req, res) => {
    try {
        const { requestId, driverName, fare } = req.body;
        await Booking.findByIdAndUpdate(requestId, { status: 'approved', driverName, fare });
        res.redirect('/manageBooking');
    } catch (err) {
        res.redirect('/manageBooking');
    }
});

router.post('/rejectbooking', isAuthenticated, async (req, res) => {
    try {
        const { requestId } = req.body;
        await Booking.findByIdAndUpdate(requestId, { status: 'rejected' });
        res.redirect('/manageBooking');
    } catch (err) {
        res.redirect('/manageBooking');
    }
});

module.exports = router;
