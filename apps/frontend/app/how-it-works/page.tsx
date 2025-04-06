import Link from 'next/link';
import { Button } from '@ui/button';
import PageLayout from '@/components/layout/PageLayout';

export default function HowItWorks() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto mt-16 mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-200 mb-8 font-serif">
          How It Works
        </h1>
        
        <p className="text-lg text-gray-300 mb-6 font-serif leading-relaxed">
          The I Ching, or Book of Changes, is one of the oldest philosophical
          texts in the world — dating back over 3,000 years to ancient China.
        </p>
        
        <p className="text-lg text-gray-300 mb-6 font-serif leading-relaxed">
          It was used as a tool for divination, decision-making, and self-reflection,
          guiding emperors, scholars, and sages alike.
        </p>
        
        <p className="text-lg text-gray-300 mb-6 font-serif leading-relaxed">
          To receive your reading, focus your mind and pose a sincere, open-ended
          question related to your situation.
        </p>
        
        <p className="text-lg text-gray-300 mb-6 font-serif leading-relaxed">
          Give the oracle three random 3-digit numbers to determine the hexagram.
          If no number comes to mind, you may take inspiration from your surroundings.
        </p>
        
        <p className="text-lg text-gray-300 mb-8 font-serif leading-relaxed">
          Unlike traditional platforms, this platform allows you to ask clarifying
          questions to provide tailored guidance to the user&apos;s circumstances.
        </p>

        <Link href="/try-now">
          <Button 
            className="bg-[#5A7D60] hover:bg-[#4A6D50] text-white px-12 py-3 rounded-full text-lg font-semibold mx-auto mt-8"
          >
            Try Now
          </Button>
        </Link>
      </div>
    </PageLayout>
  );
} 