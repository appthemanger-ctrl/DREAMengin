import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("auth update-password page", () => {
  it("exists and updates the recovery session password through Supabase", () => {
    const src = readFileSync(join(process.cwd(), "app/auth/update-password/page.tsx"), "utf-8");

    expect(src).toContain('createClient()');
    expect(src).toContain("supabase.auth.updateUser({ password })");
    expect(src).toContain('router.replace("/login")');
    expect(src).toContain("<PasswordField");
  });
});
