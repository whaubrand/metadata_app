import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { resultsApi } from '../services/api';
import type { MetadataResult } from '../types';

export function ResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<MetadataResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchResult(id);
    }
  }, [id]);

  const fetchResult = async (resultId: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await resultsApi.getById(resultId);
      if (response.success && response.data) {
        setResult(response.data.result);
      } else {
        throw new Error(response.error || 'Failed to fetch result');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch result');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this result?')) {
      return;
    }

    try {
      await resultsApi.delete(id);
      navigate('/results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete result');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-12 text-center">
          <span className="text-4xl block mb-4">⏳</span>
          <p className="text-gray-600">Loading result...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-12">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Result not found'}</p>
            <Link
              to="/results"
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            >
              Back to Results
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              to="/results"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to Results
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {result.title}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Created {formatDate(result.createdAt)}
                  </p>
                </div>
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Image and Context */}
            <div className="p-6 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Image</h2>
                  <img
                    src={result.imageUrl}
                    alt={result.altText}
                    className="w-full rounded-lg shadow"
                  />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Context</h2>
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-gray-900">{result.contextInput}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="p-6 space-y-6">
              <h2 className="text-xl font-semibold mb-4">WordPress metadata</h2>

              <MetadataField
                label="Failinimi"
                value={result.suggestedFilename}
                description="Soovituslik failinimi enne üleslaadimist"
                onCopy={copyToClipboard}
              />

              <MetadataField
                label="Pealkiri"
                value={result.title}
                description="Title — WordPress meediateegis"
                onCopy={copyToClipboard}
              />

              <MetadataField
                label="Alt-tekst"
                value={result.altText}
                description="Alt text — kirjeldab pildil olevat"
                onCopy={copyToClipboard}
              />

              <MetadataField
                label="Pealdis"
                value={result.caption}
                description="Caption — pildi all kuvatav tekst"
                onCopy={copyToClipboard}
              />

              <MetadataField
                label="Kirjeldus"
                value={result.description}
                description="Description — pikem kirjeldus meediateegis"
                onCopy={copyToClipboard}
              />

              {result.seoKeywords && (
                <MetadataField
                  label="SEO märksõnad"
                  value={result.seoKeywords}
                  description="Fookus-märksõnad (3–6 tk)"
                  onCopy={copyToClipboard}
                />
              )}

              {result.clarifyingQuestions && (
                <div className="pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-3">Täpsustavad küsimused</h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-900">{result.clarifyingQuestions}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetadataField({
  label,
  value,
  description,
  onCopy,
}: {
  label: string;
  value: string;
  description: string;
  onCopy: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-b pb-6 last:border-b-0">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{label}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <button
          onClick={handleCopy}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1"
        >
          <span>{copied ? '✓ Copied!' : '📋 Copy'}</span>
        </button>
      </div>
      <div className="bg-gray-50 rounded-md p-4 text-gray-900">
        {value}
      </div>
      <p className="text-xs text-gray-500 mt-1">{value.length} characters</p>
    </div>
  );
}
