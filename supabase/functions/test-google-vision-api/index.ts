
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    
    // Test 1: Check if API key is set
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'GOOGLE_CLOUD_VISION_API_KEY environment variable is not set',
          testResults: {
            apiKeyExists: false,
            apiKeyFormat: false,
            apiConnectivity: false,
            visionApiEnabled: false
          }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Test 2: Check API key format (should be 39 characters, alphanumeric + hyphens)
    const apiKeyFormatValid = /^[A-Za-z0-9_-]{35,45}$/.test(apiKey);
    
    // Test 3: Simple test image (1x1 pixel white PNG in base64)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    // Test 4: Make actual API call
    console.log('Testing Google Vision API with test image...');
    const visionRequest = {
      requests: [{
        image: {
          content: testImageBase64
        },
        features: [{
          type: 'TEXT_DETECTION',
          maxResults: 1
        }]
      }]
    };

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visionRequest)
      }
    );

    const responseText = await response.text();
    let visionResponse;
    
    try {
      visionResponse = JSON.parse(responseText);
    } catch {
      visionResponse = { error: 'Invalid JSON response', rawResponse: responseText };
    }

    console.log('Vision API Response Status:', response.status);
    console.log('Vision API Response:', visionResponse);

    // Analyze response
    const testResults = {
      apiKeyExists: true,
      apiKeyFormat: apiKeyFormatValid,
      apiConnectivity: response.status !== 0,
      visionApiEnabled: response.status !== 403,
      quotaOk: response.status !== 429,
      apiKeyValid: response.status !== 400,
      responseStatus: response.status,
      success: response.ok && !visionResponse.error
    };

    // Determine specific error type
    let errorType = null;
    let errorMessage = null;
    let suggestions = [];

    if (response.status === 400) {
      errorType = 'INVALID_API_KEY';
      errorMessage = 'API key is invalid or malformed';
      suggestions = [
        'Check if your API key is correctly copied from Google Cloud Console',
        'Ensure there are no extra spaces or characters in the API key',
        'Verify the API key has the correct permissions'
      ];
    } else if (response.status === 403) {
      errorType = 'API_NOT_ENABLED';
      errorMessage = 'Google Cloud Vision API is not enabled for this project';
      suggestions = [
        'Enable the Cloud Vision API in Google Cloud Console',
        'Go to APIs & Services > Library and search for "Cloud Vision API"',
        'Make sure billing is enabled for your Google Cloud project'
      ];
    } else if (response.status === 429) {
      errorType = 'QUOTA_EXCEEDED';
      errorMessage = 'API quota exceeded or rate limit hit';
      suggestions = [
        'Check your Google Cloud Console for quota limits',
        'Wait a few minutes and try again',
        'Consider upgrading your Google Cloud plan'
      ];
    } else if (!response.ok) {
      errorType = 'UNKNOWN_ERROR';
      errorMessage = `HTTP ${response.status}: ${responseText}`;
      suggestions = [
        'Check Google Cloud Console for any service issues',
        'Verify your internet connection',
        'Try again in a few minutes'
      ];
    }

    return new Response(
      JSON.stringify({
        success: response.ok && !visionResponse.error,
        testResults,
        apiResponse: visionResponse,
        errorType,
        errorMessage,
        suggestions,
        metadata: {
          timestamp: new Date().toISOString(),
          apiKeyLength: apiKey.length,
          apiKeyPreview: `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in test-google-vision-api function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error',
        testResults: {
          apiKeyExists: false,
          apiKeyFormat: false,
          apiConnectivity: false,
          visionApiEnabled: false
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
