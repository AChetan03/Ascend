import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  analysisJsonShapePrompt,
  extractJsonFromResponse,
  isLikelyTruncatedJson,
  normalizeAnalysisResult,
} from "@/lib/analysis-schema";

export type { AnalysisResult } from "@/lib/analysis-schema";

// ---- Create ----
export const createAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fileName: string; resumeText: string }) =>
    z.object({ fileName: z.string().min(1), resumeText: z.string().min(50) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("analyses")
      .insert({ user_id: context.userId, file_name: data.fileName, resume_text: data.resumeText, status: "processing" })
      .select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

// ---- Run AI (all agents) ----
export const runAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("analyses").select("id, resume_text, user_id").eq("id", data.id).single();
    if (error || !row) throw new Error("Analysis not found");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI service is not configured");

    const { generateText } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const system = `You are a multi-agent AI career advisor. Your job is to simulate 7 collaborating agents:
Resume Analysis, User Profile, Market Intelligence, Skill Gap Analysis, Learning Recommendation,
Career Strategy, and Roadmap Generation. Produce a comprehensive, structured career report.

Rules:
- Base every field on the resume text provided.
- Market data: use your best current knowledge of tech/career market trends. Cite sources by name
  (LinkedIn, Indeed, Glassdoor, StackOverflow Survey, GitHub Trends, etc.).
- Learning resources: recommend real platforms (Coursera, edX, Udemy, IBM SkillsBuild, Hugging Face,
  YouTube). Provide realistic course titles; URLs optional.
- Roadmap: 8-12 weeks, concrete tasks, 2-4 buildable projects, relevant certifications.
- Scores (0-100): resumeScore = quality/clarity of resume; skillScore = depth of technical skills;
  employabilityScore = overall market readiness.
- Be specific and actionable. No filler.
- Return JSON only. Do not wrap the response in markdown.

${analysisJsonShapePrompt}`;

    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3.5-flash"),
        system,
        prompt: `Analyze this resume and produce the full career report:\n\n${row.resume_text.slice(0, 15000)}`,
      });
      const parsed = extractJsonFromResponse(text);
      if (!parsed) {
        const reason = isLikelyTruncatedJson(text)
          ? "The AI response was truncated. Try uploading a shorter or cleaner resume."
          : "The AI response could not be read as a report. Please try again.";
        await context.supabase.from("analyses").update({ status: "failed", error: reason }).eq("id", data.id);
        return { ok: false, error: reason };
      }
      const output = normalizeAnalysisResult(parsed);

      await context.supabase
        .from("analyses")
        .update({ result: output, status: "complete", error: null })
        .eq("id", data.id);
      return { ok: true };
    } catch (e) {
      const raw = e instanceof Error ? e.message : "AI analysis failed";
      const msg = raw.includes("429")
        ? "The AI service is busy right now. Please try again shortly."
        : raw.includes("402")
          ? "AI credits are exhausted for this workspace."
          : "AI analysis failed. Please try again.";
      await context.supabase.from("analyses").update({ status: "failed", error: msg }).eq("id", data.id);
      return { ok: false, error: msg };
    }
  });

// ---- List ----
export const listAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("analyses")
      .select("id, file_name, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

// ---- Get one ----
export const getAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("analyses").select("*").eq("id", data.id).single();
    if (error || !row) throw new Error("Not found");
    return row;
  });

// ---- Delete ----
export const deleteAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("analyses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
