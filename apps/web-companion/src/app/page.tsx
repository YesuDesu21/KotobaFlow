/**
 * KotobaFlow AI — Landing Page
 *
 * High-conversion marketing page with:
 * - Hero section (headline, CTA, word list link)
 * - Problem/solution: why furigana in Google Docs is hard
 * - 6 feature cards
 * - 3-step "How It Works" section
 * - Final CTA to install the Chrome extension
 *
 * This is a static page prerendered at build time.
 */

import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
            Master Japanese Pronunciation
            <br />
            <span className="text-indigo-200">Inside Google Docs</span>
          </h1>
          <p className="text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
            KotobaFlow AI adds real-time furigana and interactive pitch accent
            contours directly to your Google Docs — so you can write, read, and
            pronounce with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-indigo-600 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
              Add to Chrome — Free
            </a>
            <Link
              href="/japanese-pitch-accent"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-indigo-300 text-indigo-100 rounded-xl font-semibold hover:bg-white/10 hover:border-white transition-all"
            >
              Browse Word List
            </Link>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Canvas can&apos;t do furigana
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Google Docs renders Japanese text on an HTML5 Canvas, making it
                impossible to add furigana or see pitch accent patterns with
                standard browser extensions.
              </p>
              <p className="text-gray-600 leading-relaxed">
                KotobaFlow AI solves this by intelligently extracting text from
                the accessibility layer and rendering clean ruby annotations and
                SVG pitch contours on a separate overlay.
              </p>
            </div>
            <div className="bg-indigo-50 rounded-2xl p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-indigo-600 font-[family-name:var(--font-noto-sans-jp)] mb-2">
                  日本語
                </div>
                <div className="text-lg text-indigo-400 mb-4">にほんご</div>
                <svg className="w-full max-w-xs mx-auto" viewBox="0 0 200 40">
                  <path d="M 20 10 L 80 10 L 80 35 L 140 35 L 200 35" fill="none" stroke="#4F46E5" strokeWidth="2.5"/>
                  <circle cx="30" cy="10" r="4" fill="#4F46E5"/>
                  <circle cx="65" cy="10" r="4" fill="#4F46E5"/>
                  <circle cx="100" cy="35" r="3.5" fill="#9ca3af"/>
                  <circle cx="135" cy="35" r="3.5" fill="#9ca3af"/>
                  <circle cx="175" cy="35" r="3.5" fill="#9ca3af"/>
                </svg>
                <p className="text-xs text-gray-400 mt-2">Heiban (平板) pitch pattern</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Everything you need to master Japanese pitch
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Auto Furigana",
                desc: "Pause typing for 1.5s and furigana appears automatically above kanji — no hotkeys needed.",
                icon: "あ",
              },
              {
                title: "Pitch Contours",
                desc: "Right-click any selection to see the H/L pitch pattern as a clean SVG chart.",
                icon: "📈",
              },
              {
                title: "Print-Ready",
                desc: "Generate print-optimized ruby annotation sheets for offline study.",
                icon: "🖨️",
              },
              {
                title: "AI-Powered",
                desc: "Genkit AI pipeline resolves complex downstepping and particle attachment rules.",
                icon: "🤖",
              },
              {
                title: "Zero Cost",
                desc: "Operates entirely on free cloud tiers. No subscription, no hidden fees.",
                icon: "💰",
              },
              {
                title: "Google Docs Native",
                desc: "Designed specifically for docs.google.com — works around the canvas limitation.",
                icon: "📝",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Install", desc: "Add the extension from the Chrome Web Store in one click." },
              { step: "2", title: "Open a Doc", desc: "Navigate to any Google Docs document and start typing Japanese." },
              { step: "3", title: "See Results", desc: "Furigana appears automatically. Right-click any selection for pitch charts." },
            ].map((s) => (
              <div key={s.step}>
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-indigo-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Start reading and writing Japanese with confidence</h2>
          <p className="text-indigo-100 mb-8 max-w-lg mx-auto">
            KotobaFlow AI is free, open-source, and works in any Google Docs document right now.
          </p>
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-3.5 bg-white text-indigo-600 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            Add to Chrome — Free
          </a>
        </div>
      </section>
    </>
  );
}
