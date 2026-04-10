import { diffWords, diffLines, Change } from "diff";

export type DiffMode = "words" | "lines";

export interface DiffResult {
  changes: Change[];
  stats: DiffStats;
}

export interface DiffStats {
  totalLeft: number;
  totalRight: number;
  added: number;
  removed: number;
  unchanged: number;
  similarityPercent: number;
  wordCountLeft: number;
  wordCountRight: number;
  charCountLeft: number;
  charCountRight: number;
  lineCountLeft: number;
  lineCountRight: number;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countLines(text: string): number {
  return text.split("\n").length;
}

export function computeDiff(leftText: string, rightText: string, mode: DiffMode = "words"): DiffResult {
  const changes = mode === "words"
    ? diffWords(leftText, rightText)
    : diffLines(leftText, rightText);

  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const change of changes) {
    const len = change.value.length;
    if (change.added) {
      added += len;
    } else if (change.removed) {
      removed += len;
    } else {
      unchanged += len;
    }
  }

  const total = unchanged + added + removed;
  const similarityPercent = total > 0 ? Math.round((unchanged / (unchanged + Math.max(added, removed))) * 100) : 100;

  return {
    changes,
    stats: {
      totalLeft: leftText.length,
      totalRight: rightText.length,
      added,
      removed,
      unchanged,
      similarityPercent,
      wordCountLeft: countWords(leftText),
      wordCountRight: countWords(rightText),
      charCountLeft: leftText.length,
      charCountRight: rightText.length,
      lineCountLeft: countLines(leftText),
      lineCountRight: countLines(rightText),
    },
  };
}

export function exportDiffAsHTML(changes: Change[], stats: DiffStats): string {
  let html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Diff Report</title>
<style>
body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 900px; margin: auto; }
.stats { background: #f3f4f6; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; }
.stats h2 { margin-top: 0; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.diff-content { white-space: pre-wrap; font-family: monospace; line-height: 1.8; background: #fafafa; padding: 1rem; border-radius: 8px; border: 1px solid #e5e7eb; }
.added { background: #dcfce7; color: #166534; }
.removed { background: #fee2e2; color: #991b1b; text-decoration: line-through; }
</style></head><body>
<h1>Document Comparison Report</h1>
<div class="stats"><h2>Statistics</h2>
<div class="stats-grid">
<div>Similarity: <strong>${stats.similarityPercent}%</strong></div>
<div>Left: ${stats.wordCountLeft} words</div>
<div>Right: ${stats.wordCountRight} words</div>
<div>Added: ${stats.added} chars</div>
<div>Removed: ${stats.removed} chars</div>
<div>Unchanged: ${stats.unchanged} chars</div>
</div></div>
<div class="diff-content">`;

  for (const change of changes) {
    const escaped = change.value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (change.added) {
      html += `<span class="added">${escaped}</span>`;
    } else if (change.removed) {
      html += `<span class="removed">${escaped}</span>`;
    } else {
      html += escaped;
    }
  }

  html += `</div></body></html>`;
  return html;
}
