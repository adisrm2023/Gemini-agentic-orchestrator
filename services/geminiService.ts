import { GoogleGenAI, Type } from "@google/genai";
import { AgentResponse, SelectorOutput } from "../types";

/* =========================
   TYPES
========================= */

export type Perspective =
  | "academic"
  | "industry"
  | "theoretical"
  | "critical";

/* =========================
   ENV
========================= */

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY is missing. Check .env.local");
}

/* =========================
   SERVICE
========================= */

import { AgentService } from "./agentService"

export class GeminiAgentService
implements AgentService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /* =====================================================
     CALL 1 — PLANNER + SELECTOR
     (Structure + Focus)
     ===================================================== */
  async planAndSelect(query: string): Promise<{
    planText: string;
    selector: SelectorOutput;
  }> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
You are performing TWO roles.

ROLE 1 — Strategic Planner
- Break the research question into clear sub-questions
- Focus on coverage, not answers

ROLE 2 — Context Selector
- Identify the single most important focus area
- Explain why this focus is critical

Return STRICT JSON in this format:
{
  "plan": "bullet point plan",
  "focus": "primary focus",
  "rationale": "why this focus matters"
}

Research Question:
${query}
      `,
      config: {
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plan: { type: Type.STRING },
            focus: { type: Type.STRING },
            rationale: { type: Type.STRING },
          },
          required: ["plan", "focus", "rationale"],
        },
      },
    });

    const data = JSON.parse(
      response.text ||
        '{"plan":"","focus":"General","rationale":"N/A"}'
    );

    return {
      planText: data.plan,
      selector: {
        focus: data.focus,
        rationale: data.rationale,
      },
    };
  }

  /* =====================================================
     CALL 2 — REPORTER + REVIEWER
     (Draft + Accuracy Audit)
     ===================================================== */
  async reportAndReview(
    query: string,
    context: string,
    perspective: Perspective
  ): Promise<{
    draft: string;
    review: string;
  }> {
    const perspectiveInstruction: Record<Perspective, string> = {
      academic: `
Target audience: Undergraduate or early postgraduate students.

Accuracy requirements:
- Use clear definitions
- Explain basic components step-by-step
- Introduce formulas or simple models where relevant
- Avoid heavy jargon
- Prioritize clarity over depth

Include:

- theoretical explanation
- citations style reasoning
- research gaps
- limitations
- formal tone
`,

      industry: `
Target audience: Industry professionals and engineers.

Accuracy requirements:
- Use advanced technical terminology
- Reference real-world systems and workflows
- Include company-level examples where appropriate
  (e.g., Google, Amazon, Microsoft, OpenAI)
- Discuss scalability, performance, cost, and deployment concerns
- Avoid textbook-style explanations
Include:

- business impact
- cost considerations
- scalability
- implementation timeline
- ROI implications
`,

      theoretical: `
Target audience: Researchers and theoreticians.

Accuracy requirements:
- Focus on foundational theory and abstractions
- Use precise conceptual language
- Discuss models, frameworks, and theoretical components
- Avoid implementation details and company examples
- Maintain strict logical consistency

Include:

- models
- equations
- conceptual frameworks
- abstractions
- mechanisms
`,

      critical: `
Target audience: Evaluators and reviewers.

Accuracy requirements:
- Challenge assumptions made in the explanation
- Highlight uncertainty, edge cases, and risks
- Identify limitations and failure modes
- Avoid optimistic or definitive conclusions

Include:

- weaknesses
- risks
- uncertainty
- bias detection
- counterarguments
`,
    };

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
You are performing TWO roles.

ROLE 1 — Draft Reporter
${perspectiveInstruction[perspective]}

ROLE 2 — Critical Reviewer
Evaluate whether the draft satisfies the accuracy requirements
for the "${perspective}" perspective.

Reviewer checks:
- Missing required elements
- Incorrect level of depth
- Perspective mismatch
- Overconfident or unsupported claims

DO NOT rewrite the draft.
DO NOT add new information.

Return output EXACTLY in this format:

---DRAFT---
<draft text>

---REVIEW---
<bullet point critique>

User Question:
${query}

Context Focus:
${context}
      `,
    });

    const text = response.text || "";
    const draftMatch = text.match(/---DRAFT---([\s\S]*?)---REVIEW---/);
    const reviewMatch = text.match(/---REVIEW---([\s\S]*)$/);

    return {
      draft: draftMatch?.[1]?.trim() || "",
      review: reviewMatch?.[1]?.trim() || "",
    };
  }

  /* =====================================================
     CALL 3 — FINAL SYNTHESIZER
     (User-Facing Answer)
     ===================================================== */
  async finalSynthesizerAgent(
    query: string,
    draft: string,
    review: string,
    perspective: Perspective
  ): Promise<AgentResponse> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
You are a Final Answer Synthesizer.

Produce a clean, user-facing answer from a "${perspective}" perspective.

Rules:
- Do NOT mention drafts, reviewers, or internal agents
- Use reviewer feedback internally
- Avoid absolute claims
- Be precise and structured

Your output MUST include:

1. Final Answer
2. Confidence Level (High / Medium / Low)
3. Reason for Uncertainty
4. What Would Improve Confidence
5. Research Gaps
6. Limitations (What this answer does NOT cover)

User Question:
${query}

Draft:
${draft}

Reviewer Feedback:
${review}
      `,
    });

    return {
      content: response.text || "",
      metadata: {},
    };
  }
}
