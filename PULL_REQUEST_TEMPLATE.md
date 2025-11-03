This PR adds complete authentication functionality to the Passport Size Photo Maker application using Supabase.

## Changes:
- **Replaced Firebase with Supabase** authentication
- **Updated login.html**: Modern login/signup interface with toggle between forms
- **Updated index.html**: Added authentication protection and logout button in header
- **Authentication Flow**: Users must login before accessing the app, with session persistence

## Features:
✅ Email/Password authentication
✅ Create account functionality
✅ Login page as entry point
✅ Protected main page (redirects if not authenticated)
✅ Logout button in header
✅ Session persistence across page reloads
✅ Beautiful, responsive UI design

## Testing:
After merging, users will need to create an account or login to access the passport photo maker.