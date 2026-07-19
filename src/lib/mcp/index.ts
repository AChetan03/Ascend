import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listAnalysesTool from "./tools/list-analyses";
import getAnalysisTool from "./tools/get-analysis";
import deleteAnalysisTool from "./tools/delete-analysis";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ascend-mcp",
  title: "Ascend — AI Career Advisor",
  version: "0.1.0",
  instructions:
    "Tools for the Ascend AI career advisor. Use `list_analyses` to see the signed-in user's resume analyses, `get_analysis` to fetch the full career report for one analysis, and `delete_analysis` to remove one.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listAnalysesTool, getAnalysisTool, deleteAnalysisTool],
});
