import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { uploadApi, generateApi } from '../services/api';
import type { MetadataResult } from '../types';

const SESSION_KEY = 'generate-page-state';

export function GeneratePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [contextInput, setContextInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [result, setResult] = useState<MetadataResult | null>(null);
  const navigate = useNavigate();

  // Load state from sessionStorage on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem(SESSION_KEY);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.uploadedImageUrl) setUploadedImageUrl(state.uploadedImageUrl);
        if (state.uploadedFilename) setUploadedFilename(state.uploadedFilename);
        if (state.contextInput) setContextInput(state.contextInput);
        if (state.result) setResult(state.result);
        if (state.previewUrl) setPreviewUrl(state.previewUrl);
      } catch (err) {
        console.error('Failed to load session state', err);
      }
    }
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    const state = {
      uploadedImageUrl,
      uploadedFilename,
      contextInput,
      result,
      previewUrl,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  }, [uploadedImageUrl, uploadedFilename, contextInput, result, previewUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const response = await uploadApi.uploadImage(selectedFile);
      if (response.success && response.data) {
        setUploadedImageUrl(response.data.url);
        setUploadedFilename(response.data.filename);
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();

    if (!uploadedFilename) {
      setError('Please upload an image first');
      return;
    }

    if (!contextInput.trim()) {
      setError('Please provide context for the image');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await generateApi.generate(uploadedFilename, contextInput);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        throw new Error(response.error || 'Generation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleStartOver = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setContextInput('');
    setUploadedImageUrl('');
    setUploadedFilename('');
    setResult(null);
    setError('');
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Generate Metadata</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Upload & Context */}
            <div className="space-y-6">
              {/* Image Upload */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">1. Upload Image</h2>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif,image/avif,image/tiff,image/bmp"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded"
                        />
                      ) : (
                        <div>
                          <span className="text-4xl mb-2 block">📸</span>
                          <p className="text-gray-600">Click to select an image</p>
                          <p className="text-sm text-gray-500 mt-1">
                            JPEG, PNG, WebP, GIF, HEIC, AVIF, TIFF, BMP (max 10MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>

                  {selectedFile && !uploadedImageUrl && (
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                    >
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                  )}

                  {uploadedImageUrl && (
                    <div className="space-y-2">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-700">✓ Image uploaded successfully</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleStartOver}
                        className="w-full text-sm text-gray-600 hover:text-gray-800 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                      >
                        🔄 Start Over (New Image)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Context Input */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">2. Add Context</h2>

                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <textarea
                      value={contextInput}
                      onChange={(e) => setContextInput(e.target.value)}
                      placeholder="Describe the image briefly (e.g., 'Product photo of wireless headphones on a desk' or 'Toote pilt juhtmevabadest kõrvaklappidest laual')"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition h-32 resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {contextInput.length}/500 characters {!uploadedImageUrl && '(upload image first)'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!uploadedImageUrl || !contextInput.trim() || isGenerating}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                  >
                    {isGenerating ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin mr-2">⚙️</span>
                        Generating with AI...
                      </span>
                    ) : result ? (
                      '🔄 Regenerate with New Context'
                    ) : (
                      '✨ Generate Metadata'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column - Results */}
            <div>
              {result ? (
                <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Generated Metadata</h2>
                    <button
                      onClick={() => navigate('/results')}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View All Results →
                    </button>
                  </div>

                  <div className="space-y-4">
                    <ResultField
                      label="Alt Text"
                      value={result.altText}
                      onCopy={copyToClipboard}
                    />
                    <ResultField
                      label="SEO Title"
                      value={result.seoTitle}
                      onCopy={copyToClipboard}
                    />
                    <ResultField
                      label="Social Caption"
                      value={result.socialCaption}
                      onCopy={copyToClipboard}
                    />
                    <ResultField
                      label="Meta Description"
                      value={result.metaDescription}
                      onCopy={copyToClipboard}
                    />

                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Recommended Channel
                      </p>
                      <div className="bg-indigo-50 rounded-md p-3">
                        <p className="font-semibold text-indigo-900">
                          {result.recommendedChannel}
                        </p>
                        <p className="text-sm text-indigo-700 mt-1">
                          {result.channelExplanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
                  <span className="text-6xl block mb-4">📝</span>
                  <p>Your generated metadata will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ResultField({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <button
          onClick={handleCopy}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>
      <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-900">
        {value}
      </div>
    </div>
  );
}
