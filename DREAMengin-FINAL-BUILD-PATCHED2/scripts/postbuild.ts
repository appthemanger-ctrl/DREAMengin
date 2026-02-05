/**
 * Postbuild enforcement.
 *
 * This file exists to match the MVP spec and can be run via a JS shim to avoid
 * requiring ts-node/tsx at build time.
 */
import { assertBuildInvariants } from "../lib/adari";

assertBuildInvariants();
console.log("✅ Adari: build invariants satisfied");
