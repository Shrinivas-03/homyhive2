# Email Setup Guide for HomyHive Contact Form

Your contact form now displays professional @homyhive.com email addresses but routes all emails to your actual Gmail address.

## 🎯 **Current Setup (Recommended)**

### **What's Configured:**
✅ **Frontend Display**: Shows professional @homyhive.com emails  
✅ **Backend Routing**: All emails sent to `murudanagashree17@gmail.com`  
✅ **Department Tracking**: Subject line shows which department  
✅ **Professional Templates**: HTML email with HomyHive branding  

### **How It Works:**
1. **User sees**: `guest-support@homyhive.com` on contact page
2. **User submits**: Contact form with their inquiry
3. **System sends**: Email to `murudanagashree17@gmail.com` with department tag
4. **You receive**: Professional email showing original department + sender details

## 📧 **Email Format You'll Receive**

```
Subject: [GUEST-SUPPORT] Help with booking
From: "John Doe via HomyHive" <murudanagashree17@gmail.com>
Reply-To: john.doe@example.com
To: murudanagashree17@gmail.com

Department: guest-support@homyhive.com
Name: John Doe
Email: john.doe@example.com
Message: I need help with my booking...
```

## 🔧 **Gmail App Password Setup**

### **Step 1: Enable 2-Factor Authentication**
1. Go to [Gmail Security Settings](https://myaccount.google.com/security)
2. Enable "2-Step Verification" if not already enabled

### **Step 2: Generate App Password**
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: "Mail"
3. Select device: "Other (custom name)"
4. Enter: "HomyHive Contact Form"
5. Click "Generate"
6. Copy the 16-character password

### **Step 3: Update .env File**
Replace:
```
GMAIL_APP_PASSWORD=nagashree@250804
```

With your actual app password:
```
GMAIL_APP_PASSWORD=your_16_character_app_password_here
```

## 🎛️ **Department Email Routing**

Your system automatically categorizes emails:

| **Contact Category** | **Department Email** | **Your Inbox Label** |
|---------------------|---------------------|----------------------|
| General inquiries | guest-support@homyhive.com | [GUEST-SUPPORT] |
| Booking help | guest-support@homyhive.com | [GUEST-SUPPORT] |
| Payment issues | payments@homyhive.com | [PAYMENTS] |
| Hosting questions | host-support@homyhive.com | [HOST-SUPPORT] |
| Partnerships | partnerships@homyhive.com | [PARTNERSHIPS] |
| Press inquiries | press@homyhive.com | [PRESS] |
| Safety concerns | trust-safety@homyhive.com | [TRUST-SAFETY] |
| Emergency | emergency@homyhive.com | [EMERGENCY] |

## 📁 **Gmail Organization Tips**

### **Create Gmail Filters:**
1. Go to Gmail Settings > Filters and Blocked Addresses
2. Create filters for each department:

**Filter for Guest Support:**
- Has the words: `[GUEST-SUPPORT]`
- Apply label: `HomyHive - Guest Support`
- Star it: Yes

**Filter for Payments:**
- Has the words: `[PAYMENTS]`
- Apply label: `HomyHive - Payments`
- Mark as important: Yes

**Filter for Emergency:**
- Has the words: `[EMERGENCY]`
- Apply label: `HomyHive - URGENT`
- Mark as important: Yes
- Forward to: (optional mobile email)

### **Gmail Labels Structure:**
```
📧 HomyHive
  ├── 👥 Guest Support
  ├── 💳 Payments
  ├── 🏠 Host Support
  ├── 🤝 Partnerships
  ├── 📰 Press
  ├── 🛡️ Safety
  └── 🚨 Emergency
```

## 🚀 **Advanced Options (Optional)**

### **Option 1: Professional Email Service**
If you want real @homyhive.com emails:
1. **Buy homyhive.com domain** (₹800-2000/year)
2. **Set up Google Workspace** (₹125/month per user)
3. **Create actual email addresses**
4. **Update sendMail.js** to use real addresses

### **Option 2: Email Forwarding Service**
Use services like:
- **Cloudflare Email Routing** (Free with domain)
- **ImprovMX** (Free forwarding)
- **ForwardEmail** (Free tier available)

### **Option 3: Multiple Gmail Addresses**
Create multiple Gmail addresses:
- `homyhive.guest@gmail.com`
- `homyhive.host@gmail.com`
- `homyhive.payments@gmail.com`

## 🔍 **Testing Your Setup**

### **Test Contact Form:**
1. Go to: `http://localhost:3000/contact`
2. Fill out form with test data
3. Check your Gmail for the formatted email
4. Verify department tagging works

### **Test Different Categories:**
- Try each contact category
- Check subject line formatting
- Verify all details are captured

## 📱 **Mobile Email Management**

### **Gmail App Setup:**
1. Install Gmail app
2. Enable notifications for HomyHive labels
3. Set priority for emergency emails
4. Use quick reply templates

### **Professional Reply Templates:**
```
Template 1 - Acknowledgment:
"Thank you for contacting HomyHive. We've received your inquiry and will respond within 24 hours."

Template 2 - More Info Needed:
"Thank you for reaching out. To better assist you, could you please provide..."

Template 3 - Issue Resolved:
"Thank you for contacting HomyHive. Your issue has been resolved. If you need further assistance..."
```

## ✅ **Current Status**

🟢 **Working Now**: Contact form routes to your Gmail  
🟢 **Professional Display**: Users see @homyhive.com addresses  
🟢 **Department Tracking**: Subject lines show departments  
🟢 **Easy Replies**: Reply-To field set to sender  
🟢 **Rich Formatting**: HTML emails with branding  

Your email system is now professional and functional without needing to purchase a domain or set up complex email hosting!