// scripts/generate-post.mjs
// Called by the write-post GitHub Actions workflow.
// Generates blog posts in MDX format using the GitHub Models API.

import fs from "fs";
import path from "path";

const MODELS_API = "https://models.inference.ai.azure.com/chat/completions";
const MODEL = "gpt-4o";

async function callModel(messages, token) {
  const res = await fetch(MODELS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub Models API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

function buildPrompt(topic, details, lang) {
  const langLabel = lang === "ja" ? "日本語" : "English";
  const langInstruction =
    lang === "ja"
      ? "記事は日本語で書いてください。自然で読みやすい文体にしてください。"
      : "Write the article in English. Use a clear and readable style.";

  return [
    {
      role: "system",
      content: `You are a skilled technical blog writer. You write well-structured, informative blog posts in MDX format.

Rules:
- Output ONLY valid MDX content. No wrapping code fences.
- Start with YAML frontmatter (---) containing: title, date (${new Date().toISOString().slice(0, 10)}), description (1-2 sentences), tags (array of strings).
- ${langInstruction}
- Use ## for section headings (not #, the title comes from frontmatter).
- Include code examples where appropriate with proper language tags.
- Keep the post focused and practical, around 800-1500 words.
- Do not include the word "blog" or meta-references to "this article" excessively.`,
    },
    {
      role: "user",
      content: `Write a ${langLabel} blog post about the following topic.

Topic: ${topic}
${details ? `\nAdditional context:\n${details}` : ""}`,
    },
  ];
}

function topicToSlug(topic) {
  return topic
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function main() {
  const token = process.env.MODELS_TOKEN;
  if (!token) {
    throw new Error("MODELS_TOKEN environment variable is required");
  }

  const topic = process.env.ISSUE_TOPIC;
  const details = process.env.ISSUE_DETAILS || "";
  const langChoice = process.env.ISSUE_LANGUAGE || "日英両方 / Both (ja + en)";

  if (!topic) {
    throw new Error("ISSUE_TOPIC environment variable is required");
  }

  const slug = topicToSlug(topic);
  const languages = [];

  if (langChoice.includes("日英両方") || langChoice.includes("Both")) {
    languages.push("ja", "en");
  } else if (langChoice.includes("日本語") || langChoice.includes("Japanese")) {
    languages.push("ja");
  } else if (langChoice.includes("英語") || langChoice.includes("English")) {
    languages.push("en");
  } else {
    languages.push("ja", "en");
  }

  const created = [];

  for (const lang of languages) {
    console.log(`Generating ${lang} post for: ${topic}`);
    const messages = buildPrompt(topic, details, lang);
    const content = await callModel(messages, token);

    // Strip wrapping code fences if the model added them
    const cleaned = content
      .replace(/^```(?:mdx|markdown|md)?\n/i, "")
      .replace(/\n```\s*$/i, "");

    const dir = path.join("content", "blog", lang);
    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, `${slug}.mdx`);
    fs.writeFileSync(filePath, cleaned, "utf-8");
    console.log(`  → ${filePath}`);
    created.push(filePath);
  }

  // Output for GitHub Actions
  const output = created.join("\n");
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `files<<EOF\n${output}\nEOF\n`);
    fs.appendFileSync(outputFile, `slug=${slug}\n`);
  }

  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
