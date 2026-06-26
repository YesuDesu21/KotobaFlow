This will serve as the guideline for the development process of the whole project.

## Phase 1: The Core Data Layer (Today)
Before your AI agents or web apps can do anything, they need a unified way to process and understand Japanese pitch accents.

Step 1: Implement your shared utilities (packages/shared-utils/src/pitch-parser.ts). Write the core logic that transforms raw database outputs or AI strings into a standardized JSON schema (e.g., separating the text, the kana, and the binary pitch high/low sequence).

Step 2: Seed your local SQLite database (linguistics.db). Move your database file into the packages/backend-core/data/ folder and test your local read/write connection queries using a simple TypeScript script.

## Phase 2: The Agentic Orchestration Layer
Next, we make your local backend smart by building out the Genkit workflows that your Chrome extension and web companion will fetch.

Step 3: Build your first tool in packages/backend-core/src/mcp/. Create a local tool that connects to your SQLite database so an LLM can look up local definitions and structural pitch data whenever it needs to.

Step 4: Build your primary analysis Flow in packages/backend-core/src/agents/. Define an explicit Genkit flow that takes a sentence from Google Docs, uses Gemini 1.5 Flash to parse the particles/tokens, runs local database lookups for known words, and returns a fully mapped array of terms.

Step 5: Verify everything inside your running Genkit Developer UI (localhost:4000). Run your flow with sample text like 「日本語を勉強します」 and make sure it builds the perfect JSON structure.

## Phase 3: The Chrome Extension Layer (Client-Side Ingestion)
With an active backend API endpoint ready to answer, you can now build the interface that reads directly from a user's active screen.

Step 6: Code the Content Script (apps/chrome-extension/src/content/furigana.ts). Write the DOM scraping engine that safely parses the internal structure of a Google Docs canvas element or text field to find selected phrases.

Step 7: Code the Extension Background Worker (apps/chrome-extension/src/background/index.ts). Write the script that intercepts context menus, catches selected Japanese text, sends a quick HTTP POST request to your local Genkit backend server, and replies to the content script.

Step 7.5: Build the Print Engine Pipeline. Configure the background worker to support a "Prepare for Print" action. This serializes the text with semantic HTML `<ruby>` nodes and injects them into a clean browser layout window (`public/print-template.html`), triggering the native operating system print interface automatically.

Step 8: Code the Visual Canvas Overlay (apps/chrome-extension/src/content/overlay.ts). Inject a lightweight, clean CSS overlay onto the screen to draw those precise pitch lines directly above the corresponding Japanese characters.

## Phase 4: The Web Companion & P-SEO Layer (The Showcase App)
Finally, you build your high-visibility public application that mirrors your tool's capabilities for external search traffic.

Step 9: Wire your layout templates (apps/web-companion/src/app/japanese-pitch-accent/[word]/page.tsx). Create your dynamic route layout using Tailwind CSS to display beautiful, scannable pitch accent diagrams for individual words.

Step 10: Implement Incremental Static Regeneration (ISR). Configure your dynamic route to pre-render popular search terms out of your database file, ensuring instantaneous page load metrics that search engine crawlers will love.

## Phase 5: Production & Portfolios
Step 11: Deploy the frontend workspace directory onto Vercel.

Step 12: Pack your Extension asset folder into a zip file so you can drag-and-drop it into Chrome Developer Mode for real-world day-to-day use.