import Link from 'next/link';

export default function NavigationBar() {
  return (
    <nav className="flex justify-center items-center py-4 px-8">
      <div className="flex items-center space-x-8 font-serif">
        <Link href="/" className="text-gray-200 hover:text-white transition-colors">
          Home
        </Link>
        <Link href="/about" className="text-gray-200 hover:text-white transition-colors">
          About
        </Link>
        <Link href="/try-now" className="text-gray-200 hover:text-white transition-colors">
          Try Now
        </Link>
        <Link href="/how-it-works" className="text-gray-200 hover:text-white transition-colors">
          How It Works
        </Link>
        <Link href="/pricing" className="text-gray-200 hover:text-white transition-colors">
          Pricing
        </Link>
      </div>
    </nav>
  );
} 