/**
 * LLM Client - Communicates with Groq API
 */
class LLMClient {
  constructor() {
    // stateless — each call is independent per agent
  }

  /**
   * Build message list (specify agent + context)
   */
  buildMessages(agentKey, userMessage, pageContext) {
    const agent = window.getAgent(agentKey);

    let systemContent = agent.systemPrompt;
    if (pageContext) {
      systemContent += `\n\nCurrent page content the reader is viewing:\n"""${pageContext}"""`;
    }

    return [
      { role: "system", content: systemContent },
      { role: "user", content: userMessage },
    ];
  }

  /**
   * Send request to Groq API (non-streaming, for JSON structured responses)
   */
  async chat(agentKey, userMessage, pageContext) {
    if (!SpriteConfig.apiKey) {
      throw new Error("API Key not set. Click ⚙️ on the sprite to configure.");
    }

    const messages = this.buildMessages(agentKey, userMessage, pageContext);

    const response = await fetch(SpriteConfig.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SpriteConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: SpriteConfig.model,
        messages,
        max_tokens: SpriteConfig.maxTokens,
        temperature: SpriteConfig.temperature,
        top_p: SpriteConfig.topP,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error (${response.status})`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  /**
   * Generate a single question (force extract only one)
   */
  async generateQuestion(pageContext) {
    const raw = await this.chat(
      "questionGenerator",
      "Generate exactly ONE question for this page. Only one. No numbering.",
      pageContext
    );
    let cleaned = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();

    // LLM may return multiple lines or JSON array — force extract only the first valid question
    // Try parsing as JSON array
    try {
      const arr = JSON.parse(cleaned);
      if (Array.isArray(arr) && arr.length > 0) {
        cleaned = String(arr[0]);
      }
    } catch {
      // Not JSON — split by newlines and take first line
      const lines = cleaned.split("\n")
        .map(l => l.replace(/^\d+[\.\)\-]\s*/, "").trim())  // strip "1. " "2) " etc.
        .filter(l => l.length > 10); // filter out too-short lines
      if (lines.length > 0) {
        cleaned = lines[0];
      }
    }

    // Strip surrounding quotes
    cleaned = cleaned.replace(/^["']+|["']+$/g, "").trim();
    return cleaned || "What do you think happens on this page?";
  }

  /**
   * Generate candidate answers
   */
  async generateAnswers(question, pageContext) {
    const raw = await this.chat(
      "answerGenerator",
      `Question: "${question}"`,
      pageContext
    );
    try {
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.answers && Array.isArray(parsed.answers)) {
        return {
          answers: parsed.answers.slice(0, 3),
          correctIndex: parsed.correctIndex ?? 0,
        };
      }
    } catch {
      // fallback
    }
    return {
      answers: ["I'm not sure", "Let me think...", "Can you tell me?"],
      correctIndex: 0,
    };
  }

  /**
   * Generate comment
   */
  async generateComment(question, chosenAnswer, correctAnswer, isCorrect, pageContext) {
    const prompt = `Question: "${question}"
Reader chose: "${chosenAnswer}"
Correct answer: "${correctAnswer}"
Was the reader correct: ${isCorrect ? "Yes" : "No"}
Give your comment.`;

    return await this.chat("commentator", prompt, pageContext);
  }

  /**
   * Extract Māori cultural terms from the page
   */
  async generateCultureItems(pageContext) {
    const raw = await this.chat(
      "cultureExtractor",
      "Extract Māori cultural items from this page.",
      pageContext
    );
    try {
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item.term && item.explanation).slice(0, 4);
      }
    } catch {
      // fallback
    }
    return [];
  }

  /**
   * Generate page-turn emotional reaction (Moko buddy)
   */
  async generateReaction(pageContext) {
    const raw = await this.chat(
      "reactor",
      "React to this page content.",
      pageContext
    );
    try {
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.emotion && parsed.text) return parsed;
    } catch {
      // fallback
    }
    return { emotion: "happy", text: "Ooh, let me see what happens! ✨" };
  }

  /**
   * Generate post-answer emotional reaction (Moko buddy)
   */
  async generateAnswerReaction(question, chosenAnswer, isCorrect, pageContext) {
    const prompt = `Question: "${question}"
Reader chose: "${chosenAnswer}"
Was it the best answer: ${isCorrect ? "Yes" : "No"}
React to this.`;
    const raw = await this.chat("answerReactor", prompt, pageContext);
    try {
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.emotion && parsed.text) return parsed;
    } catch {
      // fallback
    }
    return isCorrect
      ? { emotion: "excited", text: "Yaaay! You got it! 🌟" }
      : { emotion: "happy", text: "Great try! We're learning together! 💪" };
  }
}
