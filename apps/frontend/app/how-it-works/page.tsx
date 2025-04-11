import Link from "next/link";
import { Button } from "@components/ui/button";
import PageLayout from "@/components/layout/PageLayout";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";

export default function HowItWorks() {
  return (
    <PageLayout>
      <ContentContainer>
        <Heading>How It Works</Heading>

        <p className="text-xl text-gray-300 mb-6 font-serif leading-relaxed text-left">
          The I Ching, or Book of Changes, is one of the oldest philosophical
          texts in the world — dating back over 3,000 years to ancient China.
        </p>

        <p className="text-xl text-gray-300 mb-6 font-serif leading-relaxed text-left">
          It was used as a tool for divination, decision-making, and
          self-reflection, guiding emperors, scholars, and sages alike.
        </p>

        <p className="text-xl text-gray-300 mb-6 font-serif leading-relaxed text-left">
          To receive your reading, focus your mind and pose a sincere,
          open-ended question related to your situation.
        </p>

        <p className="text-xl text-gray-300 mb-6 font-serif leading-relaxed text-left">
          Give the oracle three random 3-digit numbers to determine the
          hexagram. If no number comes to mind, you may take inspiration from
          your surroundings.
        </p>

        <p className="text-xl text-gray-300 mb-8 font-serif leading-relaxed text-left">
          Unlike traditional platforms, Deltao AI allows you to ask
          clarifying questions to provide tailored guidance to the user&apos;s
          circumstances.
        </p>

        <div className="text-center">
          <Link href="/try-now">
            <Button className="bg-[#5A7D60] hover:bg-[#4A6D50] text-white px-12 py-3 rounded-full text-lg font-semibold mx-auto mt-8">
              Try Now
            </Button>
          </Link>
        </div>
      </ContentContainer>
    </PageLayout>
  );
}
