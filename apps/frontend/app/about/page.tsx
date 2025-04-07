import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/layout/PageLayout";

export default function AboutPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-16 font-serif">
          About This Platform
        </h1>

        <div className="space-y-8">
          <p className="text-xl text-gray-200 font-serif leading-relaxed text-justify">
            Many users find it difficult to interpret I Ching results in a way
            that&apos;s meaningful to their personal circumstances.
          </p>

          <p className="text-xl text-gray-200 font-serif leading-relaxed text-justify">
            Traditional platforms often provide fixed explanations, but these
            aren&apos;t always tailored to the user&apos;s unique context.
          </p>

          <p className="text-xl text-gray-200 font-serif leading-relaxed text-justify">
            This platform uses AI to bridge that gap — delivering
            interpretations that are grounded in classical wisdom, yet
            personalized to your situation.
          </p>
        </div>

        <Link href="/try-now">
          <Button className="bg-[#5A7D60] hover:bg-[#4A6D50] text-white px-12 py-3 rounded-full text-lg font-semibold mx-auto mt-16">
            Try Now
          </Button>
        </Link>
      </div>
    </PageLayout>
  );
}
