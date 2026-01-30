import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // IMPORTANT for https://USER.github.io/REPO/
  base: "/DMM-Checklist/",
});
