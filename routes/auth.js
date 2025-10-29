const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
const Agencies = require('../models/Agencies');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const OTP = require('../models/OTP');






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
router.get('/register-agency', (req, res) => res.render('agencySignup'));

router.get('/approvedRides', isAuthenticated, async (req, res) => {
    
    // --- DEBUGGING ---
    console.log("Session data:", req.session); 
    console.log("Querying for Agency ID:", req.session.AgenciesId); 
    // --- END DEBUGGING ---

    try {
        // Ensure the ID exists before querying
        if (!req.session.AgenciesId) {
            console.log("No Agency ID found in session.");
            return res.render('approvedRides', {
                approvedList: [],
                error: "Could not find your agency ID. Please log in again."
            });
        }

        const approvideAllRides = await Booking.find({
            agencyId: req.session.AgenciesId ,
            // --- THIS IS THE FIX ---
            status: { $in: ['approved', 'ongoing', 'completed'] } // <-- Added closing '}'
        }); // <-- This ')' should close the find() function
 
        // Log the results from the database
        console.log("Bookings found:", approvideAllRides.length);
        
        res.render('approvedRides', {
            approvedList: approvideAllRides,
            error: null
        });

    } catch (err) {
        console.log("Error For fetching", err);
        res.render('approvedRides', {
            approvedList: [],
            // A more accurate error message
            error: "An error occurred while fetching rides." 
        });
    }
});

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
        const agencyId = req.session.AgenciesId;

        // 1. Fetch pending bookings
        const pendingBookings = await Booking.find({ 
            status: 'pending', 
            agencyId: agencyId 
        })
        .populate('vehicleId', 'vehicle_name number_plate') 
        .sort({ requestDate: -1 });

        // 2. Fetch all drivers who are assigned a vehicle that belongs to this agency
        // (A driver is assigned to a vehicle, and we assume the vehicle belongs to the agency)
        // Note: The specific driver query depends on how you link driver/agency/vehicle.
        // Assuming you need drivers whose assigned vehicle IDs are present in the bookings:
        
        const vehicleIds = pendingBookings
            .map(booking => booking.vehicleId._id) // Extract unique populated vehicle IDs
            .filter((value, index, self) => self.indexOf(value) === index);

        const agencyDrivers = await Driver.find({
            // Find drivers assigned to one of the vehicles in the pending bookings
            assignedVehicle: { $in: vehicleIds }, 
        })
        .select('fullName assignedVehicle')
        // Populate assignedVehicle again, as only vehicleId was populated in bookings
        .populate('assignedVehicle', 'vehicle_name number_plate') 
        .sort({ fullName: 1 });

        res.render('manageBooking', {
            bookings: pendingBookings,
            // Pass the full driver list
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
        console.log("APPROVE BOOKING REQUEST BODY:", req.body);
        
        const { requestId, driverID, fare } = req.body;

        // 1. VALIDATE: Ensure both IDs are present and valid Mongo IDs
        if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
            console.error("Error: Invalid or missing requestId received:", requestId);
            return res.redirect('/manageBooking');
        }

        if (!driverID || !mongoose.Types.ObjectId.isValid(driverID)) {
            console.error("Error: Invalid or missing driverID received:", driverID);
            return res.redirect('/manageBooking');
        }

        // 2. FETCH BOOKING: Retrieve the booking document to get customer data
        const booking = await Booking.findById(requestId);
        
        if (!booking) {
            console.error("Error: Booking document not found for requestId:", requestId);
            return res.redirect('/manageBooking');
        }

        const assignedDriver = await Driver.findById(driverID);
        const driverName = assignedDriver ? assignedDriver.fullName : 'N/A';

        // 3. UPDATE BOOKING: Update the status, assign the driver, and save the fare
        await Booking.findByIdAndUpdate(requestId, { 
            status: 'approved',
            assignedDriverId: driverID,
            // Saving the fare passed in the request body during approval
            fare: fare 
        });

        // 4. SEND EMAIL: Use the data from the fetched 'booking' object
        await transporter.sendMail({
            from: process.env.USER || 'sharingyatra@gmail.com',
            // --- FIX: Use the actual customer email from the fetched booking object (Assuming field name is customerEmail) ---
            to: booking.customerEmail, 
            subject: 'Confirmation: Your Sharing Yatra Ride is Approved', 
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">Ride Approval Confirmation</h2>
                        <p style="margin: 5px 0 0 0;">Sharing Yatra</p>
                    </div>
                    <div style="padding: 20px;">
                        <p>Dear ${booking.customerName},</p> 
                        <p>We are pleased to confirm that your ride request has been <strong>successfully approved and assigned</strong>. Please review the details below:</p>
                        
                        <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px;">Booking Details</h3>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; width: 35%;">Origin:</td>
                            <td style="padding: 8px 0; text-align: right;">${booking.from}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Destination:</td>
                            <td style="padding: 8px 0; text-align: right;">${booking.to}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Date:</td>
                            <td style="padding: 8px 0; text-align: right;">${booking.date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Time:</td>
                            <td style="padding: 8px 0; text-align: right;">${booking.time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; font-weight: bold; border-top: 1px solid #eee;">Confirmed Fare:</td>
                            <td style="padding: 10px 0; text-align: right; color: #0056b3; font-weight: bold; border-top: 1px solid #eee;">${booking.fare}</td>
                        </tr>
                        </table>

                        <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 30px;">Driver Information</h3>
                        <p>Your assigned driver is **${driverName}**. They will contact you shortly to coordinate the pickup.</p>
                        
                        <p style="margin-top: 30px;">
                            Thank you for choosing Sharing Yatra. We look forward to providing you with a safe and pleasant journey.
                        </p>
                    </div>
                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-top: 1px solid #ddd;">
                        <p style="margin: 0; font-size: 0.9em; color: #666;">
                            The Sharing Yatra Team<br>
                            *Happy Journey*
                        </p>
                    </div>
             `
        });

        res.redirect('/manageBooking');
    } catch (err) {
        console.error("Error approving booking or sending email:", err);
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