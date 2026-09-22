import path from "node:path"
import { defineConfig } from "vitest/config"
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    include: [
      "src/lib/desktop-onboarding.test.ts",
      "src/lib/job-allowance.test.ts",
      "src/lib/subscription.test.ts",
    ],
  },
})
