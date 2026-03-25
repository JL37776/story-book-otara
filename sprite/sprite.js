/**
 * Book Sprite - Pet Companion + Delayed Lightbulb + Dual-Tab Interaction + BGM + Progress Tracking
 */
class BookSprite {
  constructor() {
    this.llm = new LLMClient();
    this.isSettingsOpen = false;
    this.isBusy = false;
    this.currentAnswerData = null;
    this.currentQuestion = "";
    this.pageChangeTimer = null;
    this.activeTab = "culture";
    this.prefetchedData = null; // Cache for pre-fetched LLM results

    // Progress tracking
    this.travelCurrent = 0;
    this.travelTotal = 14; // default, will be updated by event
    this.stars = 0;
    this.visitedPages = new Set();

    this.injectUI();
    this.bindEvents();
    this.listenPageChange();
    this.initBGM();
  }

  getPageContext() {
    const el = document.querySelector("#page-right");
    return el ? el.innerText.trim() : "";
  }

  // ============================
  // UI Injection
  // ============================

  injectUI() {
    // --- Progress Panel (top-left) ---
    const tracker = document.createElement("div");
    tracker.id = "sprite-tracker";
    tracker.innerHTML = `
      <div class="tracker-row">
        <span class="tracker-icon">🗺️</span>
        <span class="tracker-label">Travel</span>
        <div class="tracker-bar-wrap">
          <div id="tracker-bar-fill" class="tracker-bar-fill"></div>
        </div>
        <span id="tracker-bar-text" class="tracker-bar-text">0 / 14</span>
      </div>
      <div class="tracker-row">
        <span class="tracker-icon">⭐</span>
        <span class="tracker-label">Te Tahi</span>
        <span id="tracker-stars" class="tracker-stars-value">0</span>
      </div>
    `;

    // --- Pet Sprite ---
    const pet = document.createElement("div");
    pet.id = "sprite-pet";
    pet.innerHTML = `
      <div id="sprite-pet-body">${SpriteConfig.petEmoji}</div>
      <div id="sprite-pet-name">${SpriteConfig.petName}</div>
      <button id="sprite-settings-toggle" title="Settings">⚙️</button>
    `;

    // --- Lightbulb Hint ---
    const bulb = document.createElement("div");
    bulb.id = "sprite-bulb";
    bulb.classList.add("sprite-hidden");
    bulb.innerHTML = "💡";

    // --- Settings Panel ---
    const settings = document.createElement("div");
    settings.id = "sprite-settings";
    settings.classList.add("sprite-hidden");
    settings.innerHTML = `
      <label>Groq API Key
        <input type="password" id="sprite-api-key" placeholder="gsk_..." value="${SpriteConfig.apiKey}" />
      </label>
      <label>Model
        <select id="sprite-model-select">
          ${SpriteConfig.availableModels.map(m => `<option value="${m}" ${m === SpriteConfig.model ? "selected" : ""}>${m}</option>`).join("")}
        </select>
      </label>
      <button id="sprite-save-settings">Save</button>
    `;

    // --- Bubble Dialog (dual-tab layout) ---
    const bubble = document.createElement("div");
    bubble.id = "sprite-bubble";
    bubble.classList.add("sprite-hidden");
    bubble.innerHTML = `
      <div class="sprite-tabs">
        <button class="sprite-tab sprite-tab-active" data-tab="culture">📚 I wanna know...</button>
        <button class="sprite-tab" data-tab="think">💭 Let me think...</button>
      </div>
      <div id="sprite-tab-culture" class="sprite-tab-panel"></div>
      <div id="sprite-tab-think" class="sprite-tab-panel sprite-hidden"></div>
    `;

    // --- BGM Control Button ---
    const bgmBtn = document.createElement("button");
    bgmBtn.id = "sprite-bgm-btn";
    bgmBtn.innerHTML = "🔊";
    bgmBtn.title = "Play / Pause BGM";
    bgmBtn.classList.add("sprite-bgm-playing");

    document.body.appendChild(tracker);
    document.body.appendChild(pet);
    document.body.appendChild(bulb);
    document.body.appendChild(settings);
    document.body.appendChild(bubble);
    document.body.appendChild(bgmBtn);
  }

  // ============================
  // Event Binding
  // ============================

  bindEvents() {
    document.getElementById("sprite-settings-toggle").addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleSettings();
    });
    document.getElementById("sprite-save-settings").addEventListener("click", () => this.saveSettings());

    document.getElementById("sprite-pet-body").addEventListener("click", () => {
      this.toggleBubble();
    });

    document.getElementById("sprite-bulb").addEventListener("click", () => {
      this.hideBulb();
      if (this.prefetchedData) {
        this.showPrefetchedData();
      } else if (!this.isBusy) {
        this.loadBothTabs();
      }
    });

    document.querySelectorAll(".sprite-tab").forEach(tab => {
      tab.addEventListener("click", () => this.switchTab(tab.dataset.tab));
    });

    document.getElementById("sprite-bgm-btn").addEventListener("click", () => this.toggleBGM());
  }

  listenPageChange() {
    document.addEventListener("sprite:pageChanged", (e) => {
      const detail = e.detail || {};
      if (detail.totalPages) this.travelTotal = detail.totalPages;
      if (detail.pageNumber) {
        // Only add progress for new pages
        if (!this.visitedPages.has(detail.pageNumber)) {
          this.visitedPages.add(detail.pageNumber);
          this.travelCurrent = this.visitedPages.size;
          this.updateTracker();
        }
      }
      this.onPageChanged();
    });
  }

  // ============================
  // Progress Tracking
  // ============================

  updateTracker() {
    const pct = Math.min(100, Math.round((this.travelCurrent / this.travelTotal) * 100));
    document.getElementById("tracker-bar-fill").style.width = pct + "%";
    document.getElementById("tracker-bar-text").textContent = `${this.travelCurrent} / ${this.travelTotal}`;
    document.getElementById("tracker-stars").textContent = this.stars;
  }

  /** Add stars + flying star animation + bingo sound */
  addStars(count, fromEl) {
    this.stars += count;
    this.updateTracker();

    // Play bingo sound effect
    const bingo = new Audio(encodeURI("bgm/bingo.mp3"));
    bingo.volume = 0.5;
    bingo.play().catch(() => {});

    // Flying star animation
    const targetEl = document.getElementById("tracker-stars");
    const targetRect = targetEl.getBoundingClientRect();

    let startRect;
    if (fromEl) {
      startRect = fromEl.getBoundingClientRect();
    } else {
      startRect = { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    }

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const star = document.createElement("div");
        star.className = "flying-star";
        star.textContent = "⭐";
        star.style.left = (startRect.left + startRect.width / 2) + "px";
        star.style.top = (startRect.top + startRect.height / 2) + "px";
        document.body.appendChild(star);

        // Trigger flight
        requestAnimationFrame(() => {
          star.style.left = (targetRect.left + targetRect.width / 2) + "px";
          star.style.top = (targetRect.top + targetRect.height / 2) + "px";
          star.style.opacity = "0";
          star.style.transform = "scale(0.3)";
        });

        // Flash star counter + remove element on arrival
        setTimeout(() => {
          star.remove();
          targetEl.classList.add("tracker-stars-pop");
          setTimeout(() => targetEl.classList.remove("tracker-stars-pop"), 400);
        }, 700);
      }, i * 200);
    }
  }

  // ============================
  // Tab Switching
  // ============================

  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll(".sprite-tab").forEach(t => {
      t.classList.toggle("sprite-tab-active", t.dataset.tab === tabName);
    });
    document.getElementById("sprite-tab-culture").classList.toggle("sprite-hidden", tabName !== "culture");
    document.getElementById("sprite-tab-think").classList.toggle("sprite-hidden", tabName !== "think");
  }

  // ============================
  // Settings
  // ============================

  toggleSettings() {
    this.isSettingsOpen = !this.isSettingsOpen;
    document.getElementById("sprite-settings").classList.toggle("sprite-hidden", !this.isSettingsOpen);
  }

  saveSettings() {
    SpriteConfig.apiKey = document.getElementById("sprite-api-key").value.trim();
    SpriteConfig.model = document.getElementById("sprite-model-select").value;
    this.toggleSettings();
    this.showPlainInBothTabs("Settings saved! ✅");
    this.showBubbleEl();
    setTimeout(() => {
      if (!this.isBusy) this.startQuestionFlow();
    }, 1200);
  }

  // ============================
  // Core Flow
  // ============================

  onPageChanged() {
    if (this.pageChangeTimer) {
      clearTimeout(this.pageChangeTimer);
      this.pageChangeTimer = null;
    }
    this.hideBubble();
    this.hideBulb();
    this.prefetchedData = null;

    const ctx = this.getPageContext();
    if (!ctx) return;

    if (!SpriteConfig.apiKey) {
      this.showPlainInBothTabs("Hi! I'm Kiri 🦉 Click ⚙️ to set your API key first!");
      this.showBubbleEl();
      return;
    }

    // Wait 3 seconds, then silently prefetch LLM data in background
    this.pageChangeTimer = setTimeout(() => {
      this.prefetchContent(ctx);
    }, 3000);
  }

  /** Silently fetch LLM data; show lightbulb only on valid results */
  async prefetchContent(ctx) {
    if (!ctx || !SpriteConfig.apiKey) return;

    try {
      const [cultureResult, thinkResult] = await Promise.allSettled([
        this.llm.generateCultureItems(ctx),
        this.prefetchThinkData(ctx),
      ]);

      const cultureItems = cultureResult.status === "fulfilled" ? cultureResult.value : null;
      const thinkData = thinkResult.status === "fulfilled" ? thinkResult.value : null;

      // Only show lightbulb if at least one tab got valid data
      const hasCulture = cultureItems && Array.isArray(cultureItems) && cultureItems.length > 0;
      const hasThink = thinkData && thinkData.question && thinkData.answerData;

      if (hasCulture || hasThink) {
        this.prefetchedData = { cultureItems, thinkData };
        this.showBulb();
      }
      // If both failed or returned empty — stay silent, no lightbulb, no error shown
    } catch {
      // Network error, token exhaustion, etc. — stay completely silent
    }
  }

  /** Prefetch question + answers without rendering */
  async prefetchThinkData(ctx) {
    const question = await this.llm.generateQuestion(ctx);
    if (!question) return null;
    const answerData = await this.llm.generateAnswers(question, ctx);
    if (!answerData || !answerData.answers || answerData.answers.length === 0) return null;
    return { question, answerData };
  }

  /** Display already-prefetched data in the bubble */
  showPrefetchedData() {
    if (!this.prefetchedData) return;

    const { cultureItems, thinkData } = this.prefetchedData;
    this.prefetchedData = null;

    // Render culture tab
    if (cultureItems && cultureItems.length > 0) {
      this.renderCultureTab(cultureItems);
    } else {
      document.getElementById("sprite-tab-culture").innerHTML =
        `<div class="sprite-plain">No special Māori words on this page — let's keep reading! 📖</div>`;
    }

    // Render think tab
    if (thinkData && thinkData.question && thinkData.answerData) {
      this.currentQuestion = thinkData.question;
      this.currentAnswerData = thinkData.answerData;
      const panel = document.getElementById("sprite-tab-think");
      this.renderAnswers(panel, thinkData.question, thinkData.answerData);
    } else {
      document.getElementById("sprite-tab-think").innerHTML =
        `<div class="sprite-plain">Nothing to think about here — let's keep reading! 📖</div>`;
    }

    this.showBubbleEl();
  }

  startQuestionFlow() {
    if (this.pageChangeTimer) {
      clearTimeout(this.pageChangeTimer);
      this.pageChangeTimer = null;
    }
    this.hideBulb();
    this.loadBothTabs();
  }

  showBulb() {
    const bulb = document.getElementById("sprite-bulb");
    bulb.classList.remove("sprite-hidden");
    bulb.classList.add("sprite-bulb-glow");
    // Lightbulb stays visible until reader clicks it or the agent
  }

  hideBulb() {
    const bulb = document.getElementById("sprite-bulb");
    bulb.classList.add("sprite-hidden");
    bulb.classList.remove("sprite-bulb-glow");
  }

  // ============================
  // Dual-Tab Parallel Loading
  // ============================

  async loadBothTabs() {
    const ctx = this.getPageContext();
    if (!ctx || !SpriteConfig.apiKey) return;

    this.isBusy = true;
    this.setPetState("thinking");

    document.getElementById("sprite-tab-culture").innerHTML =
      `<div class="sprite-loading">Looking for Māori treasures... 🌿</div>`;
    document.getElementById("sprite-tab-think").innerHTML =
      `<div class="sprite-loading">Hmm, let me think... 🤔</div>`;
    this.showBubbleEl();

    const [cultureResult] = await Promise.allSettled([
      this.llm.generateCultureItems(ctx),
      this.loadThinkTab(ctx),
    ]);

    if (cultureResult.status === "fulfilled") {
      this.renderCultureTab(cultureResult.value);
    } else {
      document.getElementById("sprite-tab-culture").innerHTML =
        `<div class="sprite-plain">No special Māori words on this page — let's keep reading! 📖</div>`;
    }

    this.setPetState("idle");
    this.isBusy = false;
  }

  // ============================
  // Left Tab: Culture Knowledge (view term = +1 star)
  // ============================

  renderCultureTab(items) {
    const panel = document.getElementById("sprite-tab-culture");
    if (!items || items.length === 0) {
      panel.innerHTML = `<div class="sprite-plain">No special Māori words on this page — let's keep reading! 📖</div>`;
      return;
    }
    panel.innerHTML = "";
    const viewedSet = new Set(); // each term only awards stars once
    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "sprite-culture-card";
      card.innerHTML = `
        <div class="sprite-culture-term">🔮 ${item.term}</div>
        <div class="sprite-culture-answer sprite-hidden">${item.explanation}</div>
      `;
      card.addEventListener("click", () => {
        const answer = card.querySelector(".sprite-culture-answer");
        const wasHidden = answer.classList.contains("sprite-hidden");
        answer.classList.toggle("sprite-hidden");
        card.classList.toggle("sprite-culture-open");

        // Award +1 star on first expansion
        if (wasHidden && !viewedSet.has(item.term)) {
          viewedSet.add(item.term);
          this.addStars(1, card);
        }
      });
      panel.appendChild(card);
    });
  }

  // ============================
  // Right Tab: Thinking Quiz
  // ============================

  async loadThinkTab(ctx) {
    const panel = document.getElementById("sprite-tab-think");
    try {
      const question = await this.llm.generateQuestion(ctx);
      this.currentQuestion = question;

      panel.innerHTML = `
        <div class="sprite-label">✨ Kiri wonders...</div>
        <div class="sprite-label sprite-q-echo">${question}</div>
        <div class="sprite-loading">Let me think of some ideas... 🤔</div>
      `;

      const data = await this.llm.generateAnswers(question, ctx);
      this.currentAnswerData = data;
      this.renderAnswers(panel, question, data);
    } catch (err) {
      panel.innerHTML = `<div class="sprite-plain">Nothing to think about here — let's keep reading! 📖</div>`;
    }
  }

  renderAnswers(panel, question, data) {
    panel.innerHTML = `<div class="sprite-label sprite-q-echo">${question}</div>`;
    data.answers.forEach((ans, i) => {
      const btn = document.createElement("button");
      btn.className = "sprite-answer-btn";
      btn.textContent = `${String.fromCharCode(65 + i)}. ${ans}`;
      btn.addEventListener("click", () => this.onAnswerClicked(i, btn));
      panel.appendChild(btn);
    });
  }

  async onAnswerClicked(chosenIndex, clickedBtn) {
    const { answers, correctIndex } = this.currentAnswerData;
    const isCorrect = chosenIndex === correctIndex;
    const chosenAnswer = answers[chosenIndex];
    const correctAnswer = answers[correctIndex];

    this.isBusy = true;
    this.setPetState("thinking");

    const panel = document.getElementById("sprite-tab-think");
    const btns = panel.querySelectorAll(".sprite-answer-btn");
    btns.forEach((btn, i) => {
      btn.disabled = true;
      if (i === correctIndex) btn.classList.add("sprite-answer-correct");
      if (i === chosenIndex && !isCorrect) btn.classList.add("sprite-answer-wrong");
    });

    // Correct answer = +2 stars with flying animation
    if (isCorrect) {
      this.addStars(2, clickedBtn);
    }

    const commentEl = document.createElement("div");
    commentEl.className = "sprite-comment sprite-loading";
    commentEl.textContent = isCorrect ? "🎉 ..." : "💭 ...";
    panel.appendChild(commentEl);

    try {
      const ctx = this.getPageContext();
      const comment = await this.llm.generateComment(
        this.currentQuestion, chosenAnswer, correctAnswer, isCorrect, ctx
      );
      commentEl.className = `sprite-comment ${isCorrect ? "sprite-comment-correct" : "sprite-comment-wrong"}`;
      commentEl.textContent = `${isCorrect ? "🎉" : "💡"} ${comment}`;
    } catch (err) {
      commentEl.className = `sprite-comment ${isCorrect ? "sprite-comment-correct" : "sprite-comment-wrong"}`;
      commentEl.textContent = isCorrect
        ? "🎉 Ka pai! You've got a great eye for the story!"
        : "💡 That's an interesting thought! Every answer helps us learn more.";
    }

    const nextBtn = document.createElement("button");
    nextBtn.className = "sprite-next-btn";
    nextBtn.textContent = "Explore more! 🦉";
    nextBtn.addEventListener("click", () => this.startQuestionFlow());
    panel.appendChild(nextBtn);

    document.dispatchEvent(new CustomEvent("sprite:answerResult", {
      detail: {
        question: this.currentQuestion,
        chosenAnswer,
        correctAnswer,
        isCorrect,
        pageContext: this.getPageContext(),
      }
    }));

    this.setPetState("idle");
    this.isBusy = false;
  }

  // ============================
  // BGM Playback
  // ============================

  initBGM() {
    this.bgmAudio = new Audio();
    this.bgmAudio.volume = 0.3;
    this.bgmPlaying = true;
    this.bgmTracks = [];
    this.bgmCurrentIndex = 0;

    fetch("bgm/index.json")
      .then(res => res.json())
      .then(tracks => {
        if (!Array.isArray(tracks) || tracks.length === 0) return;
        this.bgmTracks = tracks.slice();
        for (let i = this.bgmTracks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.bgmTracks[i], this.bgmTracks[j]] = [this.bgmTracks[j], this.bgmTracks[i]];
        }
        this.bgmCurrentIndex = 0;
        this.bgmAudio.src = encodeURI(this.bgmTracks[0]);
        this.bgmAudio.addEventListener("ended", () => {
          this.bgmCurrentIndex = (this.bgmCurrentIndex + 1) % this.bgmTracks.length;
          if (this.bgmCurrentIndex === 0) {
            for (let i = this.bgmTracks.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [this.bgmTracks[i], this.bgmTracks[j]] = [this.bgmTracks[j], this.bgmTracks[i]];
            }
          }
          this.bgmAudio.src = encodeURI(this.bgmTracks[this.bgmCurrentIndex]);
          this.bgmAudio.play();
        });
        this.startBGM();
      })
      .catch(() => {});
  }

  startBGM() {
    const btn = document.getElementById("sprite-bgm-btn");
    this.bgmAudio.play().then(() => {
      this.bgmPlaying = true;
      btn.innerHTML = "🔊";
      btn.classList.add("sprite-bgm-playing");
    }).catch(() => {
      // Autoplay blocked — wait for any user interaction to resume
      btn.innerHTML = "🔊";
      btn.classList.add("sprite-bgm-playing");
      const resume = () => {
        if (!this.bgmPlaying) return;
        this.bgmAudio.play().then(() => {
          btn.innerHTML = "🔊";
          btn.classList.add("sprite-bgm-playing");
        }).catch(() => {});
        document.removeEventListener("click", resume);
        document.removeEventListener("keydown", resume);
        document.removeEventListener("touchstart", resume);
      };
      document.addEventListener("click", resume, { once: true });
      document.addEventListener("keydown", resume, { once: true });
      document.addEventListener("touchstart", resume, { once: true });
    });
  }

  toggleBGM() {
    const btn = document.getElementById("sprite-bgm-btn");
    if (this.bgmPlaying) {
      this.bgmAudio.pause();
      this.bgmPlaying = false;
      btn.innerHTML = "🔇";
      btn.classList.remove("sprite-bgm-playing");
    } else {
      this.bgmAudio.play().catch(() => {});
      this.bgmPlaying = true;
      btn.innerHTML = "🔊";
      btn.classList.add("sprite-bgm-playing");
    }
  }

  // ============================
  // UI Helpers
  // ============================

  showPlainInBothTabs(text) {
    document.getElementById("sprite-tab-culture").innerHTML = `<div class="sprite-plain">${text}</div>`;
    document.getElementById("sprite-tab-think").innerHTML = `<div class="sprite-plain">${text}</div>`;
  }

  showBubbleEl() {
    const bubble = document.getElementById("sprite-bubble");
    bubble.classList.remove("sprite-hidden");
    bubble.classList.add("sprite-bounce-in");
    setTimeout(() => bubble.classList.remove("sprite-bounce-in"), 400);
  }

  hideBubble() {
    document.getElementById("sprite-bubble").classList.add("sprite-hidden");
  }

  /** Toggle bubble on pet click: hide if visible, show (or load) if hidden */
  toggleBubble() {
    const bubble = document.getElementById("sprite-bubble");
    if (!bubble.classList.contains("sprite-hidden")) {
      // Bubble is visible — collapse it
      this.hideBubble();
    } else {
      // Bubble is hidden — show it
      this.hideBulb();
      if (this.prefetchedData) {
        // Use already-fetched data
        this.showPrefetchedData();
      } else {
        const culturePanel = document.getElementById("sprite-tab-culture");
        const hasContent = culturePanel.innerHTML.trim().length > 0
          && !culturePanel.querySelector(".sprite-loading");
        if (hasContent) {
          // Already has loaded content, just re-show
          this.showBubbleEl();
        } else {
          // No content yet — trigger loading
          if (!this.isBusy) this.startQuestionFlow();
        }
      }
    }
  }

  setPetState(state) {
    const body = document.getElementById("sprite-pet-body");
    body.classList.remove("sprite-pet-idle", "sprite-pet-thinking", "sprite-pet-happy");
    body.classList.add(`sprite-pet-${state}`);
  }
}

window.addEventListener("load", () => {
  window.bookSprite = new BookSprite();
});
