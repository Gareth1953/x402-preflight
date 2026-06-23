import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const metricsDir = path.join(root, "metrics");
const csvPath = path.join(metricsDir, "project2-metrics.csv");
const summaryPath = path.join(metricsDir, "latest-summary.md");

const repo = "Gareth1953/x402-preflight";
const packageName = "x402-preflight";
const csvHeader =
  "date,github_stars,github_forks,github_watchers,open_issues,npm_weekly_downloads,comments,useful_questions,reported_real_issue,recommendation,notes";

async function fetchJson(url) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "x402-preflight-local-metrics",
      },
    });

    if (!response.ok) {
      return { ok: false, value: "unknown", error: `${response.status} ${response.statusText}` };
    }

    return { ok: true, value: await response.json() };
  } catch (error) {
    return {
      ok: false,
      value: "unknown",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function metricValue(source, key) {
  if (!source.ok || typeof source.value !== "object" || source.value === null) {
    return "unknown";
  }

  const value = source.value[key];
  return Number.isFinite(value) ? String(value) : "unknown";
}

function csvEscape(value) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function signalLevel(metrics) {
  const stars = numeric(metrics.githubStars);
  const forks = numeric(metrics.githubForks);
  const downloads = numeric(metrics.npmWeeklyDownloads);
  const openIssues = numeric(metrics.openIssues);

  if (downloads >= 100 || stars >= 25 || forks >= 5 || openIssues >= 3) {
    return "strong";
  }

  if (downloads >= 25 || stars >= 5 || forks >= 1 || openIssues >= 1) {
    return "moderate";
  }

  return "weak";
}

function recommendationFor(level) {
  if (level === "strong") {
    return "Keep sharing only with Gareth-approved, relevant builder communities; prioritise useful issues and requested checks before adding scope.";
  }

  if (level === "moderate") {
    return "Continue conservative measurement and consider one Gareth-approved tailored post or GitHub issue response if it is directly relevant.";
  }

  return "Do not broaden distribution yet; record baseline data and wait for Gareth-approved, low-noise sharing.";
}

async function ensureCsvExists() {
  await mkdir(metricsDir, { recursive: true });
  try {
    const current = await readFile(csvPath, "utf8");
    if (current.trim().length > 0) {
      return current;
    }
  } catch {
    // Create a new file below.
  }

  const initial = `${csvHeader}\n`;
  await writeFile(csvPath, initial, "utf8");
  return initial;
}

function summaryMarkdown(metrics, level, recommendation, notes) {
  return `# Project 2 Metrics Summary

## Current Status

Local metrics collection has run for x402-preflight using public GitHub and npm endpoints where available.

No public posting, npm publishing, paid feature release, or external promotion has been performed by this metrics script.

## Latest Metrics

- Date: ${metrics.date}
- GitHub stars: ${metrics.githubStars}
- GitHub forks: ${metrics.githubForks}
- GitHub watchers/subscribers: ${metrics.githubWatchers}
- Open issues: ${metrics.openIssues}
- npm weekly downloads: ${metrics.npmWeeklyDownloads}
- Comments: ${metrics.comments}
- Useful questions: ${metrics.usefulQuestions}
- Reported real issue: ${metrics.reportedRealIssue}

## Signal Level

Current signal level: ${level}

Signal definitions:

- weak: little or no engagement, no useful questions, no reported real-world issue.
- moderate: some engagement, useful questions, or requests for additional checks.
- strong: sustained engagement, reported real-world issue, pull requests, or repeated npm usage.

## Recommended Next Action

${recommendation}

## Approval Gate

No public posting, npm publish, paid feature, or GLIRN crossover without Gareth approval.

## Notes

${notes}
`;
}

async function main() {
  const [githubRepo, npmDownloads] = await Promise.all([
    fetchJson(`https://api.github.com/repos/${repo}`),
    fetchJson(`https://api.npmjs.org/downloads/point/last-week/${packageName}`),
  ]);

  const metrics = {
    date: new Date().toISOString().slice(0, 10),
    githubStars: metricValue(githubRepo, "stargazers_count"),
    githubForks: metricValue(githubRepo, "forks_count"),
    githubWatchers: metricValue(githubRepo, "subscribers_count"),
    openIssues: metricValue(githubRepo, "open_issues_count"),
    npmWeeklyDownloads: metricValue(npmDownloads, "downloads"),
    comments: "unknown",
    usefulQuestions: "unknown",
    reportedRealIssue: "unknown",
  };

  const level = signalLevel(metrics);
  const recommendation = recommendationFor(level);
  const fetchNotes = [
    githubRepo.ok ? "GitHub repo metrics fetched." : `GitHub repo metrics unknown: ${githubRepo.error}`,
    npmDownloads.ok ? "npm weekly downloads fetched." : `npm weekly downloads unknown: ${npmDownloads.error}`,
    "Manual community comments, useful questions, and reported real issues remain unknown until Gareth records them.",
  ].join(" ");

  const csv = await ensureCsvExists();
  const row = [
    metrics.date,
    metrics.githubStars,
    metrics.githubForks,
    metrics.githubWatchers,
    metrics.openIssues,
    metrics.npmWeeklyDownloads,
    metrics.comments,
    metrics.usefulQuestions,
    metrics.reportedRealIssue,
    recommendation,
    fetchNotes,
  ]
    .map(csvEscape)
    .join(",");

  const separator = csv.endsWith("\n") ? "" : "\n";
  await writeFile(csvPath, `${csv}${separator}${row}\n`, "utf8");
  await writeFile(summaryPath, summaryMarkdown(metrics, level, recommendation, fetchNotes), "utf8");

  console.log(`Metrics collected for ${repo}`);
  console.log(`Signal level: ${level}`);
  console.log(`Recommendation: ${recommendation}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
