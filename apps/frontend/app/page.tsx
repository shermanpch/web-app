import PageLayout from "@/components/layout/PageLayout";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";

export default function HomePage() {
  return (
    <PageLayout>
      <ContentContainer>
        <Heading>Welcome to deltao.ai</Heading>

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
