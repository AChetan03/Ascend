import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import {
  ArrowLeft, Loader2, AlertCircle, Award, Briefcase, GraduationCap, Target,
  TrendingUp, BookOpen, Map, Sparkles, ExternalLink, CheckCircle2,
} from "lucide-react";
import { getAnalysis, type AnalysisResult } from "@/lib/analyses.functions";
import { normalizeAnalysisResult } from "@/lib/analysis-schema";

export const Route = createFileRoute("/_authenticated/analyses/$id")({
  component: AnalysisView,
  head: ({ params }) => ({
    meta: [
      { title: "Career Report — Ascend" },
      { name: "description", content: "Your personalized AI career report: resume analysis, skill gaps, market insights, learning plan, and week-by-week roadmap." },
      { property: "og:title", content: "Career Report — Ascend" },
      { property: "og:description", content: "AI-generated career report with skill gaps, market insights, and a week-by-week roadmap." },
      { property: "og:url", content: `https://ascendwithai.lovable.app/analyses/${params.id}` },
      { property: "og:type", content: "article" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: `https://ascendwithai.lovable.app/analyses/${params.id}` }],
  }),
});

function AnalysisView() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getAnalysis);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => getFn({ data: { id } }),
    refetchInterval: (q) => (q.state.data?.status === "processing" ? 3000 : false),
  });

  useEffect(() => { refetch(); }, [id, refetch]);

  if (isLoading || !data) return <Center><Loader2 className="h-6 w-6 animate-spin text-primary" /></Center>;

  if (data.status === "processing") {
    return (
      <Center>
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <h2 className="mt-4 font-display text-xl font-bold">Analyzing your resume</h2>
          <p className="mt-1 text-sm text-muted-foreground">Seven agents are at work — this usually takes 20-40 seconds.</p>
        </div>
      </Center>
    );
  }

  if (data.status === "failed") {
    return (
      <Center>
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-4 font-display text-xl font-bold">Analysis failed</h2>
          <p className="mt-1 text-sm text-muted-foreground">{data.error ?? "Something went wrong."}</p>
          <Link to="/dashboard" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to dashboard</Link>
        </div>
      </Center>
    );
  }

  const r = normalizeAnalysisResult(data.result) as AnalysisResult;
  return <ReportView result={r} fileName={data.file_name} />;
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[60vh] items-center justify-center px-6">{children}</div>;
}

function ReportView({ result, fileName }: { result: AnalysisResult; fileName: string }) {
  const { profile, resumeAnalysis, marketIntelligence, skillGap, learningRecommendations, careerStrategy, roadmap } = result;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      {/* Hero */}
      <div
        className="rounded-2xl p-8 text-primary-foreground shadow-[var(--shadow-glow)]"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <p className="text-sm text-white/70">{fileName}</p>
        <h1 className="mt-1 font-display text-3xl font-bold">{profile.name ?? "Your career report"}</h1>
        <p className="mt-1 text-lg text-accent">{profile.headline}</p>
        <p className="mt-3 max-w-3xl text-sm text-white/85">{profile.summary}</p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <ScoreCard label="Employability" value={skillGap.employabilityScore} />
          <ScoreCard label="Resume score" value={skillGap.resumeScore} />
          <ScoreCard label="Skill score" value={skillGap.skillScore} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Section icon={Target} title="Profile">
          <SubTitle>Education</SubTitle>
          <ul className="space-y-1 text-sm">
            {profile.education.map((e, i) => (
              <li key={i}>• <span className="font-medium">{e.degree}</span> — {e.institution}{e.year ? ` (${e.year})` : ""}</li>
            ))}
          </ul>
          <SubTitle className="mt-4">Career goals</SubTitle>
          <Chips items={profile.careerGoals} />
          <SubTitle className="mt-4">Interests</SubTitle>
          <Chips items={profile.interests} />
        </Section>

        <Section icon={Briefcase} title="Resume analysis">
          <SubTitle>Skills</SubTitle>
          <Chips items={resumeAnalysis.skills} />
          <SubTitle className="mt-4">Experience</SubTitle>
          <ul className="space-y-3 text-sm">
            {resumeAnalysis.experience.map((x, i) => (
              <li key={i}>
                <div className="font-medium">{x.title} · {x.company}</div>
                {x.duration && <div className="text-xs text-muted-foreground">{x.duration}</div>}
                <ul className="mt-1 ml-4 list-disc text-muted-foreground">
                  {x.highlights.map((h, j) => <li key={j}>{h}</li>)}
                </ul>
              </li>
            ))}
          </ul>
          {resumeAnalysis.certifications.length > 0 && (<>
            <SubTitle className="mt-4">Certifications</SubTitle>
            <Chips items={resumeAnalysis.certifications} />
          </>)}
        </Section>

        <Section icon={TrendingUp} title="Market intelligence">
          <SubTitle>Trending roles</SubTitle>
          <Chips items={marketIntelligence.trendingRoles} tone="accent" />
          <SubTitle className="mt-4">In-demand skills</SubTitle>
          <Chips items={marketIntelligence.inDemandSkills} />
          <SubTitle className="mt-4">Salary ranges</SubTitle>
          <ul className="space-y-1 text-sm">
            {marketIntelligence.salaryRanges.map((s, i) => (
              <li key={i} className="flex justify-between">
                <span>{s.role}{s.region ? ` · ${s.region}` : ""}</span>
                <span className="font-medium">{s.currency} {s.min.toLocaleString()}–{s.max.toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Sources: {marketIntelligence.sources.join(", ")}</p>
        </Section>

        <Section icon={Sparkles} title="Skill gap analysis">
          <SubTitle>Missing skills</SubTitle>
          <ul className="space-y-2">
            {skillGap.missingSkills.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <PriorityDot p={s.priority} />
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.reason}</div>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={BookOpen} title="Learning recommendations" wide>
          <div className="grid gap-4 sm:grid-cols-2">
            {learningRecommendations.map((rec, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="font-medium">{rec.skill}</div>
                <ul className="mt-2 space-y-1 text-sm">
                  {rec.resources.map((res, j) => {
                    const platformUrl = derivePlatformUrl(res);
                    return (
                      <li key={j} className="flex items-start gap-2">
                        {platformUrl ? (
                          <a
                            href={platformUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline"
                          >
                            {res.platform} <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="mt-0.5 text-xs text-muted-foreground">{res.platform}</span>
                        )}
                        {res.url ? (
                          <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                            {res.title} <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span>{res.title}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-4">
            <div className="font-semibold">FreeCodeCamp</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Learn HTML, CSS, JavaScript, React, Backend Development, Python, SQL, and earn free certifications.
            </p>
            <a
              href="https://www.freecodecamp.org/"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Start Learning <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </Section>

        <Section icon={Award} title="Career strategy" wide>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <SubTitle>Target roles</SubTitle>
              <Chips items={careerStrategy.targetRoles} tone="accent" />
              <SubTitle className="mt-4">Prioritized skills</SubTitle>
              <Chips items={careerStrategy.prioritizedSkills} />
            </div>
            <div>
              <SubTitle>Salary prediction</SubTitle>
              <p className="text-sm">{careerStrategy.salaryPrediction}</p>
              <SubTitle className="mt-4">Internship readiness</SubTitle>
              <p className="text-sm">{careerStrategy.internshipReadiness}</p>
            </div>
          </div>
        </Section>

        <Section icon={Map} title="Roadmap" wide>
          <div className="space-y-3">
            {roadmap.weeks.map((w, i) => (
              <details key={i} className="rounded-lg border border-border p-3 open:bg-secondary/40">
                <summary className="cursor-pointer text-sm">
                  <span className="font-semibold text-primary">Week {w.week}</span> — {w.focus}
                </summary>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Tasks</div>
                    <ul className="space-y-1">{w.tasks.map((t, k) => <li key={k} className="flex gap-1.5"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />{t}</li>)}</ul>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Projects</div>
                    <ul className="space-y-1">{w.projects.map((t, k) => <li key={k}>• {t}</li>)}</ul>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Certifications</div>
                    <ul className="space-y-1">{w.certifications.map((t, k) => <li key={k}>• {t}</li>)}</ul>
                  </div>
                </div>
              </details>
            ))}
          </div>
          <SubTitle className="mt-6">Interview prep</SubTitle>
          <ul className="space-y-1 text-sm">
            {roadmap.interviewPrep.map((t, i) => <li key={i} className="flex gap-1.5"><GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{t}</li>)}
          </ul>
        </Section>
      </div>
    </main>
  );
}

// --- primitives ---
function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <div className="text-xs uppercase text-white/60">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold">{value}<span className="text-lg text-white/60">/100</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div className="h-full bg-accent" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children, wide }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <section
      className={`${wide ? "lg:col-span-2" : ""} rounded-2xl border border-border p-6 shadow-[var(--shadow-soft)]`}
      style={{ backgroundImage: "var(--gradient-card)" }}
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-md bg-primary/10 p-1.5 text-primary"><Icon className="h-4 w-4" /></div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SubTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${className}`}>{children}</div>;
}

function Chips({ items, tone = "default" }: { items: string[]; tone?: "default" | "accent" }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <span
          key={i}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone === "accent" ? "bg-accent/20 text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}
        >
          {it}
        </span>
      ))}
    </div>
  );
}

function PriorityDot({ p }: { p: "high" | "medium" | "low" }) {
  const c = p === "high" ? "bg-destructive" : p === "medium" ? "bg-warning" : "bg-muted-foreground";
  return <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${c}`} />;
}

function derivePlatformUrl(res: { platform: string; url?: string }): string | undefined {
  if (res.url) {
    try {
      return new URL(res.url).origin;
    } catch {
      // fall through to known-platform mapping
    }
  }
  const map: Record<string, string> = {
    coursera: "https://www.coursera.org",
    "coursera.org": "https://www.coursera.org",
    edx: "https://www.edx.org",
    "edx.org": "https://www.edx.org",
    udemy: "https://www.udemy.com",
    "udemy.com": "https://www.udemy.com",
    "ibm skillsbuild": "https://skillsbuild.org",
    "ibm skillsbuild.org": "https://skillsbuild.org",
    "hugging face": "https://huggingface.co",
    "huggingface.co": "https://huggingface.co",
    youtube: "https://www.youtube.com",
    "youtube.com": "https://www.youtube.com",
    linkedin: "https://www.linkedin.com/learning",
    "linkedin learning": "https://www.linkedin.com/learning",
    "linkedin.com/learning": "https://www.linkedin.com/learning",
    freecodecamp: "https://www.freecodecamp.org",
    "freecodecamp.org": "https://www.freecodecamp.org",
    "google cloud": "https://cloud.google.com/learn",
    "cloud.google.com/learn": "https://cloud.google.com/learn",
    "aws training": "https://aws.amazon.com/training",
    "aws.amazon.com/training": "https://aws.amazon.com/training",
    "microsoft learn": "https://learn.microsoft.com",
    "learn.microsoft.com": "https://learn.microsoft.com",
    "khan academy": "https://www.khanacademy.org",
    "khanacademy.org": "https://www.khanacademy.org",
    "mit opencourseware": "https://ocw.mit.edu",
    "ocw.mit.edu": "https://ocw.mit.edu",
    "stanford online": "https://online.stanford.edu",
    "online.stanford.edu": "https://online.stanford.edu",
    "harvard online": "https://online.harvard.edu",
    "online.harvard.edu": "https://online.harvard.edu",
    pluralsight: "https://www.pluralsight.com",
    "pluralsight.com": "https://www.pluralsight.com",
    skillshare: "https://www.skillshare.com",
    "skillshare.com": "https://www.skillshare.com",
    codecademy: "https://www.codecademy.com",
    "codecademy.com": "https://www.codecademy.com",
    datacamp: "https://www.datacamp.com",
    "datacamp.com": "https://www.datacamp.com",
    udacity: "https://www.udacity.com",
    "udacity.com": "https://www.udacity.com",
    brilliant: "https://brilliant.org",
    "brilliant.org": "https://brilliant.org",
    "frontend masters": "https://frontendmasters.com",
    "frontendmasters.com": "https://frontendmasters.com",
    "zero to mastery": "https://zerotomastery.io",
    "zerotomastery.io": "https://zerotomastery.io",
    "the odin project": "https://www.theodinproject.com",
    "theodinproject.com": "https://www.theodinproject.com",
  };
  return map[res.platform.toLowerCase().trim()];
}
