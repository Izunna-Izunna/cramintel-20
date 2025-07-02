
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

interface TestResult {
  apiKeyExists: boolean;
  apiKeyFormat: boolean;
  apiConnectivity: boolean;
  visionApiEnabled: boolean;
  quotaOk?: boolean;
  apiKeyValid?: boolean;
  responseStatus?: number;
  success: boolean;
}

interface TestResponse {
  success: boolean;
  testResults: TestResult;
  apiResponse?: any;
  errorType?: string;
  errorMessage?: string;
  suggestions?: string[];
  metadata?: {
    timestamp: string;
    apiKeyLength: number;
    apiKeyPreview: string;
  };
}

const GoogleVisionApiTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResponse | null>(null);
  const [showRawResponse, setShowRawResponse] = useState(false);

  const runApiTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-google-vision-api');

      if (error) {
        throw new Error(error.message);
      }

      setResult(data);
      
      if (data.success) {
        toast.success('API key test completed successfully!');
      } else {
        toast.error('API key test failed - see results below');
      }
    } catch (err) {
      console.error('Test error:', err);
      toast.error(`Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setResult({
        success: false,
        testResults: {
          apiKeyExists: false,
          apiKeyFormat: false,
          apiConnectivity: false,
          visionApiEnabled: false,
          success: false
        },
        errorMessage: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === undefined) return <AlertCircle className="w-4 h-4 text-gray-400" />;
    return status ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusColor = (status: boolean | undefined) => {
    if (status === undefined) return 'secondary';
    return status ? 'default' : 'destructive';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Google Vision API Key Test
        </h1>
        <p className="text-gray-600">
          Comprehensive testing of your Google Cloud Vision API configuration
        </p>
      </div>

      {/* Test Button */}
      <Card>
        <CardHeader>
          <CardTitle>Run API Key Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runApiTest}
            disabled={testing}
            className="w-full"
            size="lg"
          >
            {testing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Testing API Key...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Test Google Vision API Key
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {result && (
        <>
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(result.success)}
                Overall Test Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusColor(result.success)} className="text-sm">
                {result.success ? 'API Key Working Correctly' : 'API Key Issues Detected'}
              </Badge>
              {result.metadata && (
                <div className="mt-4 text-sm text-gray-600 space-y-1">
                  <p>Test completed: {new Date(result.metadata.timestamp).toLocaleString()}</p>
                  <p>API Key: {result.metadata.apiKeyPreview} (Length: {result.metadata.apiKeyLength})</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">API Key Set in Environment</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.testResults.apiKeyExists)}
                    <Badge variant={getStatusColor(result.testResults.apiKeyExists)}>
                      {result.testResults.apiKeyExists ? 'Set' : 'Missing'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">API Key Format Valid</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.testResults.apiKeyFormat)}
                    <Badge variant={getStatusColor(result.testResults.apiKeyFormat)}>
                      {result.testResults.apiKeyFormat ? 'Valid' : 'Invalid'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">API Connectivity</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.testResults.apiConnectivity)}
                    <Badge variant={getStatusColor(result.testResults.apiConnectivity)}>
                      {result.testResults.apiConnectivity ? 'Connected' : 'No Connection'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Vision API Enabled</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.testResults.visionApiEnabled)}
                    <Badge variant={getStatusColor(result.testResults.visionApiEnabled)}>
                      {result.testResults.visionApiEnabled ? 'Enabled' : 'Not Enabled'}
                    </Badge>
                  </div>
                </div>

                {result.testResults.quotaOk !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Quota Available</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.testResults.quotaOk)}
                      <Badge variant={getStatusColor(result.testResults.quotaOk)}>
                        {result.testResults.quotaOk ? 'Available' : 'Exceeded'}
                      </Badge>
                    </div>
                  </div>
                )}

                {result.testResults.responseStatus && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">HTTP Response Status</span>
                    <Badge variant={result.testResults.responseStatus === 200 ? 'default' : 'destructive'}>
                      {result.testResults.responseStatus}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error Details & Suggestions */}
          {!result.success && (result.errorMessage || result.suggestions) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  Issues & Solutions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.errorMessage && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">Error:</p>
                    <p className="text-red-700">{result.errorMessage}</p>
                  </div>
                )}

                {result.suggestions && result.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">Suggested Solutions:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {result.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="font-medium text-gray-900 mb-2">Helpful Links:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      API Keys
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://console.cloud.google.com/apis/library/vision.googleapis.com', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Enable Vision API
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://console.cloud.google.com/billing', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Billing Setup
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Raw API Response */}
          {result.apiResponse && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Raw API Response</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRawResponse(!showRawResponse)}
                  >
                    {showRawResponse ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showRawResponse ? 'Hide' : 'Show'} Details
                  </Button>
                </div>
              </CardHeader>
              {showRawResponse && (
                <CardContent>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(result.apiResponse, null, 2)}
                  </pre>
                </CardContent>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default GoogleVisionApiTest;
