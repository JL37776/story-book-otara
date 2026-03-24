/**
 * Buddy Sprite (Moko) — Bottom-left emotional companion
 * Four expressions: happy 😊  confused 😯  excited 🤩  sad 🥺
 * Reacts to page content with emotions + cute sentences on page turn
 * Also reacts encouragingly after quiz answers
 */
class BuddySprite {
  constructor(llm) {
    this.llm = llm;
    this.currentEmotion = "happy";
    this.reactionTimer = null;
    this.injectUI();
    this.listenEvents();
  }

  // Emotion mapping
  static EMOTIONS = {
    happy:    { emoji: "😊", color: "#4caf50", bg: "#e8f5e9" },
    excited:  { emoji: "🤩", color: "#ff9800", bg: "#fff3e0" },
    confused: { emoji: "😯", color: "#2196f3", bg: "#e3f2fd" },
    sad:      { emoji: "🥺", color: "#9c27b0", bg: "#f3e5f5" },
  };

  // ============================
  // UI
  // ============================

  injectUI() {
    const container = document.createElement("div");
    container.id = "buddy-sprite";
    container.innerHTML = `
      <div id="buddy-speech" class="buddy-hidden"></div>
      <div id="buddy-face">${BuddySprite.EMOTIONS.happy.emoji}</div>
      <div id="buddy-name">Moko</div>
    `;
    document.body.appendChild(container);
  }

  // ============================
  // Event Listeners
  // ============================

  listenEvents() {
    // Trigger delayed reaction on page turn
    document.addEventListener("sprite:pageChanged", () => {
      this.onPageChanged();
    });

    // Trigger reaction when quiz is answered (dispatched by BookSprite)
    document.addEventListener("sprite:answerResult", (e) => {
      this.onAnswerResult(e.detail);
    });
  }

  // ============================
  // Page-Turn Reaction
  // ============================

  onPageChanged() {
    // Clear previous timer
    if (this.reactionTimer) {
      clearTimeout(this.reactionTimer);
      this.reactionTimer = null;
    }
    this.hideSpeech();

    const ctx = this.getPageContext();
    if (!ctx || !SpriteConfig.apiKey) return;

    // Delay 1.5s before reacting (let reader glance at content first)
    this.reactionTimer = setTimeout(() => {
      this.generatePageReaction(ctx);
    }, 1500);
  }

  async generatePageReaction(ctx) {
    // Show thinking expression first
    this.setEmotion("confused");

    try {
      const reaction = await this.llm.generateReaction(ctx);
      this.setEmotion(reaction.emotion);
      this.showSpeech(reaction.text);
    } catch {
      this.setEmotion("happy");
      this.showSpeech("Ooh, a new page! ✨");
    }
  }

  // ============================
  // Answer Reaction
  // ============================

  async onAnswerResult(detail) {
    const { question, chosenAnswer, isCorrect, pageContext } = detail;

    try {
      const reaction = await this.llm.generateAnswerReaction(
        question, chosenAnswer, isCorrect, pageContext
      );
      this.setEmotion(reaction.emotion);
      this.showSpeech(reaction.text);
    } catch {
      if (isCorrect) {
        this.setEmotion("excited");
        this.showSpeech("Yaaay! Amazing! 🌟");
      } else {
        this.setEmotion("happy");
        this.showSpeech("Great try! Keep going! 💪");
      }
    }
  }

  // ============================
  // UI Helpers
  // ============================

  getPageContext() {
    const el = document.querySelector("#page-right");
    return el ? el.innerText.trim() : "";
  }

  setEmotion(emotion) {
    const valid = BuddySprite.EMOTIONS[emotion] ? emotion : "happy";
    this.currentEmotion = valid;

    const face = document.getElementById("buddy-face");
    const info = BuddySprite.EMOTIONS[valid];
    face.textContent = info.emoji;
    face.style.borderColor = info.color;

    // Trigger bounce animation
    face.classList.remove("buddy-bounce");
    void face.offsetWidth; // reflow
    face.classList.add("buddy-bounce");
  }

  showSpeech(text) {
    const speech = document.getElementById("buddy-speech");
    speech.textContent = text;
    speech.classList.remove("buddy-hidden");
    speech.classList.add("buddy-speech-in");

    // Auto-hide after 6 seconds
    clearTimeout(this._speechTimer);
    this._speechTimer = setTimeout(() => {
      this.hideSpeech();
    }, 6000);
  }

  hideSpeech() {
    const speech = document.getElementById("buddy-speech");
    speech.classList.add("buddy-hidden");
    speech.classList.remove("buddy-speech-in");
  }
}

// Initialize — after BookSprite
window.addEventListener("load", () => {
  // Reuse BookSprite's LLMClient instance
  const waitForSprite = setInterval(() => {
    if (window.bookSprite && window.bookSprite.llm) {
      clearInterval(waitForSprite);
      window.buddySprite = new BuddySprite(window.bookSprite.llm);
    }
  }, 100);
});
