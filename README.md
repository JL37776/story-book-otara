# Group Seven - Whakatōhea - Te Tahi

An interactive book regarding Te Tahi-o-Te-Rā

---

# Project Workflow

```
Fork → Clone → Create Branch → Work → Push → Pull Request → Review → Merge
```

## Project Structure

```
story-book-otara
│
├── api/           # JSON data for each story page
├── images/        # Illustrations used in the story
├── storybook.html # Main HTML page
├── storybook.css  # Styling for the storybook
└── storybook.js   # Interactive functionality
```
# Team Guidelines

A few simple rules for the team:

- Do not push directly to `main`
- Always create a branch before working
- Write clear commit messages
- Pull the latest changes before starting new work
- Open a pull request when your feature is ready

---

# Getting Started

## 1. Fork the Repository

Click the **Fork** button at the top of this repository.  
This creates your own copy of the project.

---

## 2. Clone Your Fork

Clone your fork to your computer.

```bash
git clone https://github.com/YOUR-USERNAME/story-book-otara.git
```

Move into the project folder:

```bash
cd story-book-otara
```

---

## 3. Connect to the Original Repository

Add the original repository as **upstream** so you can get updates from the team.

```bash
git remote add upstream https://github.com/aliyyanWijaya/story-book-otara.git
```

Check that it worked:

```bash
git remote -v
```

You should see both `origin` and `upstream`.

---

# Working on the Project

## 1. Create a New Branch

Always create a branch before making changes.

Example:

```bash
git checkout -b feature-add-chapter1
```

or

```bash
git checkout -b fix-navigation
```

Try to name your branch based on what you're working on.

---

## 2. Make Your Changes

Edit files, add content, or improve the project.

Then stage and commit your changes:

```bash
git add .
git commit -m "Add chapter 1 story section"
```

---

## 3. Push Your Branch

Push your branch to your fork:

```bash
git push origin your-branch-name
```

Example:

```bash
git push origin feature-add-chapter1
```

---

# Creating a Pull Request

Once your work is ready:

1. Go to the main repository
2. Click **Pull Requests**
3. Click **New Pull Request**
4. Select your branch
5. Submit the pull request

Your changes will be reviewed before being merged into `main`.

---

# Updating Your Local Repository

Before starting new work, make sure you have the latest changes.

```bash
git pull upstream main
```

If needed, update your fork:

```bash
git push origin main
```

---

# AI Sprite Interactive System

An LLM-powered interactive companion layer built on top of the storybook, using the **Groq API** (LLaMA / Gemma / Mixtral models). All sprite features are located in the `sprite/` folder and injected dynamically — zero changes to the original storybook HTML structure.

## Architecture

```
sprite/
├── config.js       # Groq API configuration (key, model, parameters)
├── agents.js       # 6 specialized LLM agent prompts
├── llm-client.js   # Groq API communication client
├── sprite.js       # Main BookSprite class (pet, bubble, BGM, progress)
├── buddy.js        # BuddySprite class (Moko emotional companion)
└── sprite.css      # All sprite UI styles & animations
```

## Features

### 🦉 Kiri — The Owl Spirit (Top-Right)

- **Delayed lightbulb**: 3 seconds after each page turn, a glowing 💡 appears, then auto-triggers after 1.5s
- **Dual-tab bubble dialog**:
  - **📚 I wanna know...** — Extracts Māori cultural terms (words, place names, concepts) from the current page. Click a term card to expand its child-friendly explanation (+1 ⭐ per new term viewed)
  - **💭 Let me think...** — Generates one inspirational question + 3 candidate answers. Selecting the best answer awards +2 ⭐. All answers receive warm, encouraging feedback (no harsh "wrong" — uses yellow/orange for non-best choices)
- **Toggle on click**: Clicking Kiri collapses/expands the bubble without reloading content
- **Settings panel** (⚙️): Configure API key and switch between models at runtime

### 😊 Moko — The Taniwha Buddy (Bottom-Left)

- **4 emotional states**: 😊 happy, 🤩 excited, 😯 confused, 🥺 sad
- **Page-turn reaction**: 1.5s after each page turn, Moko reads the story content and reacts with a matching emotion + cute one-liner (e.g., *"Waaah, the valley sounds so beautiful! ✨"*)
- **Answer reaction**: After the reader selects a quiz answer, Moko responds with encouragement — always positive regardless of choice

### 🗺️ Progress Tracker (Top-Left)

- **Travel progress bar**: Advances by 1 for each new page visited (no duplicates). Shows `X / 14` with animated gradient fill + shimmer effect
- **⭐ Te Tahi Star Leaderboard**: Cumulative score
  - +1 ⭐ for each culture term first viewed
  - +2 ⭐ for each correct quiz answer
  - **Flying star animation**: Stars fly from the click source to the counter with a curved trajectory, followed by a pop effect on the counter
  - **Bingo sound effect**: `bgm/bingo.mp3` plays on every star award

### 🎵 BGM System (Bottom-Left)

- **Auto-play on load**: Music starts automatically (falls back to first user interaction if blocked by browser autoplay policy)
- **Random shuffle**: Reads track list from `bgm/index.json`, shuffles with Fisher-Yates, re-shuffles after each full cycle
- **Toggle button** (🔊/🔇): Click to pause/resume

### LLM Agents

| Agent | Role |
|-------|------|
| `questionGenerator` | Generates 1 inspirational, positively-guiding question per page |
| `answerGenerator` | Produces 3 thoughtful candidate answers (1 best + 2 reasonable) |
| `commentator` | Gives warm, culturally-enriched feedback on the reader's choice |
| `cultureExtractor` | Extracts 1–4 Māori cultural terms with child-friendly explanations |
| `reactor` | Moko's emotional page-turn reaction (emotion + cute sentence) |
| `answerReactor` | Moko's encouraging post-answer reaction (always positive) |

## Adding BGM Tracks

1. Place `.mp3` files in the `bgm/` folder
2. Add the file path to `bgm/index.json`:

```json
[
  "bgm/08 Spikeroog.mp3",
  "bgm/your-new-track.mp3"
]
```

Tracks will be shuffled and looped automatically.

## Mobile Responsive Layout

The storybook and all sprite UI elements adapt to three breakpoints:

| Breakpoint | Layout |
|---|---|
| **≤ 1100px** (Tablet) | Grid columns become fluid `1fr`, page height reduced to 500px, bubble narrows to 320px |
| **≤ 768px** (Mobile) | Single-column stacked layout — image on top, text below. Bubble becomes a full-width **bottom sheet**. Settings panel also slides up from the bottom. All sprites and buttons shrink for touch |
| **≤ 480px** (Small phone) | Further reduced sizes for tracker, pet, buddy, BGM button. Smaller tab text and progress bar |

Key mobile adaptations:
- **Viewport meta tag** added to `index.html` for proper scaling
- **Kiri bubble** → bottom sheet drawer (slides up from bottom edge)
- **Settings panel** → full-width bottom sheet
- **Answer buttons / culture cards** → larger touch targets (12px+ padding)
- **Moko buddy** → 44px → 36px, speech bubble max-width reduced
- **BGM button** → 36px → 32px, closer to edge
- **Progress tracker** → compact layout with smaller bar and text

