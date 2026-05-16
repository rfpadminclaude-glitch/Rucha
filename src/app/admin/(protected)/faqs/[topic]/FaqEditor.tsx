"use client";

import { useState, useTransition } from "react";
import { saveFaq, deleteFaq } from "./actions";

type Initial = {
  topic_key: string;
  category: string;
  domain: string;
  source_url: string;
  en_question: string;
  en_answer: string;
  es_question: string;
  es_answer: string;
};

export default function FaqEditor({
  initial,
  isNew,
}: {
  initial: Initial;
  isNew: boolean;
}) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();

  return (
    <form
      action={(fd) => {
        setError("");
        startTransition(async () => {
          const r = await saveFaq(fd);
          if (r?.error) setError(r.error);
        });
      }}
      className="space-y-6"
    >
      <input type="hidden" name="original_topic_key" value={initial.topic_key} />

      {/* Topic metadata */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field
            label="Topic key"
            name="topic_key"
            defaultValue={initial.topic_key}
            placeholder="e.g. btr-renewal"
            required
            mono
          />
          <Field
            label="Category"
            name="category"
            defaultValue={initial.category}
            placeholder="business, police, parks…"
          />
          <SelectField
            label="Source domain"
            name="domain"
            defaultValue={initial.domain}
            options={[
              { value: "cityofdoral.com", label: "cityofdoral.com" },
              { value: "doralpd.com", label: "doralpd.com (PD)" },
            ]}
          />
        </div>
        <Field
          label="Source URL"
          name="source_url"
          defaultValue={initial.source_url}
          placeholder="https://www.cityofdoral.com/…"
        />
      </div>

      {/* Side-by-side EN / ES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LangColumn
          flag="EN"
          accent="bg-doral-gold/20"
          questionName="en_question"
          answerName="en_answer"
          questionDefault={initial.en_question}
          answerDefault={initial.en_answer}
        />
        <LangColumn
          flag="ES"
          accent="bg-red-100"
          questionName="es_question"
          answerName="es_answer"
          questionDefault={initial.es_question}
          answerDefault={initial.es_answer}
        />
      </div>

      {error && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          {!isNew && (
            <form
              action={(fd) => {
                if (!confirm(`Delete topic "${initial.topic_key}"? Both EN and ES rows will be removed.`)) return;
                fd.set("topic_key", initial.topic_key);
                startDelete(async () => {
                  const r = await deleteFaq(fd);
                  if (r?.error) setError(r.error);
                });
              }}
            >
              <button
                type="submit"
                disabled={deleting}
                className="text-xs px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete topic"}
              </button>
            </form>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded bg-doral-navy text-white text-sm font-semibold disabled:opacity-50 border-b-2 border-doral-gold"
        >
          {pending ? "Saving…" : isNew ? "Create topic" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function LangColumn({
  flag,
  accent,
  questionName,
  answerName,
  questionDefault,
  answerDefault,
}: {
  flag: string;
  accent: string;
  questionName: string;
  answerName: string;
  questionDefault: string;
  answerDefault: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className={`px-4 py-2 ${accent} text-xs font-bold tracking-wider text-doral-navy`}>
        {flag}
      </div>
      <div className="p-4 space-y-3">
        <Field
          label="Question"
          name={questionName}
          defaultValue={questionDefault}
          required
        />
        <TextArea
          label="Answer"
          name={answerName}
          defaultValue={answerDefault}
          rows={6}
          required
        />
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  mono,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-1">
        {label}
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={`block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-doral-navy ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-1">
        {label}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows ?? 4}
        required={required}
        className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-doral-navy"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-1">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="block w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-doral-navy"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
