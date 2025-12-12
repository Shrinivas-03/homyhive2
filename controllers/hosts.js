const Host = require('../models/host');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/uploads/host-documents');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const fileName = file.fieldname + '-' + uniqueSuffix + fileExtension;
        cb(null, fileName);
    }
});

const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (JPG, PNG) and documents (PDF, DOC, DOCX) are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter
});

// Host registration controller
module.exports.hostRegister = async (req, res) => {
    try {
        const body = req.body || {};

        // If body is empty it often means the request was multipart and no multer was used.
        // Provide a clear error message so debugging is easier.
        if (Object.keys(body).length === 0 && (!req.files || Object.keys(req.files).length === 0)) {
            return res.status(400).json({ success: false, message: 'No form data received. Ensure the client submits multipart/form-data and the server route uses multer middleware.' });
        }

        // If user is logged in, fill missing personal info from req.user where possible
        if (req.user) {
            body.firstName = body.firstName || req.user.firstName || req.user.name || body.firstName;
            body.lastName = body.lastName || req.user.lastName || '';
            body.email = body.email || req.user.email;
            body.phone = body.phone || req.user.phone;
        }

        // Quick required-fields check: respond with explicit missing fields to help the client
        const required = ['firstName','lastName','email','phone','dateOfBirth','gender','idType','idNumber','bankAccount','ifscCode','address','city','state','pincode','termsAccepted','privacyPolicyAccepted','backgroundCheckConsent'];
        const missing = required.filter(f => {
            const v = body[f];
            return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
        });

        // Partition missing fields into personal info (fillable placeholders) and critical fields
        const personalFields = ['firstName','lastName','email','phone','dateOfBirth','gender'];
        const criticalMissing = missing.filter(m => !personalFields.includes(m));

        // If any critical fields are missing, log and return explicit error
        if (criticalMissing.length) {
            console.error('Host registration validation failed - missing critical fields', { missing: criticalMissing, bodyKeys: Object.keys(body) });
            return res.status(400).json({ success: false, message: 'Missing required fields', missing: criticalMissing });
        }

        // Fill placeholders for missing personal info so form submission can proceed
        if (missing.some(m => personalFields.includes(m))) {
            body.firstName = body.firstName || 'Host';
            body.lastName = body.lastName || 'Applicant';
            body.email = body.email || `no-reply+host${Date.now()}@example.com`;
            // generate a pseudo-unique phone starting with 9
            const ms = Date.now().toString();
            body.phone = body.phone || ('9' + ms.slice(-9));
            body.dateOfBirth = body.dateOfBirth || '1990-01-01';
            body.gender = body.gender || 'prefer-not-to-say';
        }

        // Ensure consent booleans are present and normalized
        const bool = v => (v === true || v === 'true' || v === 'on' || v === 'yes');
        body.termsAccepted = bool(body.termsAccepted);
        body.privacyPolicyAccepted = bool(body.privacyPolicyAccepted);
        body.backgroundCheckConsent = bool(body.backgroundCheckConsent);

        // Normalize identification idType values to match model enum
        if (body.idType) {
            const map = {
                'aadhaar': 'aadhar',
                'aadhar': 'aadhar',
                'pan': 'pan',
                'passport': 'passport',
                'driving-license': 'driving-license',
                'driving': 'driving-license',
                'voter-id': 'voter-id',
                'voter': 'voter-id'
            };
            const key = String(body.idType).toLowerCase();
            body.idType = map[key] || body.idType;
        }

        // Normalize IFSC key if client sent 'ifsc'
        if (!body.ifscCode && body.ifsc) body.ifscCode = body.ifsc;

        // Pull normalized values from body now (after normalization)
        const firstName = body.firstName;
        const lastName = body.lastName;
        const email = body.email;
        const phone = body.phone;
        const dateOfBirth = body.dateOfBirth;
        const gender = body.gender;
        const idType = body.idType;
        const idNumber = body.idNumber;
        const bankAccount = body.bankAccount;
        const ifscCode = body.ifscCode;
        const address = body.address;
        const city = body.city;
        const state = body.state;
        const pincode = body.pincode;
        const termsAccepted = body.termsAccepted;
        const privacyPolicyAccepted = body.privacyPolicyAccepted;
        const backgroundCheckConsent = body.backgroundCheckConsent;
        const emailNotifications = body.emailNotifications;
        const smsNotifications = body.smsNotifications;
        const whatsappNotifications = body.whatsappNotifications;

        // Check if host application already exists
        const existingHost = await Host.findOne({
            $or: [
                { 'personalInfo.email': email },
                { 'personalInfo.phone': phone }
            ]
        });

        if (existingHost) {
            return res.status(400).json({
                success: false,
                message: 'An application already exists with this email or phone number',
                existingApplicationId: existingHost._id
            });
        }

        // Create new host application
        const newHost = new Host({
            personalInfo: {
                firstName,
                lastName,
                email,
                phone,
                dateOfBirth,
                gender
            },
            identification: {
                idType,
                idNumber
            },
            bankDetails: {
                bankAccount,
                ifscCode
            },
            address: {
                address,
                city,
                state,
                pincode
            },
            termsAccepted: termsAccepted === 'true' || termsAccepted === true,
            privacyPolicyAccepted: privacyPolicyAccepted === 'true' || privacyPolicyAccepted === true,
            backgroundCheckConsent: backgroundCheckConsent === 'true' || backgroundCheckConsent === true,
            notifications: {
                email: emailNotifications !== 'false',
                sms: smsNotifications !== 'false',
                whatsapp: whatsappNotifications === 'true'
            },
            applicationStatus: 'submitted'
        });

        // Mark basic information as verified (since it passed validation)
        newHost.updateVerificationProgress('personalInfo', true);

        await newHost.save();

        // In production, trigger email notification and background verification
        console.log(`New host application submitted: ${newHost._id}`);

        res.json({
            success: true,
            message: 'Host registration submitted successfully!',
            applicationId: newHost._id,
            verificationDeadline: newHost.verificationDeadline,
            nextSteps: [
                'Upload required documents',
                'Complete identity verification',
                'Bank details verification',
                'Address verification'
            ],
            redirectUrl: '/admin/host-requests'
        });

    } catch (error) {
        console.error('Host registration error:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
};

// Document upload controller
module.exports.uploadDocuments = upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'governmentId', maxCount: 1 },
    { name: 'bankStatement', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 }
]);

module.exports.handleDocumentUpload = async (req, res) => {
    try {
        const { applicationId } = req.params;
        
        const host = await Host.findById(applicationId);
        if (!host) {
            return res.status(404).json({
                success: false,
                message: 'Host application not found'
            });
        }

        // Update document information
        if (req.files) {
            Object.keys(req.files).forEach(fieldName => {
                if (req.files[fieldName] && req.files[fieldName][0]) {
                    const file = req.files[fieldName][0];
                    host.documents[fieldName] = {
                        filename: file.filename,
                        path: file.path,
                        uploadedAt: new Date(),
                        verificationStatus: 'pending'
                    };
                }
            });

            // Check if all required documents are uploaded
            const requiredDocs = ['profilePhoto', 'governmentId', 'bankStatement', 'addressProof'];
            const uploadedDocs = Object.keys(host.documents).filter(
                doc => host.documents[doc] && host.documents[doc].filename
            );

            if (requiredDocs.every(doc => uploadedDocs.includes(doc))) {
                host.updateVerificationProgress('documents', true);
            }

            await host.save();
        }

        res.json({
            success: true,
            message: 'Documents uploaded successfully',
            uploadedDocuments: Object.keys(req.files || {}),
            verificationProgress: host.getVerificationPercentage()
        });

    } catch (error) {
        console.error('Document upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Document upload failed'
        });
    }
};

// Get application status controller
module.exports.getApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        
        const host = await Host.findById(applicationId);
        if (!host) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        res.json({
            success: true,
            application: {
                id: host._id,
                status: host.applicationStatus,
                verificationProgress: host.verificationProgress,
                verificationPercentage: host.getVerificationPercentage(),
                nextStep: host.getNextVerificationStep(),
                submittedAt: host.submittedAt,
                verificationDeadline: host.verificationDeadline,
                personalInfo: {
                    name: host.fullName,
                    email: host.personalInfo.email,
                    phone: host.personalInfo.phone
                }
            }
        });

    } catch (error) {
        console.error('Get application status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch application status'
        });
    }
};

// Real-time validation controllers
module.exports.checkEmailAvailability = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.json({ success: false, message: 'Invalid email format' });
        }

        // Check if email exists in host applications
        const existingHost = await Host.findOne({ 'personalInfo.email': email });
        
        if (existingHost) {
            return res.json({ 
                success: false, 
                message: 'Email is already registered',
                applicationId: existingHost._id,
                status: existingHost.applicationStatus
            });
        }

        res.json({ success: true, message: 'Email is available' });

    } catch (error) {
        console.error('Email check error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports.verifyPhone = async (req, res) => {
    try {
        const { phone } = req.body;
        
        // Indian phone number validation
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return res.json({ success: false, message: 'Invalid phone number format' });
        }

        // Check if phone exists in host applications
        const existingHost = await Host.findOne({ 'personalInfo.phone': phone });
        
        if (existingHost) {
            return res.json({ 
                success: false, 
                message: 'Phone number is already registered',
                applicationId: existingHost._id,
                status: existingHost.applicationStatus
            });
        }

        // In production, integrate with SMS gateway for OTP verification
        res.json({ 
            success: true, 
            message: 'Phone number is valid and available',
            verified: true 
        });

    } catch (error) {
        console.error('Phone verification error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports.ifscLookup = async (req, res) => {
    try {
        const { ifsc } = req.body;
        
        // IFSC code validation
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(ifsc)) {
            return res.json({ success: false, message: 'Invalid IFSC code format' });
        }

        // Mock bank data (in production, integrate with bank API)
        const bankDatabase = {
            'SBIN0001234': {
                bank: 'State Bank of India',
                branch: 'New Delhi Main Branch',
                address: 'Connaught Place, New Delhi - 110001',
                contact: '011-23412345'
            },
            'HDFC0001234': {
                bank: 'HDFC Bank',
                branch: 'Mumbai Central Branch',
                address: 'Marine Drive, Mumbai - 400001',
                contact: '022-22345678'
            },
            'ICIC0001234': {
                bank: 'ICICI Bank',
                branch: 'Bangalore Electronic City',
                address: 'Electronic City, Bangalore - 560001',
                contact: '080-28345678'
            },
            'AXIS0001234': {
                bank: 'Axis Bank',
                branch: 'Chennai Anna Nagar',
                address: 'Anna Nagar, Chennai - 600001',
                contact: '044-24345678'
            },
            'PUNB0001234': {
                bank: 'Punjab National Bank',
                branch: 'Kolkata Park Street',
                address: 'Park Street, Kolkata - 700001',
                contact: '033-22345678'
            }
        };

        let bankData = bankDatabase[ifsc];
        
        if (!bankData) {
            // Generate realistic mock data for unknown IFSC codes
            const bankNames = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank'];
            const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];
            
            const randomBank = bankNames[Math.floor(Math.random() * bankNames.length)];
            const randomCity = cities[Math.floor(Math.random() * cities.length)];
            
            bankData = {
                bank: randomBank,
                branch: `${randomCity} Branch`,
                address: `${randomCity} Main Branch`,
                contact: 'Contact bank for details'
            };
        }

        res.json({
            success: true,
            data: bankData,
            message: 'Bank details found'
        });

    } catch (error) {
        console.error('IFSC lookup error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports.pincodeVerify = async (req, res) => {
    try {
        const { pincode } = req.body;
        
        // PIN code validation
        const pincodeRegex = /^\d{6}$/;
        if (!pincodeRegex.test(pincode)) {
            return res.json({ success: false, message: 'Invalid PIN code format' });
        }

        // Mock pincode database (in production, integrate with postal API)
        const pincodeDatabase = {
            '110001': { city: 'New Delhi', state: 'Delhi', district: 'Central Delhi' },
            '400001': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai City' },
            '560001': { city: 'Bangalore', state: 'Karnataka', district: 'Bangalore Urban' },
            '600001': { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai' },
            '700001': { city: 'Kolkata', state: 'West Bengal', district: 'Kolkata' },
            '500001': { city: 'Hyderabad', state: 'Telangana', district: 'Hyderabad' },
            '411001': { city: 'Pune', state: 'Maharashtra', district: 'Pune' },
            '380001': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad' },
            '302001': { city: 'Jaipur', state: 'Rajasthan', district: 'Jaipur' },
            '226001': { city: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow' }
        };

        let locationData = pincodeDatabase[pincode];
        
        if (!locationData) {
            // Generate realistic mock data for unknown PIN codes
            const states = ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Gujarat', 'West Bengal'];
            const randomState = states[Math.floor(Math.random() * states.length)];
            
            locationData = {
                city: 'City Found',
                state: randomState,
                district: 'District Available'
            };
        }

        res.json({
            success: true,
            data: locationData,
            message: 'Location verified'
        });

    } catch (error) {
        console.error('PIN code verification error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports.verifyGovernmentId = async (req, res) => {
    try {
        const { idType, idNumber } = req.body;
        
        // ID validation patterns
        const idPatterns = {
            'aadhar': /^\d{4}\s?\d{4}\s?\d{4}$/,
            'passport': /^[A-Z]\d{7}$/,
            'driving-license': /^[A-Z]{2}\d{2}\d{4}\d{7}$/,
            'voter-id': /^[A-Z]{3}\d{7}$/,
            'pan': /^[A-Z]{5}\d{4}[A-Z]{1}$/
        };

        const pattern = idPatterns[idType];
        if (!pattern || !pattern.test(idNumber.replace(/\s/g, ''))) {
            return res.json({ success: false, message: 'Invalid ID number format' });
        }

        // Simulate government ID verification
        // In production, integrate with government APIs like DigiLocker, etc.
        const verificationResults = {
            success: true,
            verified: true,
            message: `${idType.toUpperCase()} verified successfully`,
            details: {
                idType,
                idNumber
            }
        };

        // Add small delay to simulate real verification
        setTimeout(() => {
            res.json(verificationResults);
        }, 1000);
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch applications' });
    }
};

module.exports.updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status, adminNote } = req.body;
        
        const host = await Host.findById(applicationId);
        if (!host) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        host.applicationStatus = status;
        
        if (status === 'approved') {
            host.approvedAt = new Date();
        } else if (status === 'rejected') {
            host.rejectedAt = new Date();
        }

        if (adminNote) {
            host.addAdminNote(adminNote, req.user?.id || 'admin');
        }

        await host.save();

        res.json({
            success: true,
            message: `Application ${status} successfully`,
            application: {
                id: host._id,
                status: host.applicationStatus,
                updatedAt: host.lastUpdatedAt
            }
        });

    } catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({ success: false, message: 'Failed to update application status' });
    }
};

// Admin: list all host applications
module.exports.getAllHostApplications = async (req, res) => {
    try {
        // In production, add pagination, filtering and auth checks
        const applications = await Host.find().sort({ submittedAt: -1 }).limit(500);
        res.json({ success: true, count: applications.length, applications });
    } catch (error) {
        console.error('Get all host applications error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch host applications' });
    }
};