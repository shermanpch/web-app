import PageLayout from '@/components/layout/PageLayout';

export default function HomePage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-16 font-serif">
          Welcome to I Ching AI
        </h1>
        
        <div className="space-y-8">
          <p className="text-xl text-gray-200 font-serif leading-relaxed">
            Discover personalized I Ching readings enhanced by artificial intelligence.
          </p>
          
          <p className="text-xl text-gray-200 font-serif leading-relaxed">
            Get interpretations that are both grounded in classical wisdom
            and tailored to your unique circumstances.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
