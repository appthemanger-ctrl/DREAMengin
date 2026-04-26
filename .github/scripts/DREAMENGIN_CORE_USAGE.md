# dreamengin_core.py Usage Examples

This document demonstrates how to use the `dreamengin_core.py` shared utilities module.

## Basic Import

```python
#!/usr/bin/env python3
from dreamengin_core import (
    read_text,
    write_text,
    call_openai_simple,
    get_openai_key,
    DREAMENGIN_CONSTRAINTS,
    SICC_PRINCIPLES,
)
```

## Example 1: Simple OpenAI Script

```python
#!/usr/bin/env python3
import sys
from dreamengin_core import (
    call_openai_simple,
    get_openai_key,
    read_text,
    write_json,
    build_constraints_text,
    build_sicc_text,
)

def main():
    # Get API key from environment
    api_key = get_openai_key()

    # Load context
    context = read_text("docs/CONTEXT.md")

    # Build prompt
    system_prompt = f"""You are a DREAMengin AI agent.

{build_constraints_text()}

{build_sicc_text()}"""

    user_prompt = f"""Context:
{context}

Task: Analyze the context and propose improvements."""

    # Call OpenAI
    response = call_openai_simple(
        api_key=api_key,
        model="gpt-4",
        system=system_prompt,
        user=user_prompt,
    )

    # Save result
    write_json("output/analysis.json", {"response": response})
    print("Analysis complete!")

if __name__ == "__main__":
    main()
```

## Example 2: Context Scanner Using ScriptRunner

```python
#!/usr/bin/env python3
from dreamengin_core import (
    ScriptRunner,
    build_context_snapshot,
    write_json,
)

class ContextScanner(ScriptRunner):
    def add_arguments(self, parser):
        parser.add_argument("--out", required=True, help="Output JSON file")
        parser.add_argument("--max-chars", type=int, default=100_000)

    def run(self):
        # Build context snapshot
        snapshot = build_context_snapshot(
            roots=["README.md", "docs", "app", "components"],
            extensions=[".md", ".tsx", ".ts"],
            max_total_chars=self.args.max_chars,
        )

        # Write output
        write_json(self.args.out, snapshot)
        print(f"Scanned {snapshot['files_scanned']} files")
        print(f"Included {snapshot['entries_included']} entries")

if __name__ == "__main__":
    scanner = ContextScanner("Scan DREAMengin codebase for context")
    scanner.main()
```

## Example 3: Refactoring Existing Scripts

### Before (duplicated code):

```python
# Old ai_propose.py
import json
import os
import urllib.request

def call_openai(api_key, model, system, user, max_tokens=4096):
    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    # ... error handling ...
```

### After (using dreamengin_core):

```python
# New ai_propose.py
from dreamengin_core import call_openai_simple, get_openai_key

api_key = get_openai_key()
response = call_openai_simple(api_key, model, system_prompt, user_prompt)
```

## Available Functions

### File I/O
- `mkdir_p(path)` - Create directories recursively
- `read_text(path)` - Read text file (returns "" if not found)
- `write_text(path, content)` - Write text file (creates parent dirs)
- `read_text_limited(path, max_chars)` - Read up to N characters

### JSON/YAML
- `load_json(path)` - Load JSON (returns {} on error)
- `write_json(path, data)` - Write JSON with proper formatting
- `load_yaml(path)` - Load YAML (requires PyYAML)

### OpenAI API
- `call_openai(api_key, model, messages, ...)` - Full API call
- `call_openai_simple(api_key, model, system, user)` - Simplified call

### Context Processing
- `collect_files(roots, extensions)` - Find files matching patterns
- `build_context_snapshot(roots, extensions)` - Build repo snapshot

### Helpers
- `get_openai_key()` - Get API key from env or exit
- `get_env_or_fail(var_name)` - Get env var or exit
- `is_truthy(value)` - Check if config value is truthy
- `build_constraints_text()` - Format constraints for prompts
- `build_sicc_text()` - Format SICC principles for prompts

### Constants
- `DREAMENGIN_CONSTRAINTS` - Tech stack, architecture, policies
- `SICC_PRINCIPLES` - Immersion and clarity principles
- `DEFAULT_MAX_TOKENS` - Default OpenAI max tokens (16,384)
- `DEFAULT_TIMEOUT` - Default request timeout (180s)

## Migration Guide

To migrate existing scripts to use `dreamengin_core`:

1. **Identify duplicated functions** in your script (file I/O, OpenAI calls, etc.)
2. **Import from dreamengin_core** instead of defining locally
3. **Remove local implementations** of functions now in core
4. **Update function calls** to match core API (may need parameter changes)
5. **Test** to ensure functionality is preserved

## Best Practices

1. **Always use core utilities** for common operations to maintain consistency
2. **Don't modify core module** without coordinating with other script maintainers
3. **Add new shared utilities to core** rather than duplicating in multiple scripts
4. **Follow stdlib-only policy** - no external dependencies in core
5. **Document module additions** in this file when extending core functionality
