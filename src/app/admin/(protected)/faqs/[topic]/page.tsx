import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase-server";
import FaqEditor from "./FaqEditor";

export const dynamic = "force-dynamic";

type Row = {
  lang: "en" | "es";
  question: string;
  answer: string;
  category: string | null;
  domain: string | null;
  source_url: string | null;
};

export default async function FaqEditPage({
  params,
}: {
  params: { topic: string };
}) {
  const topic = decodeURIComponent(params.topic);
  const isNew = topic === "new";

  let initial = {
    topic_key: "",
    category: "",
    domain: "cityofdoral.com",
    source_url: "",
    en_question: "",
    en_answer: "",
    es_question: "",
    es_answer: "",
  };

  if (!isNew) {
    const svc = createServiceClient();
    const { data } = await svc
      .from("faqs")
      .select("lang, question, answer, category, domain, source_url")
      .eq("topic_key", topic)
      .returns<Row[]>();
    if (!data || data.length === 0) notFound();
    const en = data.find((r) => r.lang === "en");
    const es = data.find((r) => r.lang === "es");
    const first = en ?? es!;
    initial = {
      topic_key: topic,
      category: first.category ?? "",
      domain: first.domain ?? "cityofdoral.com",
      source_url: first.source_url ?? "",
      en_question: en?.question ?? "",
      en_answer: en?.answer ?? "",
      es_question: es?.question ?? "",
      es_answer: es?.answer ?? "",
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/faqs" className="text-xs text-doral-navy hover:underline">
          ← All FAQs
        </Link>
        <h1 className="text-2xl font-semibold text-doral-navy mt-2">
          {isNew ? "New topic" : initial.topic_key}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Edit English and Spanish in lock-step. Both versions are saved
          together.
        </p>
      </div>
      <FaqEditor initial={initial} isNew={isNew} />
    </div>
  );
}
