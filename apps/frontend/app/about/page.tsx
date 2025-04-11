import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/layout/PageLayout";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";

export default function AboutPage() {
  return (
    <PageLayout>
      <ContentContainer>
        <Heading>About This Platform</Heading>

        <div className="space-y-8">
          <p className="text-xl text-gray-200 font-serif leading-relaxed text-left">
            Many users find it difficult to interpret I Ching results in a way
            that&apos;s meaningful to their personal circumstances.
          </p>

          <p className="text-xl text-gray-200 font-serif leading-relaxed text-left">
            Traditional platforms often provide fixed explanations, but these
            aren&apos;t always tailored to the user&apos;s unique context.
          </p>

          <p className="text-xl text-gray-200 font-serif leading-relaxed text-left">
            deltao.ai uses Deltao AI to bridge that gap — delivering
            interpretations that are grounded in classical wisdom, yet
            personalized to your situation.
          </p>
        </div>

        <div className="text-center">
          <Link href="/try-now">
            <Button className="bg-[#5A7D60] hover:bg-[#4A6D50] text-white px-12 py-3 rounded-full text-lg font-semibold mx-auto mt-16">
              Try Now
            </Button>
          </Link>
        </div>
      </ContentContainer>
    </PageLayout>
  );
}
