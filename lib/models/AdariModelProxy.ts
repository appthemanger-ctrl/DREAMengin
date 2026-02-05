export class AdariModelProxy {
    async generatePatch(buggyCode: string): Promise<string> {
        const VLLM_API_URL = "http://localhost:8000/v1/completions";
        const ADARI_MODEL = "ashkanhsn/phi2-python-bugfixer";
        const prompt = `Fix this Python code:\n${buggyCode}\n# Corrected version:`;

        const response = await fetch(VLLM_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: ADARI_MODEL, prompt, max_tokens: 512, temperature: 0.4 })
        });

        const data = await response.json();
        return data.choices?.[0]?.text?.trim() || "[no patch]";
    }
}