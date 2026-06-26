/**
 * KotobaFlow AI — Programmatic SEO Word Page
 *
 * ISR-powered detail page for a single Japanese word's pitch accent.
 *
 * Key design decisions:
 * - dynamic = 'force-static' + revalidate = 604800 (7 days)
 *   -> Vercel prerenders at request time, caches for a week.
 * - params is typed as Promise for Next.js 15+ async contract.
 * - Falls back to a "Word Not Found" page for unknown words.
 * - Renders a static SVG pitch contour identical to the extension's overlay.
 * - Includes related words links for internal linking / crawl depth.
 * - Bottom CTA drives Chrome Web Store conversion.
 *
 * In production, the static data file would be replaced by
 * a build-time SQLite query against linguistics.db.
 */

import { Metadata } from "next";
import Link from "next/link";
import { getWordData, getRelatedWords } from "@/data/pitch-accent-data";
import { sequenceToSVG, START_X, SPACING, HIGH_Y, LOW_Y } from "@kotobaflow/shared-utils";

export const dynamic = "force-static";

interface PageProps {
  params: Promise<{ word: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { word } = await params;
  const decoded = decodeURIComponent(word);
  const entry = getWordData(decoded);

  if (!entry) {
    return { title: "Word Not Found" };
  }

  return {
    title: `${entry.word} (${entry.reading}) — Japanese Pitch Accent`,
    description: `Learn the correct ${entry.pitchPattern} pitch accent pattern for ${entry.word} (${entry.reading}, ${entry.definition}) in Japanese. Interactive H/L contour visualization.`,
    openGraph: {
      title: `${entry.word} — Japanese Pitch Accent | KotobaFlow AI`,
      description: `Pitch pattern: ${entry.pitchPattern}. Reading: ${entry.reading}. ${entry.definition}.`,
    },
  };
}

/**
 * Renders an inline SVG pitch contour from an H/L sequence.
 * Mirrors the logic in overlay.ts (Chrome extension) and
 * pitch-parser.ts (shared-utils) for visual consistency.
 *
 * Layout:
 *   - H (High) points  at y=10, filled #4F46E5
 *   - L (Low)  points  at y=40, filled #9ca3af
 *   - Mora numbers displayed below each point
 *   - Line extends with a tail after the final mora
 */
function PitchSvg({ sequence }: { sequence: ("H" | "L")[] }) {
  const points = sequence.map((p, i) => ({
    x: START_X + i * SPACING,
    y: p === "H" ? HIGH_Y : LOW_Y,
  }));

  if (points.length === 0) return null;

  const svg = sequenceToSVG(sequence);

  return (
    <svg className="w-full h-auto" viewBox={svg.viewBox} xmlns="http://www.w3.org/2000/svg">
      <path d={svg.path} fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.y === HIGH_Y ? 4 : 3.5} fill={p.y === HIGH_Y ? "#4F46E5" : "#9ca3af"} />
      ))}
      {points.map((_, i) => (
        <text key={i} x={points[i].x} y={48} textAnchor="middle" fontSize="9" fill="#9ca3af">
          {i + 1}
        </text>
      ))}
    </svg>
  );
}

export default async function WordPage({ params }: PageProps) {
  const { word } = await params;
  const decoded = decodeURIComponent(word);
  const entry = getWordData(decoded);

  if (!entry) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Word Not Found</h1>
        <p className="text-gray-500 mb-6">
          We don&apos;t have pitch accent data for &ldquo;{decoded}&rdquo; yet.
        </p>
        <Link
          href="/japanese-pitch-accent"
          className="text-indigo-600 hover:underline font-medium"
        >
          &larr; Back to word list
        </Link>
      </div>
    );
  }

  const related = getRelatedWords(decoded);

  const badgeColor =
    entry.pitchPattern === "Heiban"
      ? "bg-blue-100 text-blue-700"
      : entry.pitchPattern === "Atamadaka"
        ? "bg-pink-100 text-pink-700"
        : entry.pitchPattern === "Nakadaka"
          ? "bg-amber-100 text-amber-700"
          : "bg-emerald-100 text-emerald-700";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link
        href="/japanese-pitch-accent"
        className="text-sm text-indigo-600 hover:underline mb-6 inline-block"
      >
        &larr; Back to word list
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
        <div className="flex items-baseline gap-3 mb-2">
          <h1 className="text-4xl font-bold text-gray-900 font-[family-name:var(--font-noto-sans-jp)]">
            {entry.word}
          </h1>
          <span className="text-lg text-gray-400">{entry.reading}</span>
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ml-auto ${badgeColor}`}>
            {entry.pitchPattern}
          </span>
        </div>

        <p className="text-gray-500 text-sm mb-2">
          {entry.definition} &middot; {entry.partOfSpeech} &middot; {entry.moraCount} morae
        </p>

        <div className="bg-indigo-50 rounded-xl p-6 mt-6">
          <PitchSvg sequence={entry.sequence} />
        </div>

        <div className="flex flex-wrap gap-4 mt-6 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#4F46E5]" /> High (H)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#9ca3af]" /> Low (L)
          </span>
          <span>
            Pattern: <strong>{entry.pitchPattern}</strong> &middot;{" "}
            {entry.pitchPattern === "Heiban"
              ? "First mora high, remaining low. No downstep — pitch stays flat after the drop."
              : entry.pitchPattern === "Atamadaka"
                ? "First mora high, then drops and stays low. Downstep after the first mora."
                : entry.pitchPattern === "Nakadaka"
                  ? "Starts low, rises, then drops. Downstep occurs in the middle."
                  : "Starts low, rises to high on the first mora, then drops and stays low."}
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white text-center mb-8">
        <h2 className="text-xl font-bold mb-2">See this in Google Docs</h2>
        <p className="text-indigo-100 text-sm mb-4">
          Install KotobaFlow AI for real-time pitch accent analysis as you type.
        </p>
        <a
          href="https://chrome.google.com/webstore"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-2.5 bg-white text-indigo-600 rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          Install Extension
        </a>
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Related {entry.partOfSpeech}s
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {related.map((r) => (
              <Link
                key={r.word}
                href={`/japanese-pitch-accent/${encodeURIComponent(r.word)}`}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div>
                  <span className="font-semibold text-gray-900 font-[family-name:var(--font-noto-sans-jp)]">
                    {r.word}
                  </span>
                  <span className="text-sm text-gray-400 ml-2">{r.reading}</span>
                </div>
                <span className="text-xs text-gray-400">{r.pitchPattern}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
