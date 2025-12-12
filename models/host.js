const mongoose = require("mongoose");

const hostSchema = new mongoose.Schema({
    // Personal Information
    personalInfo: {
        firstName: {
            type: String,
            required: true,
            trim: true,
            minLength: 2,
            maxLength: 50
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
            minLength: 2,
            maxLength: 50
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
        },
        phone: {
            type: String,
            required: true,
            unique: true,
            match: [/^[6-9]\d{9}$/, 'Invalid phone number format']
        },
        dateOfBirth: {
            type: Date,
            required: true,
            validate: {
                validator: function(date) {
                    const today = new Date();
                    let age = today.getFullYear() - date.getFullYear();
                    if (today.getMonth() < date.getMonth() ||
                        (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())) {
                        age--;
                    }
                    return age >= 18 && age <= 100;
                },
                message: 'Age must be between 18 and 100 years'
            }
        },
        gender: {
            type: String,
            required: true,
            enum: ['male', 'female', 'other', 'prefer-not-to-say']
        }
    },

    // Government ID Information
    identification: {
        idType: {
            type: String,
            required: true,
            enum: ['aadhar', 'passport', 'driving-license', 'voter-id', 'pan']
        },
        idNumber: {
            type: String,
            required: true,
            validate: {
                validator: function(idNumber) {
                    const idPatterns = {
                        'aadhar': /^\d{4}\s?\d{4}\s?\d{4}$/,
                        'passport': /^[A-Z]\d{7}$/,
                        'driving-license': /^[A-Z]{2}\d{2}\d{4}\d{7}$/,
                        'voter-id': /^[A-Z]{3}\d{7}$/,
                        'pan': /^[A-Z]{5}\d{4}[A-Z]{1}$/
                    };
                    return idPatterns[this.identification.idType] &&
                           idPatterns[this.identification.idType].test(idNumber.replace(/\s/g, ''));
                },
                message: 'Invalid ID number format for selected ID type'
            }
        },
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        },
        verifiedAt: Date,
        verificationNotes: String
    },

    // Bank Details
    bankDetails: {
        bankAccount: {
            type: String,
            required: true,
            match: [/^\d{9,18}$/, 'Invalid bank account number']
        },
        ifscCode: {
            type: String,
            required: true,
            uppercase: true,
            match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code']
        },
        bankName: String,
        branchName: String,
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        },
        verifiedAt: Date
    },

    // Address Information
    address: {
        address: {
            type: String,
            required: true,
            trim: true,
            minLength: 10,
            maxLength: 200
        },
        city: {
            type: String,
            required: true,
            trim: true,
            minLength: 2,
            maxLength: 50
        },
        state: {
            type: String,
            required: true,
            trim: true,
            minLength: 2,
            maxLength: 50
        },
        pincode: {
            type: String,
            required: true,
            match: [/^\d{6}$/, 'Invalid PIN code']
        },
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        }
    },

    // Document Uploads
    documents: {
        profilePhoto: {
            filename: String,
            path: String,
            uploadedAt: Date,
            verificationStatus: {
                type: String,
                enum: ['pending', 'verified', 'rejected'],
                default: 'pending'
            }
        },
        governmentId: {
            filename: String,
            path: String,
            uploadedAt: Date,
            verificationStatus: {
                type: String,
                enum: ['pending', 'verified', 'rejected'],
                default: 'pending'
            }
        },
        bankStatement: {
            filename: String,
            path: String,
            uploadedAt: Date,
            verificationStatus: {
                type: String,
                enum: ['pending', 'verified', 'rejected'],
                default: 'pending'
            }
        },
        addressProof: {
            filename: String,
            path: String,
            uploadedAt: Date,
            verificationStatus: {
                type: String,
                enum: ['pending', 'verified', 'rejected'],
                default: 'pending'
            }
        }
    },

    // Property Media (images and video)
    propertyMedia: {
        images: [
            {
                filename: String,
                path: String,
                uploadedAt: Date
            }
        ],
        video: {
            filename: String,
            path: String,
            uploadedAt: Date
        }
    },
    // Application Status
    applicationStatus: {
        type: String,
        enum: ['draft', 'submitted', 'under_review', 'verification_pending', 'approved', 'rejected', 'suspended'],
        default: 'draft'
    },

    // Verification Progress
    verificationProgress: {
        personalInfo: { type: Boolean, default: false },
        identification: { type: Boolean, default: false },
        bankDetails: { type: Boolean, default: false },
        address: { type: Boolean, default: false },
        documents: { type: Boolean, default: false }
    },

    // Important Dates
    submittedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    lastUpdatedAt: { type: Date, default: Date.now },

    // Verification Deadline
    verificationDeadline: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from creation
        }
    },

    // Admin Notes
    adminNotes: [{
        note: String,
        addedBy: String, // Admin ID or name
        addedAt: { type: Date, default: Date.now }
    }],

    // Security and Compliance
    termsAccepted: {
        type: Boolean,
        required: true,
        validate: {
            validator: function(v) {
                return v === true;
            },
            message: 'Terms and conditions must be accepted'
        }
    },
    privacyPolicyAccepted: {
        type: Boolean,
        required: true,
        validate: {
            validator: function(v) {
                return v === true;
            },
            message: 'Privacy policy must be accepted'
        }
    },
    backgroundCheckConsent: {
        type: Boolean,
        required: true,
        validate: {
            validator: function(v) {
                return v === true;
            },
            message: 'Background check consent is required'
        }
    },

    // Communication Preferences
    notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: false }
    },

    // Reference to User model (if they become a host)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for better performance
hostSchema.index({ applicationStatus: 1 });
hostSchema.index({ submittedAt: 1 });
hostSchema.index({ verificationDeadline: 1 });

// Virtual for full name
hostSchema.virtual('fullName').get(function() {
    return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual for overall verification status
hostSchema.virtual('overallVerificationStatus').get(function() {
    const progress = this.verificationProgress;
    const totalSteps = Object.keys(progress).length;
    const completedSteps = Object.values(progress).filter(Boolean).length;

    if (completedSteps === 0) return 'not_started';
    if (completedSteps === totalSteps) return 'completed';
    return 'in_progress';
});

// Method to calculate verification percentage
hostSchema.methods.getVerificationPercentage = function() {
    const progress = this.verificationProgress;
    const totalSteps = Object.keys(progress).length;
    const completedSteps = Object.values(progress).filter(Boolean).length;
    return Math.round((completedSteps / totalSteps) * 100);
};

// Method to check if verification is complete
hostSchema.methods.isVerificationComplete = function() {
    const progress = this.verificationProgress;
    return Object.values(progress).every(Boolean);
};

// Method to get next verification step
hostSchema.methods.getNextVerificationStep = function() {
    const progress = this.verificationProgress;
    for (const [step, completed] of Object.entries(progress)) {
        if (!completed) {
            return step;
        }
    }
    return null;
};

// Method to update verification progress
hostSchema.methods.updateVerificationProgress = function(step, status = true) {
    if (this.verificationProgress.hasOwnProperty(step)) {
        this.verificationProgress[step] = status;
        this.lastUpdatedAt = new Date();

        // If all steps are complete, update application status
        if (this.isVerificationComplete() && this.applicationStatus === 'verification_pending') {
            this.applicationStatus = 'under_review';
        }
    }
};

// Method to add admin note
hostSchema.methods.addAdminNote = function(note, adminId) {
    this.adminNotes.push({
        note: note,
        addedBy: adminId,
        addedAt: new Date()
    });
};

// Static method to find applications needing review
hostSchema.statics.findPendingReview = function() {
    return this.find({
        applicationStatus: { $in: ['submitted', 'under_review', 'verification_pending'] }
    }).sort({ submittedAt: 1 });
};

// Static method to find overdue applications
hostSchema.statics.findOverdueApplications = function() {
    return this.find({
        verificationDeadline: { $lt: new Date() },
        applicationStatus: { $in: ['submitted', 'verification_pending'] }
    });
};

// Pre-save middleware to update lastUpdatedAt
hostSchema.pre('save', function(next) {
    this.lastUpdatedAt = new Date();
    next();
});

// Pre-save middleware to handle application submission
hostSchema.pre('save', function(next) {
    if (this.isModified('applicationStatus') && this.applicationStatus === 'submitted' && !this.submittedAt) {
        this.submittedAt = new Date();
    }
    next();
});

const Host = mongoose.model("Host", hostSchema);
module.exports = Host;
