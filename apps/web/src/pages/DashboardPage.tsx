import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.email}!
          </h1>
          <p className="text-gray-600 mb-8">
            Generate AI-powered metadata for your images
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to="/generate"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition border-2 border-transparent hover:border-indigo-500"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 ml-4">
                  Generate Metadata
                </h2>
              </div>
              <p className="text-gray-600">
                Upload an image and get AI-generated SEO title, meta description, alt text,
                and social media captions
              </p>
            </Link>

            <Link
              to="/results"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition border-2 border-transparent hover:border-indigo-500"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 ml-4">
                  View Results
                </h2>
              </div>
              <p className="text-gray-600">
                Browse and manage all your previously generated metadata results
              </p>
            </Link>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              How it works
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Upload an image</li>
              <li>Provide short context about the image</li>
              <li>AI generates optimized metadata</li>
              <li>Copy and use the results for your content</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
