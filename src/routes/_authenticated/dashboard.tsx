import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, FileText, Loader2, Trash2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import {
  createAnalysis, runAnalysis, listAnalyses, deleteAnalysis,
} from "@/lib/analyses.functions";
import { extractResumeText } from "@/lib/pdf-client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Career Dashboard — Ascend" },
      { name: "description", content: "Your Ascend career dashboard. Upload a resume, view past AI analyses, and track your personalized roadmap." },
      { property: "og:title", content: "Career Dashboard — Ascend" },
      { property: "og:description", content: "Manage your resume analyses and AI-generated career roadmap on Ascend." },
      { property: "og:url", content: "https://ascendwithai.lovable.app/dashboard" },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://ascendwithai.lovable.app/dashboard" }],
  }),
});

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listAnalyses);
  const createFn = useServerFn(createAnalysis);
  const runFn = useServerFn(runAnalysis);
  const deleteFn = useServerFn(deleteAnalysis);

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: () => listFn({}),
  });

  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["analyses"] });
      toast.success("Deleted");
    },
  });

  async function handleFile(file: File) {
    setUploading(true);
    const tid = toast.loading("Reading your resume…");
    try {
      const text = await extractResumeText(file, (msg) => toast.loading(msg, { id: tid }));
      if (text.length < 50) {
        throw new Error("Couldn't extract enough text — try a clearer scan or a text-based PDF/DOCX.");
      }
      toast.loading("Creating analysis…", { id: tid });
      const { id } = await createFn({ data: { fileName: file.name, resumeText: text } });
      qc.invalidateQueries({ queryKey: ["analyses"] });
      toast.success("Analysis started", { id: tid });
      navigate({ to: "/analyses/$id", params: { id } });
      runFn({ data: { id } }).catch(() => { /* status is stored server-side */ });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed", { id: tid });
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Your career dashboard</h1>
        <p className="mt-1 text-muted-foreground">Upload a resume to get a new AI analysis.</p>
      </div>

      <div
        className="rounded-2xl border-2 border-dashed border-border p-10 text-center shadow-[var(--shadow-soft)]"
        style={{ backgroundImage: "var(--gradient-card)" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-lg font-semibold">Drop your resume here</h2>
        <p className="mt-1 text-sm text-muted-foreground">PDF, DOCX, TXT, or an image (PNG/JPG) — scanned files use OCR</p>
        <input
          ref={inputRef} type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
        <button
          onClick={() => inputRef.current?.click()} disabled={uploading}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-50"
        >
          {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing</> : <><Upload className="h-4 w-4" /> Choose file</>}
        </button>
      </div>

      <div className="mt-12">
        <h2 className="mb-4 font-display text-xl font-semibold">Past analyses</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : analyses.length === 0 ? (
          <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
            No analyses yet — upload your first resume above.
          </div>
        ) : (
          <ul className="space-y-2">
            {analyses.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]"
              >
                <Link to="/analyses/$id" params={{ id: a.id }} className="flex flex-1 items-center gap-3">
                  <div className="rounded-lg bg-secondary p-2 text-primary"><FileText className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{a.file_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                </Link>
                <StatusBadge status={a.status} />
                <button
                  onClick={() => del.mutate(a.id)}
                  className="ml-3 rounded p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: typeof Clock; label: string; cls: string; spin?: boolean }> = {
    processing: { icon: Loader2, label: "Processing", cls: "bg-warning/15 text-warning-foreground", spin: true },
    complete: { icon: CheckCircle2, label: "Complete", cls: "bg-success/15 text-success" },
    failed: { icon: AlertCircle, label: "Failed", cls: "bg-destructive/15 text-destructive" },
  };
  const s = map[status] ?? { icon: Clock, label: status, cls: "bg-secondary text-foreground" };
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      <Icon className={`h-3 w-3 ${s.spin ? "animate-spin" : ""}`} /> {s.label}
    </span>
  );
}
