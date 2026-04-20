# DREAMengin — File Naming Conventions

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)
> **Documentation Date:** 2026-04-19
> **Status:** Locked spec. Source of truth: [`config/namespaces.json`](../config/namespaces.json)

This document is the human-readable companion to `config/namespaces.json`. It
defines the namespace, file, export, and import conventions for the three
runtime layers in DREAMengin (`engin`, `dreamsurface`, `dream`).

For canonical product / surface / state names, see
[`NAMING_AUTHORITY.md`](./NAMING_AUTHORITY.md). This document only covers the
file/export/import shape.

---

## 1. Namespace Configuration

The single source of truth is [`config/namespaces.json`](../config/namespaces.json):

```json
{
  "namespaces": {
    "engin": ["orchestrator", "agent", "brain", "pipeline", "telemetry", "builder", "upgrader"],
    "dreamsurface": ["core", "daydream", "renderer", "context"],
    "dream": ["cartridge", "module", "panel", "hud", "remote", "scene", "window", "widget", "menu", "bar", "shell", "overlay", "controller"]
  },
  "fallback": "root"
}
```

Any tooling (linters, codemods, generators) MUST read this file rather than
hard-coding the namespace lists.

---

## 2. File Naming Convention

| Layer                 | File Pattern                     | Example                         |
| --------------------- | -------------------------------- | ------------------------------- |
| Engine Logic          | `engin.[engine].ts`              | `engin.gameengin.ts`            |
| Surface Container     | `dreamsurface.[engine].tsx`      | `dreamsurface.gameengin.tsx`    |
| Interactive Component | `dream.[name].tsx`               | `dream.gameengincontroller.tsx` |

**Rules:**

- Use dots to separate the namespace from the specific name.
- All lowercase filenames.
- No slashes, no subfolders. All files flat in root.

---

## 3. Export Naming Convention

| Layer                 | Export Pattern                              | Example                   |
| --------------------- | ------------------------------------------- | ------------------------- |
| Engine Logic          | `Dream[Engine]Runtime`                      | `DreamGameEnginRuntime`   |
| Surface Container     | `Dream[Engine]Surface`                      | `DreamGameEnginSurface`   |
| Interactive Component | `Dream[Name]` or `Dream[Engine]Controller`  | `DreamGameEnginController`|

**Rules:**

- Every exported member must start with `Dream`.
- Use **default export** for the main entity of each file.
- PascalCase for component / class names.

---

## 4. Import Convention

```ts
import DreamGameEnginRuntime from '@/engin.gameengin';
import DreamGameEnginSurface from '@/dreamsurface.gameengin';
import DreamGameEnginController from '@/dream.gameengincontroller';
```

**Rules:**

- Import path is exactly the filename (without extension).
- Use default import for the primary export.

---

## 5. Enforcement

- **Linting:** ESLint rule `import/no-default-export` (or a custom rule) is
  used to enforce the default-export requirement and the `Dream*` prefix.
- **Refactoring script:** A `jscodeshift` codemod (added separately) renames
  files and rewrites imports based on the rules above. The codemod is **not**
  part of this spec and is tracked under tooling.
- **Manual review:** Any file that does not follow the pattern is immediately
  identifiable from its name.

---

This document and `config/namespaces.json` together form the complete naming
policy for the three runtime layers. Use the JSON config as the source of
truth for tooling, and these rules as the human-readable guide.
