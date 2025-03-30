import { Panel } from "@/components/ui/panel";
import { DivinationForm } from "@/components/divination/divination-form";

export default function DivinationPage() {
  return (
    <div className="flex flex-col p-8">
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-8">
        I Ching Divination
      </h1>
      <Panel className="max-w-full relative z-[150]">
        <h2 className="text-xl font-semibold mb-4">
          I Ching Reading & Clarification
        </h2>
        <p className="text-[hsl(var(--muted-foreground))] mb-6">
          Receive your I Ching reading and ask follow-up questions for deeper
          insights.
        </p>
        <DivinationForm />
      </Panel>
    </div>
  );
}
