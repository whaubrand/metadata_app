import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { resultsApi } from '../services/api';
import type { MetadataResult } from '../types';

export function ResultsPage() {
  const [results, setResults] = useState<MetadataResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchResults();
  }, [page]);

  const fetchResults = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await resultsApi.getAll(page, 10);
      if (response.success && response.data) {
        setResults(response.data.results);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        throw new Error(response.error || 'Failed to fetch results');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this result?')) {
      return;
    }

    try {
      await resultsApi.delete(id);
      fetchResults();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete result');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Results</h1>
            <Link
              to="/generate"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition font-medium"
            >
              + Generate New
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-4">⏳</span>
              <p className="text-gray-600">Loading results...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <span className="text-6xl block mb-4">📭</span>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No results yet
              </h2>
              <p className="text-gray-600 mb-6">
                Generate your first metadata to see it here
              </p>
              <Link
                to="/generate"
                className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition font-medium"
              >
                Get Started
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6">
                {results.map((result) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center space-x-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    ← Previous
                  </button>
                  <span className="text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function ResultCard({
  result,
  onDelete,
}: {
  result: MetadataResult;
  onDelete: (id: string) => void;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {result.title}
            </h3>
            <p className="text-sm text-gray-500">
              {formatDate(result.createdAt)}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Link
              to={`/results/${result.id}`}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View Details
            </Link>
            <button
              onClick={() => onDelete(result.id)}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <img
              src={result.imageUrl}
              alt={result.altText}
              className="w-full h-48 object-cover rounded-md"
            />
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-gray-500">Alt-tekst</p>
              <p className="text-sm text-gray-900">{result.altText}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Failinimi</p>
              <p className="text-sm font-mono text-gray-700">{result.suggestedFilename}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
