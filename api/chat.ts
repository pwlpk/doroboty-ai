/**
 * Vercel serverless function behind the site assistant widget (POST /api/chat).
 * Set ANTHROPIC_API_KEY (and optionally ANTHROPIC_MODEL) in the Vercel project environment.
 */
import { handleChatRequest } from "../src/features/assistant/server.js";

export function POST(request: Request): Promise<Response> {
  return handleChatRequest(request, { env: process.env });
}

export function GET(request: Request): Promise<Response> {
  return handleChatRequest(request, { env: process.env });
}
