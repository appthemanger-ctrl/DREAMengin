# Vercel Alias + Missing Modules Hotfix

Drop these files into **the ROOT of your repo** (merge folders). They will:
- Provide a **tsconfig.json** that maps `@/*` → project root (so `@/lib/...` works)
- Provide **lib/supabase/client.ts** and **lib/supabase/server.ts** (safe, no secrets)
- Provide **components/DraggableModules.tsx** and **components/AudioPlayer.tsx** as placeholders

## If alias still fails on Vercel, use these RELATIVE imports temporarily

Edit these files and change the imports as shown:

### app/login/page.tsx
```diff
- import { supa } from '@/lib/supabase/client';
+ import { supa } from '../../lib/supabase/client';
```

### app/home/add/page.tsx
```diff
- import { supa } from '@/lib/supabase/client';
+ import { supa } from '../../../lib/supabase/client';
```

### app/home/page.tsx
```diff
- import DraggableModules from '@/components/DraggableModules';
- import { supa } from '@/lib/supabase/client';
+ import DraggableModules from '../../components/DraggableModules';
+ import { supa } from '../../lib/supabase/client';
```

### app/music/page.tsx
```diff
- import { supaServer } from '@/lib/supabase/server';
- import AudioPlayer from '@/components/AudioPlayer';
+ import { supaServer } from '../../lib/supabase/server';
+ import AudioPlayer from '../../components/AudioPlayer';
```

After editing:
1) Commit and push
2) Re-deploy on Vercel
3) Once the deployment succeeds, we can keep the alias (tsconfig.json) and switch your imports back to `@/...`.
