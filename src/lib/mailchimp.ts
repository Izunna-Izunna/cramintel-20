
// Mailchimp API configuration and utilities
const MAILCHIMP_API_KEY = import.meta.env.VITE_MAILCHIMP_API_KEY;
const MAILCHIMP_SERVER_PREFIX = import.meta.env.VITE_MAILCHIMP_SERVER_PREFIX; // e.g., 'us1', 'us2', etc.
const MAILCHIMP_AUDIENCE_ID = import.meta.env.VITE_MAILCHIMP_AUDIENCE_ID;

interface SubscribeData {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  source?: 'footer' | 'contact-form';
}

export const subscribeToMailchimp = async (data: SubscribeData): Promise<{ success: boolean; message: string }> => {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_SERVER_PREFIX || !MAILCHIMP_AUDIENCE_ID) {
    console.error('Mailchimp configuration missing. Please check environment variables.');
    return {
      success: false,
      message: 'Email service configuration error. Please try again later.'
    };
  }

  try {
    const url = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`;
    
    const memberData = {
      email_address: data.email,
      status: 'subscribed',
      merge_fields: {
        FNAME: data.firstName || '',
        LNAME: data.lastName || ''
      },
      tags: data.tags || []
    };

    // Add source tag to track where the subscription came from
    if (data.source) {
      memberData.tags.push(data.source);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(memberData)
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: 'Successfully subscribed to CramIntel updates!'
      };
    } else {
      // Handle specific Mailchimp errors
      if (result.title === 'Member Exists') {
        return {
          success: false,
          message: 'You are already subscribed to our newsletter!'
        };
      }
      
      console.error('Mailchimp API error:', result);
      return {
        success: false,
        message: result.detail || 'Failed to subscribe. Please try again later.'
      };
    }
  } catch (error) {
    console.error('Error subscribing to Mailchimp:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection and try again.'
    };
  }
};

export const addContactToMailchimp = async (contactData: {
  name: string;
  email: string;
  message: string;
}): Promise<{ success: boolean; message: string }> => {
  const [firstName, ...lastNameParts] = contactData.name.split(' ');
  const lastName = lastNameParts.join(' ');

  return subscribeToMailchimp({
    email: contactData.email,
    firstName,
    lastName,
    tags: ['contact-form', 'lead'],
    source: 'contact-form'
  });
};
