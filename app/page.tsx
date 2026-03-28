'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function IntakePage() {
  const router = useRouter();
  const [link, setLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorType(null);
    setDetectedType(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'An error occurred');
        setErrorType(data.errorType || null);
        setDetectedType(data.inputType);
        // For recoverable errors, preserve the link via data.preservedLink
        if (data.preservedLink && data.preservedLink !== link) {
          setLink(data.preservedLink);
        }
        setIsSubmitting(false);
        return;
      }

      // Show detected type briefly before navigation
      setDetectedType(data.inputType);
      
      // Navigate to the next route
      setTimeout(() => {
        router.push(data.nextRoute);
      }, 500);

    } catch {
      setError('Network error. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLink(e.target.value);
    // Clear error when user starts typing again
    if (error) {
      setError(null);
      setErrorType(null);
      setDetectedType(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Content Replication Workbench
        </h1>
        <p className="text-gray-600 mb-6">
          Enter a Douyin creator profile or single video link to begin
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-2">
              Douyin Link
            </label>
            <input
              id="link"
              type="text"
              value={link}
              onChange={handleChange}
              placeholder="https://www.douyin.com/user/... or https://www.douyin.com/video/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {error && (
            <div className={`${
              errorType === 'resolution-failure' 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-red-50 border-red-200'
            } border rounded-lg p-4`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {errorType === 'resolution-failure' ? (
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    errorType === 'resolution-failure' ? 'text-yellow-800' : 'text-red-800'
                  }`}>
                    {detectedType === 'unsupported' && 'Unsupported Link'}
                    {errorType === 'resolution-failure' && 'Resolution Failed'}
                    {!detectedType && !errorType && 'Error'}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    errorType === 'resolution-failure' ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {error}
                  </p>
                  {errorType === 'resolution-failure' && (
                    <p className="text-xs text-yellow-600 mt-2">
                      You can try again with the same link or enter a different one.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {detectedType && !error && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">
                    Detected: <span className="font-medium">
                      {detectedType === 'creator-profile' ? 'Creator Profile' : 'Single Video'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!link.trim() || isSubmitting}
            className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Processing...' : 'Continue'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Supported Links
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Creator Profile:</span>
              <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                https://www.douyin.com/user/...
              </code>
            </div>
            <div>
              <span className="font-medium">Single Video:</span>
              <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                https://www.douyin.com/video/...
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
