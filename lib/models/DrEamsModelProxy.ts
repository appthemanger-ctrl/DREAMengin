export class DrEamsModelProxy {
    async respondToUser(userMessage: string): Promise<string> {
        const DR_EAMS_MODEL = "moonshotai/Kimi-K2.5";
        const response = await fetch("http://localhost:8000/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: DR_EAMS_MODEL,
                messages: [
                    { role: "system", content: "You are Dr. Eams, a helpful AI assistant." },
                    { role: "user", content: userMessage },
                ],
                temperature: 0.6,
                max_tokens: 512
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || "[no response]";
    }
}