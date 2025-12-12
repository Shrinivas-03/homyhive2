const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ['booking', 'review', 'message', 'system', 'promotion'],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    isRead: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    actionUrl: {
        type: String,
        default: null
    },
    metadata: {
        listingId: {
            type: Schema.Types.ObjectId,
            ref: "Listing"
        },
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: "Booking"
        },
        reviewId: {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    }
}, {
    timestamps: true
});

// Index for efficient queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

// Virtual for formatted date
notificationSchema.virtual('formattedDate').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return this.createdAt.toLocaleDateString();
});

// Static method to create notification
notificationSchema.statics.createNotification = async function(userId, type, title, message, options = {}) {
    try {
        const notification = new this({
            user: userId,
            type,
            title,
            message,
            priority: options.priority || 'medium',
            actionUrl: options.actionUrl || null,
            metadata: options.metadata || {}
        });
        
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(userId, limit = 10) {
    try {
        return await this.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('metadata.listingId', 'title image')
            .populate('metadata.reviewId', 'rating comment');
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(userId, notificationIds) {
    try {
        await this.updateMany(
            { 
                user: userId, 
                _id: { $in: notificationIds } 
            },
            { isRead: true }
        );
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        throw error;
    }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
    try {
        return await this.countDocuments({ user: userId, isRead: false });
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
};

module.exports = mongoose.model("Notification", notificationSchema);