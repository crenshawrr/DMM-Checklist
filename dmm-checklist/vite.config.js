import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// For GitLab Pages project sites, base should be "/<projectname>/"
const repo = process.env.CI_PROJECT_NAME || "";
const base = process.env.VITE_BASE || (repo ? `/${repo}/` : "/");

export default defineConfig({
  plugins: [react()],
  base,
});
