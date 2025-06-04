import PageLayout from "@/components/layout/PageLayout";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";
import Image from "next/image";

export default function HomePage() {
  return (
    <PageLayout>
      <ContentContainer>
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/assets/deltao-ai.webp"
            alt="Deltao AI Logo"
            width={150}
            height={150}
            priority
            className="mb-8"
          />
          <Heading>Welcome to deltao.ai</Heading>
        </div>

        <div className="space-y-8">
          <p className="text-xl text-gray-200 font-serif leading-relaxed text-left">
            Discover personalized I Ching readings enhanced by Deltao AI.
          </p>

          <p className="text-xl text-gray-200 font-serif leading-relaxed text-left">
            Get interpretations that are both grounded in classical wisdom and
            tailored to your unique circumstances.
          </p>
        </div>
      </ContentContainer>
    </PageLayout>
  );
}
