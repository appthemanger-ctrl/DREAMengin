# InnerDreams API Build Fix Patch

Fixes the TypeScript error:
  Type error: Property 'text' does not exist on type 'String'.

What this does:
- Replaces `app/api/innerdreams/run/route.ts` so it treats AI responses as a string.
- Adds `lib/ai/router.ts` – a safe local stub `aiChat()` that returns a string (no external keys required).

How to apply:
1) Copy the files into the same paths in your repo.
2) Commit to main and redeploy on Vercel.

Later, when you wire a real AI provider, keep the same function signature:
   export async function aiChat({ messages }): Promise<string>
so the API route continues to compile without changes.
