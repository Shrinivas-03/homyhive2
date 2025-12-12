const Notification = require("../models/notification");

// Get user notifications
module.exports.getUserNotifications = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const limit = parseInt(req.query.limit) || 10;
        const notifications = await Notification.getUserNotifications(req.user._id, limit);
        
        res.json({
            notifications: notifications.map(notification => ({
                id: notification._id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                isRead: notification.isRead,
                priority: notification.priority,
                actionUrl: notification.actionUrl,
                formattedDate: notification.formattedDate,
                createdAt: notification.createdAt,
                metadata: notification.metadata
            })),
            success: true
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// Get unread notification count
module.exports.getUnreadCount = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ count: 0 });
        }
        
        const count = await Notification.getUnreadCount(req.user._id);
        res.json({ count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ count: 0 });
    }
};

// Mark notifications as read
module.exports.markAsRead = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const { notificationIds } = req.body;
        
        if (!notificationIds || !Array.isArray(notificationIds)) {
            return res.status(400).json({ error: 'Invalid notification IDs' });
        }
        
        await Notification.markAsRead(req.user._id, notificationIds);
        
        res.json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
};

// Mark all notifications as read
module.exports.markAllAsRead = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { isRead: true }
        );
        
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
};

// Create a notification (for testing or admin use)
module.exports.createNotification = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const { type, title, message, priority, actionUrl, metadata } = req.body;
        
        if (!type || !title || !message) {
            return res.status(400).json({ error: 'Type, title, and message are required' });
        }
        
        const notification = await Notification.createNotification(
            req.user._id,
            type,
            title,
            message,
            { priority, actionUrl, metadata }
        );
        
        res.json({ 
            success: true, 
            notification: {
                id: notification._id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                priority: notification.priority,
                formattedDate: notification.formattedDate
            }
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
};