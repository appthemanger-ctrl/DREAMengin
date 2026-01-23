# Patch: Next 16 Route Handler params fix

**What this fixes**
- On Next.js 16.1.x, route handlers must type `context.params` as a **Promise** and you need to `await` it.
- Your build error complained that `POST` expected `{ params: Promise<{ id: string }> }` but your file used `{ params: { id: string } }`.

**What to do**
1. Replace your file at `app/shop/buy/[id]/route.ts` with the one in this patch.
2. Commit & push. Build should pass this type check.

If you later want to add logic, keep the signature:
```ts
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
  const { id } = await params;
  // ... your code
}
```
