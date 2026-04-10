import { useState, useCallback, useRef } from "react";
import { extractText, getFileType, isSupported } from "@/lib/file-parser";
import { computeDiff, exportDiffAsHTML, type DiffResult, type DiffMode } from "@/lib/diff-engine";
import { FileUp, ArrowLeftRight, BarChart3, Download, Loader2, X, FileText, File, Columns2, AlignJustify, RotateCcw, Sparkles, Zap } from "lucide-react";

interface FileInfo {
  file: File;
  text: string;
  type: string;
}

export default function Home() {
  const [leftFile, setLeftFile] = useState<FileInfo | null>(null);
  const [rightFile, setRightFile] = useState<FileInfo | null>(null);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [diffMode, setDiffMode] = useState<DiffMode>("words");
  const [viewMode, setViewMode] = useState<"unified" | "side-by-side">("unified");
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState<"left" | "right" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File, side: "left" | "right") => {
    if (!isSupported(file)) {
      setError(`File type not supported. Use PDF, Word (.docx), or Text (.txt) files.`);
      return;
    }

    setLoadingFile(side);
    setError(null);

    try {
      const text = await extractText(file);
      const info: FileInfo = { file, text, type: getFileType(file) };

      if (side === "left") {
        setLeftFile(info);
      } else {
        setRightFile(info);
      }
      setDiffResult(null);
    } catch (e: any) {
      setError(`Error reading file: ${e.message}`);
    } finally {
      setLoadingFile(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, side: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, side);
  }, [handleFile]);

  const handleCompare = useCallback(() => {
    if (!leftFile || !rightFile) return;
    setLoading(true);
    setError(null);

    setTimeout(() => {
      try {
        const result = computeDiff(leftFile.text, rightFile.text, diffMode);
        setDiffResult(result);
      } catch (e: any) {
        setError(`Comparison error: ${e.message}`);
      } finally {
        setLoading(false);
      }
    }, 100);
  }, [leftFile, rightFile, diffMode]);

  const handleExport = useCallback(() => {
    if (!diffResult) return;
    const html = exportDiffAsHTML(diffResult.changes, diffResult.stats);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diff-report.html";
    a.click();
    URL.revokeObjectURL(url);
  }, [diffResult]);

  const handleReset = useCallback(() => {
    setLeftFile(null);
    setRightFile(null);
    setDiffResult(null);
    setError(null);
  }, []);

  const handleSwap = useCallback(() => {
    setLeftFile(prev => {
      const old = prev;
      setRightFile(leftFile);
      return rightFile;
    });
    setDiffResult(null);
  }, [leftFile, rightFile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">DocDiff</h1>
              <p className="text-xs text-slate-500">Compare PDF, Word & Text files</p>
            </div>
          </div>
          {(leftFile || rightFile) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <X className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <DropZone
            label="Document A"
            file={leftFile}
            loading={loadingFile === "left"}
            onDrop={(e) => handleDrop(e, "left")}
            onSelect={() => leftInputRef.current?.click()}
            onClear={() => { setLeftFile(null); setDiffResult(null); }}
          />
          <DropZone
            label="Document B"
            file={rightFile}
            loading={loadingFile === "right"}
            onDrop={(e) => handleDrop(e, "right")}
            onSelect={() => rightInputRef.current?.click()}
            onClear={() => { setRightFile(null); setDiffResult(null); }}
          />
        </div>

        <input
          ref={leftInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, "left"); e.target.value = ""; }}
        />
        <input
          ref={rightInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, "right"); e.target.value = ""; }}
        />

        {leftFile && rightFile && (
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => { setDiffMode("words"); setDiffResult(null); }}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${diffMode === "words" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                By Words
              </button>
              <button
                onClick={() => { setDiffMode("lines"); setDiffResult(null); }}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${diffMode === "lines" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                By Lines
              </button>
            </div>

            <button
              onClick={handleSwap}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Swap
            </button>

            <button
              onClick={handleCompare}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg hover:from-indigo-600 hover:to-blue-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Compare
            </button>
          </div>
        )}

        {diffResult && (
          <>
            <StatsPanel stats={diffResult.stats} />

            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setViewMode("unified")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === "unified" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                  Unified
                </button>
                <button
                  onClick={() => setViewMode("side-by-side")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === "side-by-side" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  Side by Side
                </button>
              </div>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>

            {viewMode === "unified" ? (
              <UnifiedView changes={diffResult.changes} />
            ) : (
              <SideBySideView leftText={leftFile!.text} rightText={rightFile!.text} changes={diffResult.changes} />
            )}
          </>
        )}

        {!leftFile && !rightFile && !diffResult && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 border border-slate-200/60 rounded-full text-sm text-slate-500 shadow-sm">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Drag and drop or click to upload files to compare
            </div>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <FeatureCard icon={<FileText className="w-5 h-5" />} title="Multi-format" desc="PDF, Word, and plain text" />
              <FeatureCard icon={<BarChart3 className="w-5 h-5" />} title="Statistics" desc="Word count, similarity score" />
              <FeatureCard icon={<Download className="w-5 h-5" />} title="Export" desc="Download comparison report" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-5 bg-white/70 border border-slate-200/60 rounded-xl backdrop-blur-sm">
      <div className="text-indigo-500">{icon}</div>
      <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
  );
}

function DropZone({ label, file, loading, onDrop, onSelect, onClear }: {
  label: string;
  file: FileInfo | null;
  loading: boolean;
  onDrop: (e: React.DragEvent) => void;
  onSelect: () => void;
  onClear: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { setDragOver(false); onDrop(e); }}
      onClick={file ? undefined : onSelect}
      className={`relative group rounded-2xl border-2 border-dashed transition-all duration-300 ${
        file
          ? "border-indigo-200 bg-white"
          : dragOver
            ? "border-indigo-400 bg-indigo-50/50 scale-[1.01]"
            : "border-slate-200 bg-white/50 hover:border-indigo-300 hover:bg-white cursor-pointer"
      } p-6`}
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-500">Reading document...</p>
        </div>
      ) : file ? (
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center shrink-0">
            {file.type === "PDF" ? <File className="w-6 h-6 text-indigo-600" /> : <FileText className="w-6 h-6 text-indigo-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{label}</span>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{file.type}</span>
            </div>
            <p className="font-medium text-slate-800 text-sm truncate">{file.file.name}</p>
            <p className="text-xs text-slate-400 mt-1">
              {(file.file.size / 1024).toFixed(1)} KB
              {" | "}
              {file.text.split(/\s+/).filter(Boolean).length} words
              {" | "}
              {file.text.split("\n").length} lines
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center group-hover:from-indigo-100 group-hover:to-blue-50 transition-colors">
            <FileUp className="w-7 h-7 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="text-xs text-slate-400 mt-1">PDF, Word (.docx), or Text (.txt)</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsPanel({ stats }: { stats: DiffResult["stats"] }) {
  const simColor = stats.similarityPercent >= 80 ? "text-emerald-600" : stats.similarityPercent >= 50 ? "text-amber-600" : "text-red-600";
  const simBg = stats.similarityPercent >= 80 ? "from-emerald-500 to-green-500" : stats.similarityPercent >= 50 ? "from-amber-500 to-yellow-500" : "from-red-500 to-rose-500";

  return (
    <div className="mb-6 p-5 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-indigo-500" />
        <h3 className="font-semibold text-slate-800 text-sm">Comparison Statistics</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl">
          <div className={`text-2xl font-bold ${simColor}`}>{stats.similarityPercent}%</div>
          <div className="text-xs text-slate-500 mt-1">Similarity</div>
          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${simBg} rounded-full transition-all duration-500`} style={{ width: `${stats.similarityPercent}%` }} />
          </div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl">
          <div className="text-2xl font-bold text-slate-800">{stats.wordCountLeft} / {stats.wordCountRight}</div>
          <div className="text-xs text-slate-500 mt-1">Words (A / B)</div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl">
          <div className="text-2xl font-bold text-emerald-600">+{stats.added}</div>
          <div className="text-xs text-slate-500 mt-1">Characters Added</div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl">
          <div className="text-2xl font-bold text-red-600">-{stats.removed}</div>
          <div className="text-xs text-slate-500 mt-1">Characters Removed</div>
        </div>
      </div>
    </div>
  );
}

function UnifiedView({ changes }: { changes: DiffResult["changes"] }) {
  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words max-h-[600px] overflow-y-auto">
        {changes.map((change, i) => {
          if (change.added) {
            return <span key={i} className="bg-emerald-100 text-emerald-800 px-0.5 rounded">{change.value}</span>;
          }
          if (change.removed) {
            return <span key={i} className="bg-red-100 text-red-800 line-through px-0.5 rounded">{change.value}</span>;
          }
          return <span key={i}>{change.value}</span>;
        })}
      </div>
    </div>
  );
}

function SideBySideView({ leftText, rightText, changes }: { leftText: string; rightText: string; changes: DiffResult["changes"] }) {
  const leftParts: Array<{ text: string; type: "unchanged" | "removed" }> = [];
  const rightParts: Array<{ text: string; type: "unchanged" | "added" }> = [];

  for (const change of changes) {
    if (change.added) {
      rightParts.push({ text: change.value, type: "added" });
    } else if (change.removed) {
      leftParts.push({ text: change.value, type: "removed" });
    } else {
      leftParts.push({ text: change.value, type: "unchanged" });
      rightParts.push({ text: change.value, type: "unchanged" });
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/60">
          <span className="text-xs font-medium text-slate-500">Document A</span>
        </div>
        <div className="p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words max-h-[500px] overflow-y-auto">
          {leftParts.map((part, i) => (
            <span key={i} className={part.type === "removed" ? "bg-red-100 text-red-800 line-through px-0.5 rounded" : ""}>
              {part.text}
            </span>
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/60">
          <span className="text-xs font-medium text-slate-500">Document B</span>
        </div>
        <div className="p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words max-h-[500px] overflow-y-auto">
          {rightParts.map((part, i) => (
            <span key={i} className={part.type === "added" ? "bg-emerald-100 text-emerald-800 px-0.5 rounded" : ""}>
              {part.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
