# AI System Quick Start Guide

## Prerequisites

1. **Database Setup:**
```bash
# Run the AI system migration
supabase migration up 20260210000001_ai_system_v2026
```

2. **Environment Variables:**
```bash
# Add to .env.local
AI_CONFIRM_SECRET=your-secret-key-here-change-in-production
```

3. **Create an Admin User:**
```sql
-- In Supabase SQL Editor
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'your-admin@email.com';
```

## Using Dr. Eams (User Agent)

### Example: Simple Search
```typescript
const response = await fetch('/api/dr-eams/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "search for javascript tutorials",
    ui: {
      route: "/home",
      nav: {
        home_anchor_state: 0,
        surface: "HOME_DREAMS",
        cube: { face: 0, slot: 0 },
        overlay: "NONE",
        gesture_chain: { len: 0, t: new Date().toISOString() }
      }
    }
  })
});

const data = await response.json();
// data.response_text: AI response
// data.proposed_intents: Array of validated intents
// data.boogie_decisions: Security decisions
// data.confirm_token: If confirmation needed
```

### Example: Execute Allowed Intents
```typescript
// After getting ALLOW intents from /run
const executeResponse = await fetch('/api/ai/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    request_id: data.request_id, // From previous response
    intent_ids: data.proposed_intents.map(i => i.intent_id),
    ui: { /* same UI context */ }
  })
});

const results = await executeResponse.json();
// results.tool_results: Results from each intent
// results.ui_deltas: UI changes to apply
```

### Example: Two-Phase Commit (CONFIRM intents)
```typescript
// Step 1: Get CONFIRM intent
const runResponse = await fetch('/api/dr-eams/run', {
  method: 'POST',
  body: JSON.stringify({
    message: "delete my dream",
    ui: { /* ... */ }
  })
});

const runData = await runResponse.json();

// If confirm_token is present, user must confirm
if (runData.confirm_token) {
  // Show confirmation UI to user
  const userConfirmed = await showConfirmDialog(
    "This action requires confirmation. Proceed?"
  );

  if (userConfirmed) {
    // Step 2: Execute with confirm token
    const execResponse = await fetch('/api/ai/execute', {
      method: 'POST',
      body: JSON.stringify({
        request_id: runData.request_id,
        intent_ids: runData.proposed_intents.map(i => i.intent_id),
        confirm_token: runData.confirm_token,
        ui: { /* ... */ }
      })
    });
  }
}
```

## Using iDari (Admin Agent)

### Example: Schema Diagnostic
```typescript
// Only works for admin users
const response = await fetch('/api/innerdreams/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "check database schema",
    ui: {
      route: "/admin/diagnostics",
      nav: { /* ... */ }
    }
  })
});

const data = await response.json();
// data.proposed_intents: Diagnostic intents
// Note: Diagnostic handlers not yet implemented
```

## Intent Types Reference

### Dr. Eams Intents (User)
- `NAV_DELTA` - Navigate to different route/state
- `HOME_ANCHOR_SET_STATE` - Change home anchor state (0|1|2)
- `HOME_MENU_OPEN` - Open home menu overlay
- `DREAM_PREVIEW` - Preview a dream widget
- `DREAM_OPEN` - Open a dream widget
- `DREAM_CONFIG_PATCH` - Update dream configuration
- `DREAM_REORDER` - Reorder dreams
- `DREAM_ADD_FROM_PRESET` - Add new dream from preset
- `DREAM_REMOVE` - Delete a dream (requires confirmation)
- `POST_CREATE` - Create a post
- `POST_LIKE` - Like a post
- `FOLLOW_USER` - Follow another user
- `SEARCH` - Search for content
- `DRAFT_SAVE` - Save a draft

### iDari Intents (Admin Only)
- `DIAG_SCHEMA_SNAPSHOT` - Database schema inspection
- `DIAG_RLS_SNAPSHOT` - RLS policy verification
- `DIAG_CODE_REFERENCE_SCAN` - Code reference scanner
- `DIAG_ENV_CHECKLIST` - Environment config check
- `ADMIN_PATCH_PROPOSAL` - Propose code patch (diff only)
- `ADMIN_MIGRATION_PROPOSAL` - Propose SQL migration
- `MODERATION_FLAG_CONTENT` - Flag content for moderation

## Rate Limits

- `/api/dr-eams/run`: 30 requests/minute
- `/api/innerdreams/run`: 20 requests/minute
- `/api/ai/execute`: 60 requests/minute

Rate limits are per-user and reset every minute.

## Error Codes

### Common Errors
- `BAD_JSON` - Request body is not valid JSON
- `MISSING_MESSAGE` - No message provided
- `MISSING_UI` - No UI context provided
- `NOT_AUTHENTICATED` - User not signed in
- `RATE_LIMIT` - Too many requests
- `FORBIDDEN` - Admin access required (iDari only)
- `BLOCKED` - Boogie Man blocked the request
- `INVALID_CONFIRM_TOKEN` - Confirm token expired or invalid
- `INTENTS_NOT_FOUND` - Intents not in cache
- `ALREADY_EXECUTED` - Intent already executed (idempotency)

## Boogie Man Decisions

### ALLOW
- Intent is safe, execute immediately
- No user confirmation needed

### CONFIRM
- Intent is risky (risk score 6-9)
- Requires user confirmation via two-phase commit
- Confirm token valid for 5 minutes

### DENY
- Intent is too risky (risk score ≥ 10)
- Blocked by policy
- Not in allowlist
- Admin-only intent from user
- Secret detected in payload

### MODIFY
- Reserved for future use
- Would allow Boogie to rewrite intent payload

## Security Best Practices

1. **Never trust client-provided user IDs** - Server derives from auth token
2. **Always include UI context** - Required for verification
3. **Handle DENY gracefully** - Show helpful error to user
4. **Implement confirmation UI** - For CONFIRM intents
5. **Log client-side errors** - For debugging AI interactions
6. **Don't retry on DENY** - Wait for cooldown period
7. **Validate responses** - Use Zod schemas client-side too

## Debugging

### Check Audit Logs
```sql
-- Recent AI operations
SELECT * FROM ai_audit_log 
ORDER BY created_at DESC 
LIMIT 50;

-- Failed operations
SELECT * FROM ai_audit_log 
WHERE ok = false 
ORDER BY created_at DESC;

-- High risk scores
SELECT * FROM ai_audit_log 
WHERE risk_score >= 6 
ORDER BY created_at DESC;
```

### Check Rate Limits
```sql
-- Current rate limit status
SELECT * FROM ai_rate_limits 
WHERE user_id = 'your-user-id' 
ORDER BY window_start DESC;
```

### Check Intent Cache
```sql
-- Pending intents
SELECT * FROM intent_cache 
WHERE executed = false 
AND expires_at > now();
```

## Next Steps

1. **Replace Placeholder Planners**: Integrate OpenAI/Claude for real AI
2. **Add Tests**: Unit tests for handlers, integration tests for flows
3. **Implement Admin Handlers**: Diagnostic tools for iDari
4. **Monitor in Production**: Set up alerts on DENY decisions
5. **Tune Risk Weights**: Adjust based on false positives

## Support

For implementation details, see `AI_SYSTEM_IMPLEMENTATION.md`.

For architecture spec, see the original problem statement.
