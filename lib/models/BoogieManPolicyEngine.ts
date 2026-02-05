export class BoogieManPolicyEngine {
 evaluate(input: string): { decision: string; risk_score: number; rule_ids: string[] } {
 if (input.includes("DROP TABLE") || input.includes("share HOME without confirm")) {
 return { decision: "BLOCK", risk_score: 0.98, rule_ids: ["R1_PRIVACY", "R4_SQL_INJECTION"] };
 }
 return { decision: "ALLOW", risk_score: 0.05, rule_ids: [] };
 }
}