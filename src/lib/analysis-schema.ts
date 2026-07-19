import { z } from "zod";

const ResourceSchema = z.object({
  platform: z.string(),
  title: z.string(),
  type: z.string(),
  url: z.string().optional(),
});

export const AnalysisResultSchema = z.object({
  profile: z.object({
    name: z.string().optional(),
    headline: z.string(),
    summary: z.string(),
    education: z.array(z.object({ degree: z.string(), institution: z.string(), year: z.string().optional() })),
    interests: z.array(z.string()),
    careerGoals: z.array(z.string()),
  }),
  resumeAnalysis: z.object({
    skills: z.array(z.string()),
    experience: z.array(z.object({
      title: z.string(),
      company: z.string(),
      duration: z.string().optional(),
      highlights: z.array(z.string()),
    })),
    certifications: z.array(z.string()),
  }),
  marketIntelligence: z.object({
    trendingRoles: z.array(z.string()),
    inDemandSkills: z.array(z.string()),
    salaryRanges: z.array(z.object({
      role: z.string(),
      min: z.number(),
      max: z.number(),
      currency: z.string(),
      region: z.string().optional(),
    })),
    sources: z.array(z.string()),
  }),
  skillGap: z.object({
    missingSkills: z.array(z.object({
      name: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      reason: z.string(),
    })),
    employabilityScore: z.number(),
    resumeScore: z.number(),
    skillScore: z.number(),
  }),
  learningRecommendations: z.array(z.object({
    skill: z.string(),
    resources: z.array(ResourceSchema),
  })),
  careerStrategy: z.object({
    targetRoles: z.array(z.string()),
    prioritizedSkills: z.array(z.string()),
    salaryPrediction: z.string(),
    internshipReadiness: z.string(),
  }),
  roadmap: z.object({
    weeks: z.array(z.object({
      week: z.number(),
      focus: z.string(),
      tasks: z.array(z.string()),
      projects: z.array(z.string()),
      certifications: z.array(z.string()),
    })),
    interviewPrep: z.array(z.string()),
  }),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const analysisJsonShapePrompt = `Return one valid JSON object with this exact top-level shape and no markdown:
{
  "profile": {
    "name": "string or empty string",
    "headline": "string",
    "summary": "string",
    "education": [{ "degree": "string", "institution": "string", "year": "string or empty string" }],
    "interests": ["string"],
    "careerGoals": ["string"]
  },
  "resumeAnalysis": {
    "skills": ["string"],
    "experience": [{ "title": "string", "company": "string", "duration": "string or empty string", "highlights": ["string"] }],
    "certifications": ["string"]
  },
  "marketIntelligence": {
    "trendingRoles": ["string"],
    "inDemandSkills": ["string"],
    "salaryRanges": [{ "role": "string", "min": 0, "max": 0, "currency": "string", "region": "string or empty string" }],
    "sources": ["string"]
  },
  "skillGap": {
    "missingSkills": [{ "name": "string", "priority": "high|medium|low", "reason": "string" }],
    "employabilityScore": 0,
    "resumeScore": 0,
    "skillScore": 0
  },
  "learningRecommendations": [{ "skill": "string", "resources": [{ "platform": "string", "title": "string", "type": "string", "url": "string or empty string" }] }],
  "careerStrategy": {
    "targetRoles": ["string"],
    "prioritizedSkills": ["string"],
    "salaryPrediction": "string",
    "internshipReadiness": "string"
  },
  "roadmap": {
    "weeks": [{ "week": 1, "focus": "string", "tasks": ["string"], "projects": ["string"], "certifications": ["string"] }],
    "interviewPrep": ["string"]
  }
}`;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function record(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function stringValue(value: unknown, fallback = "Not specified") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function optionalString(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function stringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;
  const items = value.map((item) => optionalString(item)).filter((item): item is string => Boolean(item));
  return items.length ? items : fallback;
}

function objectArray(value: unknown) {
  return Array.isArray(value) ? value.map(record) : [];
}

function numberValue(value: unknown, fallback = 0) {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function score(value: unknown, fallback = 50) {
  return Math.max(0, Math.min(100, Math.round(numberValue(value, fallback))));
}

function priority(value: unknown): "high" | "medium" | "low" {
  const text = stringValue(value, "medium").toLowerCase();
  if (text.includes("high")) return "high";
  if (text.includes("low")) return "low";
  return "medium";
}

function resources(value: unknown) {
  return objectArray(value).map((resource) => ({
    platform: stringValue(resource.platform, "Learning platform"),
    title: stringValue(resource.title, "Recommended learning resource"),
    type: stringValue(resource.type, "course"),
    url: optionalString(resource.url),
  }));
}

export function normalizeAnalysisResult(input: unknown): AnalysisResult {
  const root = record(input);
  const profile = record(root.profile);
  const resumeAnalysis = record(root.resumeAnalysis);
  const marketIntelligence = record(root.marketIntelligence);
  const skillGap = record(root.skillGap);
  const careerStrategy = record(root.careerStrategy);
  const roadmap = record(root.roadmap);

  const normalized: AnalysisResult = {
    profile: {
      name: optionalString(profile.name),
      headline: stringValue(profile.headline, "Career readiness report"),
      summary: stringValue(profile.summary, "A personalized career plan based on the uploaded resume."),
      education: objectArray(profile.education).map((item) => ({
        degree: stringValue(item.degree, "Education"),
        institution: stringValue(item.institution, "Institution not specified"),
        year: optionalString(item.year),
      })),
      interests: stringArray(profile.interests, ["Career growth"]),
      careerGoals: stringArray(profile.careerGoals, ["Improve employability"]),
    },
    resumeAnalysis: {
      skills: stringArray(resumeAnalysis.skills, ["Resume review needed"]),
      experience: objectArray(resumeAnalysis.experience).map((item) => ({
        title: stringValue(item.title, "Experience"),
        company: stringValue(item.company, "Organization not specified"),
        duration: optionalString(item.duration),
        highlights: stringArray(item.highlights, ["Clarify responsibilities and measurable results."]),
      })),
      certifications: stringArray(resumeAnalysis.certifications),
    },
    marketIntelligence: {
      trendingRoles: stringArray(marketIntelligence.trendingRoles, ["Entry-level role aligned with resume"]),
      inDemandSkills: stringArray(marketIntelligence.inDemandSkills, ["Communication", "Problem solving"]),
      salaryRanges: objectArray(marketIntelligence.salaryRanges).map((item) => ({
        role: stringValue(item.role, "Target role"),
        min: numberValue(item.min),
        max: numberValue(item.max),
        currency: stringValue(item.currency, "USD"),
        region: optionalString(item.region),
      })),
      sources: stringArray(marketIntelligence.sources, ["LinkedIn", "Indeed", "Glassdoor"]),
    },
    skillGap: {
      missingSkills: objectArray(skillGap.missingSkills).map((item) => ({
        name: stringValue(item.name, "Skill to improve"),
        priority: priority(item.priority),
        reason: stringValue(item.reason, "This skill improves readiness for target roles."),
      })),
      employabilityScore: score(skillGap.employabilityScore),
      resumeScore: score(skillGap.resumeScore),
      skillScore: score(skillGap.skillScore),
    },
    learningRecommendations: objectArray(root.learningRecommendations).map((item) => ({
      skill: stringValue(item.skill, "Priority skill"),
      resources: resources(item.resources),
    })),
    careerStrategy: {
      targetRoles: stringArray(careerStrategy.targetRoles, ["Role aligned with resume"]),
      prioritizedSkills: stringArray(careerStrategy.prioritizedSkills, ["Resume improvement"]),
      salaryPrediction: stringValue(careerStrategy.salaryPrediction, "Salary depends on role, region, and demonstrated experience."),
      internshipReadiness: stringValue(careerStrategy.internshipReadiness, "Build portfolio proof and tailor applications before applying."),
    },
    roadmap: {
      weeks: objectArray(roadmap.weeks).map((item, index) => ({
        week: Math.max(1, Math.round(numberValue(item.week, index + 1))),
        focus: stringValue(item.focus, "Career preparation"),
        tasks: stringArray(item.tasks, ["Update resume and practice interview responses."]),
        projects: stringArray(item.projects),
        certifications: stringArray(item.certifications),
      })),
      interviewPrep: stringArray(roadmap.interviewPrep, ["Prepare concise answers using the STAR method."]),
    },
  };

  return AnalysisResultSchema.parse(normalized);
}

export function extractJsonFromResponse(response: string): unknown | null {
  const withoutFences = response
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const start = withoutFences.search(/[\[{]/);
  if (start === -1) return null;

  const opener = withoutFences[start];
  const closer = opener === "[" ? "]" : "}";
  const end = withoutFences.lastIndexOf(closer);
  if (end === -1 || end <= start) return null;

  const json = withoutFences.slice(start, end + 1);
  try {
    return JSON.parse(json);
  } catch {
    try {
      return JSON.parse(json.replace(/,\s*([}\]])/g, "$1").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ""));
    } catch {
      return null;
    }
  }
}

export function isLikelyTruncatedJson(response: string) {
  const text = response.trim();
  const opens = (text.match(/{/g) ?? []).length + (text.match(/\[/g) ?? []).length;
  const closes = (text.match(/}/g) ?? []).length + (text.match(/]/g) ?? []).length;
  return opens !== closes || /(?:\.\.\.|…|\[truncated\])$/i.test(text);
}