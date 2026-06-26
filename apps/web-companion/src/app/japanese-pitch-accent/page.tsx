/**
 * KotobaFlow AI — Pitch Accent Hub / Word List
 *
 * Static index page listing all words in the pitch accent dataset.
 * Each entry shows kanji, reading, pattern badge (color-coded by type),
 * and links to the individual [word] detail page.
 *
 * This page is a crawlable entry point for search bots to discover
 * every /japanese-pitch-accent/[word] page.
 */

import Link from "next/link";
import { pitchAccentData } from "@/data/pitch-accent-data";

export const dynamic = "force-static";

export default function PitchAccentHub() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Japanese Pitch Accent Word List
      </h1>
      <p className="text-gray-500 mb-8">
        Browse common Japanese words with their pitch accent patterns.
        Click any word for a detailed visualization.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pitchAccentData.map((entry) => (
          <Link
            key={entry.word}
            href={`/japanese-pitch-accent/${encodeURIComponent(entry.word)}`}
            className="block p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900 text-lg font-[family-name:var(--font-noto-sans-jp)]">
                  {entry.word}
                </span>
                <span className="text-sm text-gray-400 ml-2">
                  {entry.reading}
                </span>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  entry.pitchPattern === "Heiban"
                    ? "bg-blue-100 text-blue-700"
                    : entry.pitchPattern === "Atamadaka"
                      ? "bg-pink-100 text-pink-700"
                      : entry.pitchPattern === "Nakadaka"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {entry.pitchPattern}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{entry.definition}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
