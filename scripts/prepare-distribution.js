import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "DEV-003-DISTRIBUTION-PACK.md");
const distributionDir = path.join(root, "distribution");

const sections = [
  "## 1. Reddit / Community Post Draft",
  "## 2. dev.to Article Draft",
  "## 3. Hacker News / Builder-Community Version",
  "## 4. Suitable Places To Share Without Spam",
  "## 5. 7-Day Measurement Checklist",
  "## 6. Do Not Overclaim Guidance",
];

function extractSection(markdown, heading) {
  const start = markdown.indexOf(heading);
  if (start === -1) {
    throw new Error(`Missing section: ${heading}`);
  }

  const laterSections = sections
    .filter((section) => section !== heading)
    .map((section) => markdown.indexOf(section, start + heading.length))
    .filter((index) => index !== -1);
  const end = laterSections.length > 0 ? Math.min(...laterSections) : markdown.length;
  return markdown.slice(start + heading.length, end).trim();
}

function addHeader(title, body) {
  return `# ${title}\n\n${body.trim()}\n`;
}

function shortBuilderPost() {
  return `# Short Builder Post

I built a small free MIT-licensed CLI after hitting x402 payment config issues that failed quietly instead of obviously.

It checks practical x402 config traps:

- v1 network names vs v2 CAIP-2 IDs
- Base mainnet USDC EIP-712 name mismatch (\`USD Coin\` vs \`USDC\`)
- testnet/mainnet asset mix-ups
- known facilitator capability issues
- sub-cent mainnet price sanity
- malformed or missing \`payTo\`

\`\`\`bash
npx x402-preflight check ./config.json
\`\`\`

Cloudflare Workers:

\`\`\`bash
npx x402-preflight check ./wrangler.toml --wrangler
\`\`\`

Free, MIT-licensed, AI-assisted, and built from real mainnet debugging pain.

GitHub: https://github.com/Gareth1953/x402-preflight
npm: https://www.npmjs.com/package/x402-preflight

It is not an audit and does not guarantee settlement. It only checks known config mistakes before deploy.
`;
}

function metricsTemplate() {
  return [
    "date,github_stars,github_forks,github_watchers,open_issues,npm_weekly_downloads,comments,useful_questions,reported_real_issue,notes",
    "",
  ].join("\n");
}

function distributionReadme() {
  return `# x402-preflight Distribution Folder

This folder is generated locally by:

\`\`\`bash
npm run prepare:distribution
\`\`\`

Generated files are copy/paste-ready drafts for manual distribution and measurement.

## Human Approval Required

Nothing in this folder should be published automatically.

Every post, comment, article, or community share requires Gareth's manual review and approval before publication.

Do not post to Reddit, Hacker News, dev.to, X, LinkedIn, Discord, GitHub discussions, forums, or any external community without Gareth's explicit approval.

## Files

- \`devto-draft.md\` - dev.to article draft.
- \`hackernews-draft.md\` - Hacker News / builder-community draft.
- \`reddit-community-draft.md\` - Reddit / community draft.
- \`short-builder-post.md\` - concise builder-community post.
- \`metrics-template.csv\` - 7-day measurement tracker.

## Distribution Rules

- Keep the tone honest and builder-to-builder.
- Do not spam.
- Do not mass post identical text.
- Do not make consulting pitches.
- Do not promise profit, settlement, security, or complete x402 validation.
- Emphasise that x402-preflight is free, MIT-licensed, AI-assisted, and built from real mainnet debugging pain.
`;
}

async function main() {
  const source = await readFile(sourcePath, "utf8");
  await mkdir(distributionDir, { recursive: true });

  const outputs = {
    "reddit-community-draft.md": addHeader(
      "Reddit / Community Draft",
      extractSection(source, "## 1. Reddit / Community Post Draft"),
    ),
    "devto-draft.md": addHeader(
      "dev.to Article Draft",
      extractSection(source, "## 2. dev.to Article Draft"),
    ),
    "hackernews-draft.md": addHeader(
      "Hacker News / Builder-Community Draft",
      extractSection(source, "## 3. Hacker News / Builder-Community Version"),
    ),
    "short-builder-post.md": shortBuilderPost(),
    "metrics-template.csv": metricsTemplate(),
    "README.md": distributionReadme(),
  };

  await Promise.all(
    Object.entries(outputs).map(([filename, content]) =>
      writeFile(path.join(distributionDir, filename), content, "utf8"),
    ),
  );

  console.log(`Prepared ${Object.keys(outputs).length} distribution files in ${path.relative(root, distributionDir)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
