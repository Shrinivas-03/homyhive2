# OAuth Setup Guide for HomyHive

This guide will help you set up Google and Facebook OAuth authentication for your HomyHive application.

## Google OAuth Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Make sure billing is enabled (required for OAuth)

### Step 2: Enable Google+ API
1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Also enable "People API" for better profile access

### Step 3: Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure OAuth consent screen first if prompted:
   - User Type: External
   - App name: HomyHive
   - User support email: your email
   - Developer contact: your email
4. Application type: Web application
5. Name: HomyHive Web Client
6. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://yourdomain.com` (for production)
7. Authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - `https://yourdomain.com/auth/google/callback` (for production)

### Step 4: Get Your Credentials
1. Copy the Client ID and Client Secret
2. Add them to your `.env` file:
```
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

## Facebook OAuth Setup

### Step 1: Create a Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" > "Create App"
3. Choose "Consumer" as app type
4. Fill in app details:
   - App name: HomyHive
   - Contact email: your email

### Step 2: Add Facebook Login Product
1. In your app dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Choose "Web" platform

### Step 3: Configure Facebook Login
1. Go to Facebook Login > Settings
2. Add Valid OAuth Redirect URIs:
   - `http://localhost:3000/auth/facebook/callback`
   - `https://yourdomain.com/auth/facebook/callback` (for production)

### Step 4: Get Your Credentials
1. Go to Settings > Basic
2. Copy App ID and App Secret
3. Add them to your `.env` file:
```
FACEBOOK_APP_ID=your_actual_app_id_here
FACEBOOK_APP_SECRET=your_actual_app_secret_here
```

## Testing OAuth Integration

### Test Google OAuth:
1. Start your application: `node app.js`
2. Go to `http://localhost:3000/signup`
3. Click "Continue with Google"
4. You should be redirected to Google's login page

### Test Facebook OAuth:
1. On the same signup page
2. Click "Continue with Facebook"
3. You should be redirected to Facebook's login page

## Troubleshooting

### Common Issues:
1. **Redirect URI mismatch**: Make sure the callback URLs in your OAuth apps match exactly with your routes
2. **Invalid client error**: Double-check your Client ID and Client Secret in `.env`
3. **Scope errors**: Make sure you've enabled the required APIs in Google Cloud Console
4. **Email not provided**: Some users might not have public emails - the app handles this gracefully

### Production Considerations:
1. Update redirect URIs to use your production domain
2. Set up proper error handling for OAuth failures
3. Consider implementing email verification for OAuth users
4. Add proper logging for OAuth events

## Features Implemented

✅ **Google OAuth Integration**
- Email-based user identification
- Automatic account linking if email exists
- Profile information extraction

✅ **Facebook OAuth Integration**  
- Email-based user identification (when available)
- Automatic account linking
- Profile information extraction

✅ **Email Support**
- All OAuth strategies prioritize email for user identification
- Existing users can link multiple OAuth providers
- New users are created with email as primary identifier

✅ **UI Integration**
- Functional OAuth buttons on signup page
- Proper OAuth buttons on login page
- Consistent styling with your Airbnb-like design

## Next Steps
1. Set up your Google and Facebook OAuth credentials
2. Test the authentication flow
3. Consider adding more OAuth providers (GitHub, Twitter, etc.)
4. Implement profile management for OAuth users