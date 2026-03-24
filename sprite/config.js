/**
 * Groq API Configuration
 */
const SpriteConfig = {
  // Groq API endpoint
  apiUrl: "https://api.groq.com/openai/v1/chat/completions",

  // API Key - configured via settings panel at runtime
  apiKey: "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",

  // Default model
  model: "llama-3.1-8b-instant",

  // Available models
  availableModels: [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "gemma2-9b-it",
    "mixtral-8x7b-32768",
  ],

  // Request parameters
  maxTokens: 1024,
  temperature: 0.7,
  topP: 1,

  // Sprite pet character config
  petName: "Kiri",
  petEmoji: "🦉",
};
