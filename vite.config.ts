import { defineConfig, loadEnv, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { handleChatRequest, type AssistantEnv } from "./src/features/assistant/server.js";

/**
 * Serves the site assistant endpoint (POST /api/chat) in `npm run dev` and `npm run preview`
 * with the same handler as the Vercel function. Reads ANTHROPIC_API_KEY from the shell or
 * .env.local; without it the endpoint answers 503 and the widget says the assistant is off.
 */
function siteAssistantApi(env: AssistantEnv): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith("/api/chat")) return next();
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const request = new Request(`http://localhost${req.url}`, {
        method: req.method,
        headers: { "content-type": req.headers["content-type"] ?? "application/json" },
        body: req.method === "POST" ? Buffer.concat(chunks) : undefined,
      });
      handleChatRequest(request, { env })
        .then(async (response) => {
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(await response.text());
        })
        .catch(next);
    });
  };
  return {
    name: "site-assistant-api",
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), "ANTHROPIC_"), ...process.env };
  return {
    plugins: [
      react(),
      tailwindcss(),
      siteAssistantApi({
        ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
        ANTHROPIC_MODEL: env.ANTHROPIC_MODEL,
      }),
    ],
    base: "./",
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  };
});
