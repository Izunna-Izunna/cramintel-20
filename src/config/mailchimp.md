
# Mailchimp Configuration

To use Mailchimp integration, you need to set up the following environment variables in your hosting platform (Vercel, Netlify, etc.) or create a `.env.local` file for local development:

## Required Environment Variables

```
VITE_MAILCHIMP_API_KEY=your_mailchimp_api_key_here
VITE_MAILCHIMP_SERVER_PREFIX=us1  # Replace with your server prefix (us1, us2, etc.)
VITE_MAILCHIMP_AUDIENCE_ID=your_audience_list_id_here
```

## How to Get These Values

### 1. Mailchimp API Key
1. Log in to your Mailchimp account
2. Go to Account → Extras → API keys
3. Create a new API key or use an existing one

### 2. Server Prefix
- Found in your Mailchimp API key or in the URL when you're logged into Mailchimp
- Example: if your Mailchimp URL is `https://us1.admin.mailchimp.com/`, your prefix is `us1`

### 3. Audience ID
1. Go to Audience → All contacts
2. Click on "Settings" → "Audience name and defaults"
3. The Audience ID is shown at the bottom of the page

## Features Implemented

- ✅ Newsletter subscription from footer
- ✅ Contact form integration with automatic list addition
- ✅ Source tracking (footer vs contact form)
- ✅ Tag-based segmentation
- ✅ Duplicate email handling
- ✅ Error handling and user feedback

## Next Steps

1. Set up your Mailchimp account and audience
2. Configure the environment variables
3. Test the integration
4. Set up automated email campaigns in Mailchimp
5. Create audience segments for targeted campaigns
