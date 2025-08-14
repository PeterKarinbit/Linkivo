import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { api_url } from '../../config';

const TestConnection = () => {
  const [status, setStatus] = useState({ loading: false, message: '', success: false });
  const [pingResult, setPingResult] = useState(null);
  const [loginResult, setLoginResult] = useState(null);
  const [formData, setFormData] = useState({ email: 'test@example.com', password: 'password' });
  const [apiEndpoint, setApiEndpoint] = useState(api_url);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'apiEndpoint') {
      setApiEndpoint(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Test API ping
  const testPing = async () => {
    setStatus({ loading: true, message: 'Testing API connection...', success: false });
    setPingResult(null);

    try {
      const response = await axios.get(`${apiEndpoint}/users/ping`, { timeout: 5000 });
      setPingResult({
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers
      });
      setStatus({
        loading: false,
        message: 'API connection successful!',
        success: true
      });
    } catch (error) {
      console.error('API ping error:', error);
      setPingResult({
        success: false,
        error: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      });
      setStatus({
        loading: false,
        message: `API connection failed: ${error.message}`,
        success: false
      });
    }
  };

  // Test login
  const testLogin = async () => {
    setStatus({ loading: true, message: 'Testing login...', success: false });
    setLoginResult(null);

    try {
      const response = await axios.post(
        `${apiEndpoint}/users/login`,
        formData,
        {
          withCredentials: true,
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      setLoginResult({
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers
      });

      setStatus({
        loading: false,
        message: 'Login test successful!',
        success: true
      });
    } catch (error) {
      console.error('Login test error:', error);
      setLoginResult({
        success: false,
        error: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      });

      setStatus({
        loading: false,
        message: `Login test failed: ${error.message}`,
        success: false
      });
    }
  };

  // Run initial ping test on component mount
  useEffect(() => {
    testPing();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">API Connection Test</h1>

          {/* Status indicator */}
          {status.message && (
            <div className={`p-4 mb-6 rounded-md ${status.success ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
              {status.loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {status.message}
                </div>
              ) : (
                <div className="flex items-center">
                  {status.success ? (
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {status.message}
                </div>
              )}
            </div>
          )}

          {/* API Endpoint Configuration */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
            <div className="flex">
              <input
                type="text"
                name="apiEndpoint"
                value={apiEndpoint}
                onChange={handleInputChange}
                className="flex-grow shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
              <button
                onClick={testPing}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Test Connection
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Default: {api_url}</p>
          </div>

          {/* Login Test */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Login Test</h2>

            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <button
              onClick={testLogin}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Test Login
            </button>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ping Result */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ping Result</h3>
              {pingResult ? (
                <div className={`bg-gray-50 p-4 rounded-md overflow-auto max-h-96 ${pingResult.success ? 'border-green-200' : 'border-red-200'} border`}>
                  <pre className="text-xs">
                    {JSON.stringify(pingResult, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No results yet</p>
              )}
            </div>

            {/* Login Result */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Login Result</h3>
              {loginResult ? (
                <div className={`bg-gray-50 p-4 rounded-md overflow-auto max-h-96 ${loginResult.success ? 'border-green-200' : 'border-red-200'} border`}>
                  <pre className="text-xs">
                    {JSON.stringify(loginResult, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No results yet</p>
              )}
            </div>
          </div>

          {/* Network Troubleshooting Tips */}
          <div className="mt-8 p-4 bg-blue-50 rounded-md">
            <h3 className="text-md font-medium text-blue-800 mb-2">Troubleshooting Tips</h3>
            <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
              <li>Make sure the backend server is running on the correct port (default: 3000)</li>
              <li>Check for CORS issues in the browser console</li>
              <li>Verify there are no network connectivity issues between frontend and backend</li>
              <li>Check if the backend is properly connected to the database</li>
              <li>Try using the test server script (backend/test-server.js) to isolate API issues</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestConnection;
