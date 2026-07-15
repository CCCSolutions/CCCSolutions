// website/open-next.config.ts
import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    runtime: "edge",
  },

  middleware: {
    external: true,
  },
};

export default config;