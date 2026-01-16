import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Layers Documentation</h1>
      <p className="text-lg text-gray-600 mb-8">
        Human-AI coordination platform documentation
      </p>
      <Link
        href="/docs/models"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        View Model Documentation →
      </Link>
    </main>
  );
}
