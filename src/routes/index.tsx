import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Target, TrendingUp, GraduationCap, FileText, Rocket } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Ascend — AI Career Advisor" },
      { name: "description", content: "Upload your resume and get an AI-powered career roadmap in under a minute: skill gaps, in-demand roles, learning plan, and interview prep." },
      { property: "og:title", content: "Ascend — AI Career Advisor" },
      { property: "og:description", content: "Upload your resume and get an AI-powered career roadmap: skill gaps, market insights, learning plan, and interview prep." },
      { property: "og:url", content: "https://ascendwithai.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://ascendwithai.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Ascend",
          url: "https://ascendwithai.lovable.app/",
          description: "AI-powered career advisor that turns your resume into a personalized career roadmap.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Ascend",
          url: "https://ascendwithai.lovable.app/",
          logo: "https://ascendwithai.lovable.app/favicon.ico",
          description: "AI career intelligence platform. Seven collaborating agents analyze your resume and produce a week-by-week career plan.",
        }),
      },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-start gap-2 font-display text-lg font-bold text-primary leading-none">
            <Sparkles className="h-5 w-5 text-accent" />
            <div className="flex flex-col items-end">
              <span>Ascend</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">by Compound Z</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link
              to="/auth"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
      <section
        className="relative overflow-hidden text-primary-foreground"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3 w-3 text-accent" /> AI-powered career intelligence
          </div>
          <h1 className="font-display text-5xl font-bold leading-tight md:text-6xl">
            Your resume, decoded.<br />
            <span className="text-accent">Your career, mapped.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
            Upload your resume and get a personalized career roadmap in under a minute — skill gaps,
            in-demand roles, learning plan, and interview prep, all in one dashboard.
          </p>
          <Link
            to="/auth"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-[var(--shadow-glow)] transition hover:scale-105"
          >
            <Rocket className="h-4 w-4" /> Analyze my resume
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center font-display text-3xl font-bold">Seven AI agents working for you</h2>
        <p className="mt-2 text-center text-muted-foreground">Each agent focuses on one part of your career journey.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: FileText, title: "Resume Analysis", desc: "Extracts skills, experience & certifications from your resume." },
            { icon: Target, title: "Profile Builder", desc: "Structures your education, interests, and career goals." },
            { icon: TrendingUp, title: "Market Intelligence", desc: "Surfaces trending roles, in-demand skills, and salary bands." },
            { icon: Sparkles, title: "Skill Gap Analysis", desc: "Compares you against the market and scores employability." },
            { icon: GraduationCap, title: "Learning Recommendations", desc: "Curated courses from Coursera, edX, Udemy and more." },
            { icon: Rocket, title: "Career Roadmap", desc: "Week-by-week plan with projects, certs, and interview prep." },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border p-6 shadow-[var(--shadow-soft)]"
              style={{ backgroundImage: "var(--gradient-card)" }}
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Built with Ascend AI · Career intelligence for the next generation
      </footer>
    </div>
  );
}
