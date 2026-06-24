import { Metadata } from 'next';

export const dynamic = 'force-static';
export const revalidate = 604800; // 7 days

interface PageProps {
  params: {
    word: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const word = decodeURIComponent(params.word);
  return {
    title: `${word} - Japanese Pitch Accent | KotobaFlow AI`,
    description: `Learn the correct pitch accent pattern for ${word} in Japanese. Interactive visualization with high/low contour mapping.`,
  };
}

export default function WordPage({ params }: PageProps) {
  const word = decodeURIComponent(params.word);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {word}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Japanese Pitch Accent Visualization
          </p>

          {/* Pitch Accent Visualization Placeholder */}
          <div className="bg-indigo-50 rounded-lg p-8 mb-8">
            <svg className="pitch-contour w-full h-24" viewBox="0 0 300 50">
              <path d="M 0 10 L 100 10 L 100 40 L 300 40" fill="none" stroke="#4F46E5" strokeWidth="3"/>
              <circle cx="50" cy="10" r="4" fill="#4F46E5" />
              <circle cx="150" cy="40" r="4" fill="#4F46E5" />
              <circle cx="250" cy="40" r="4" fill="#4F46E5" />
            </svg>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Get Real-Time Pitch Accent in Google Docs
            </h2>
            <p className="text-gray-600 mb-6">
              Install KotobaFlow AI Chrome Extension for instant pitch accent analysis
              while you write in Google Docs.
            </p>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Install Extension
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
