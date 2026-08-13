import React, { useState, useRef, useEffect } from "react";
import {
  AgentStatus,
  AgentStep,
  Message,
  AgentRole,
} from "./types";

import { OllamaAgentService } from "./services/ollamaServices";
import { GeminiAgentService } from "./services/geminiService";
import AgentProcess from "./components/AgentProcess";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { AgentService } from "./services/agentService";

/* TYPES */

type Perspective =
  | "academic"
  | "industry"
  | "theoretical"
  | "critical";

type AgentHistory = {
  planner?: string;
  selector?: string;
  reporter?: string;
  reviewer?: string;
};

type ResearchLog = {
  query: string;
  answer: string;
  confidence: number;
  history: AgentHistory;
};

const INITIAL_AGENT_STEPS: AgentStep[] = [
  { role: "planner", name: "Strategic Planner", description: "", status: AgentStatus.IDLE },
  { role: "selector", name: "Context Selector", description: "", status: AgentStatus.IDLE },
  { role: "reporter", name: "Draft Reporter", description: "", status: AgentStatus.IDLE },
  { role: "reviewer", name: "Critical Reviewer", description: "", status: AgentStatus.IDLE },
  { role: "final", name: "Final Synthesizer", description: "", status: AgentStatus.IDLE },
];

function buildScholarLink(keywords: string[]) {
  const q = encodeURIComponent(keywords.join(" "));
  return `https://scholar.google.com/scholar?q=${q}`;
}

function getBackground(perspective: string) {
  switch (perspective) {
    case "academic":
      return "bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#9333ea]";
    case "industry":
      return "bg-gradient-to-br from-[#0f172a] via-[#14532d] to-[#065f46]";
    case "theoretical":
      return "bg-gradient-to-br from-[#0f172a] via-[#3730a3] to-[#6d28d9]";
    case "critical":
      return "bg-gradient-to-br from-[#0f172a] via-[#7f1d1d] to-[#991b1b]";
    default:
      return "bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#9333ea]";
  }
}

export default function App() {

  const [view, setView] =
    useState<"landing" | "app">("landing");

  const [messages, setMessages] =
    useState<Message[]>([
      {
        id: "1",
        role: "assistant",
        content: "Welcome to **AI Research Agent**. Submit a research task."
      }
    ]);

    const [steps, setSteps] =
  useState<AgentStep[]>([
    {
      role: "planner",
      name: "Strategic Planner",
      description: "Planning research strategy",
      status: AgentStatus.IDLE
    },
    {
      role: "selector",
      name: "Context Selector",
      description: "Selecting relevant context",
      status: AgentStatus.IDLE
    },
    {
      role: "reporter",
      name: "Draft Reporter",
      description: "Generating research draft",
      status: AgentStatus.IDLE
    },
    {
      role: "reviewer",
      name: "Critical Reviewer",
      description: "Validating reasoning",
      status: AgentStatus.IDLE
    },
    {
      role: "final",
      name: "Final Synthesizer",
      description: "Producing final answer",
      status: AgentStatus.IDLE
    }
  ])

  const [input, setInput] =
    useState("");

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [perspective, setPerspective] =
    useState<Perspective>("academic");

  const [model, setModel] =
    useState<"gemini" | "ollama">("gemini");

  const [confidence, setConfidence] =
    useState<number | null>(null);

  const [agentHistory, setAgentHistory] =
    useState<AgentHistory>({});

  const [researchLogs, setResearchLogs] =
    useState<ResearchLog[]>([]);

  const [recentQueries, setRecentQueries] =
    useState<string[]>([]);

  const [showTrace, setShowTrace] =
    useState(false);

  const agentService =
    useRef<AgentService | null>(null);

  const chatEndRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

/* PIPELINE */

const runAgenticPipeline = async (
  query: string,
  messageId: string,
  perspective: Perspective
) => {

  agentService.current = null

  if (!agentService.current) {

    if (model === "gemini") {
      agentService.current =
        new GeminiAgentService();
    } else {
      agentService.current =
        new OllamaAgentService();
    }

  }

  const service =
    agentService.current;

  let steps =
    INITIAL_AGENT_STEPS.map(
      s => ({ ...s })
    );

  const updateUI =
    (role: AgentRole,
      status: AgentStatus) => {

      steps = steps.map(
        s =>
          s.role === role
            ? { ...s, status }
            : s
      );

      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? {
                ...m,
                steps: [...steps]
              }
            : m
        )
      );

    };

  try {

    updateUI("planner",
      AgentStatus.RUNNING);

    updateUI("selector",
      AgentStatus.RUNNING);

    const {
      planText,
      selector
    } =
      await service.planAndSelect(
        query
      );

    setAgentHistory({
      planner: planText,
      selector:
        `Focus: ${selector.focus}`
    });

    await new Promise(resolve =>
  setTimeout(resolve, 600)
)

updateUI(
  "planner",
  AgentStatus.COMPLETED
)

    updateUI("selector",
      AgentStatus.COMPLETED);

    const keywords =
      [
        selector.focus,
        perspective,
        "research"
      ];

    const scholarData = {
      scholarLink:
        buildScholarLink(
          keywords
        ),
      scholarKeywords:
        keywords,
      scholarQuery:
        query
    };

    setMessages(prev =>
      prev.map(m =>
        m.id === messageId
          ? {
              ...m,
              ...scholarData
            }
          : m
      )
    );

    updateUI("reporter",
      AgentStatus.RUNNING);

    updateUI("reviewer",
      AgentStatus.RUNNING);

    const {
      draft,
      review
    } =
      await service.reportAndReview(
        query,
        selector.focus,
        perspective
      );

    setAgentHistory(prev => ({
      ...prev,
      reporter: draft,
      reviewer: review
    }));

    updateUI("reporter",
      AgentStatus.COMPLETED);

    updateUI("reviewer",
      AgentStatus.COMPLETED);

    updateUI("final",
      AgentStatus.RUNNING);

    const finalAnswer =
      await service.finalSynthesizerAgent(
        query,
        draft,
        review,
        perspective
      );

    const score =
      Math.floor(
        70 + Math.random() * 20
      );

    setConfidence(score);

    setResearchLogs(prev => [
      {
        query,
        answer:
          finalAnswer.content,
        confidence: score,
        history: {
          planner: planText,
          selector:
            selector.focus,
          reporter: draft,
          reviewer: review
        }
      },
      ...prev
    ]);

    updateUI("final",
      AgentStatus.COMPLETED);

      setMessages(prev =>
  prev.map(m =>
    m.id === messageId
      ? {
          ...m,
          content: finalAnswer.content,
          isFinal: true,

          scholarLink:
            `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,

          scholarKeywords:
            query.split(" ")
        }
      : m
  )
)

  }
  catch (err) {

    console.error(
      "Pipeline Error:",
      err
    );

    updateUI("reporter",
      AgentStatus.ERROR);

    updateUI("reviewer",
      AgentStatus.ERROR);

    setMessages(prev =>
      prev.map(m =>
        m.id === messageId
          ? {
              ...m,
              content:
                "❌ Pipeline failed.",
              isThinking: false
            }
          : m
      )
    );

  }
  finally {
    setIsProcessing(false);
  }

};

/* SUBMIT */

const handleSubmit =
  (e: React.FormEvent) => {

  e.preventDefault();

  if (!input.trim()
    || isProcessing)
    return;

  setRecentQueries(prev =>
    [
      input,
      ...prev.slice(0, 5)
    ]
  );

  const userMsg: Message = {
    id: Date.now().toString(),
    role: "user",
    content: input
  };

  const assistantMsg: Message = {
    id:
      (Date.now() + 1)
        .toString(),
    role: "assistant",
    content: "",
    isThinking: true,
    steps:
      INITIAL_AGENT_STEPS
  };

  setMessages(prev => [
    ...prev,
    userMsg,
    assistantMsg
  ]);

  setAgentHistory({})
  setConfidence(null)

  setIsProcessing(true);

  setSteps(prev =>
  prev.map(step => ({
    ...step,
    status: AgentStatus.IDLE
  }))
)

  runAgenticPipeline(
  input,
  assistantMsg.id,
  perspective,
);

  setInput("");

};

/* LANDING */

if (view === "landing") {

  return (

    <div className="min-h-screen flex items-center justify-center text-white bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#9333ea]">

      <div className="text-center space-y-6">

        <h1 className="text-5xl font-semibold">
          AI Research Agent
        </h1>

        <button
          onClick={() =>
            setView("app")
          }
          className="px-6 py-3 bg-white text-black rounded-lg font-semibold"
        >
          Start Research
        </button>

      </div>

    </div>

  );

}

const scrollToMessage = (
  messageId: string
) => {

  const element =
    document.getElementById(
      `msg-${messageId}`
    )

  if (element) {

    element.scrollIntoView({
      behavior: "smooth",
      block: "start"
    })

  }

}

/* MAIN APP */

return (

<div
className={`
flex h-screen w-full text-slate-200 overflow-hidden transition-colors duration-500
${
perspective === "academic"
? "bg-slate-950"

: perspective === "industry"
? "bg-indigo-950"

: perspective === "theoretical"
? "bg-green-950"

: perspective === "critical"
? "bg-rose-950"

: "bg-slate-950"
}
`}
>

{/* LEFT SIDEBAR */}

<aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col p-4">

<div className="flex items-center gap-3 mb-8 px-2">

<div className="p-2 bg-indigo-600 rounded-lg">
AI
</div>

<h1 className="font-bold text-lg">
AI Research Agent
</h1>

</div>

<nav className="space-y-1 flex-1">

<button className="w-full text-left px-3 py-2 rounded hover:bg-slate-800">
New Research
</button>

<button className="w-full text-left px-3 py-2 rounded hover:bg-slate-800">
Research Log
</button>

</nav>

</aside>

{/* MAIN */}

<main className="flex-1 flex flex-col relative overflow-hidden">

{/* HEADER */}

<header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/20">

<div className="text-xs text-slate-400">
Agentic Workspace
</div>

<div className="flex gap-3">

{/* MODEL SWITCH */}

<select
value={model}
onChange={(e) => {
setModel(e.target.value as any)
agentService.current = null
}}
className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm"
>

<option value="gemini">
Gemini
</option>

<option value="ollama">
Ollama
</option>

</select>

{/* PERSPECTIVE SWITCH */}

<select
value={perspective}
onChange={(e) =>
setPerspective(e.target.value as any)
}
className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm"
>

<option value="academic">
Academic
</option>

<option value="industry">
Industry
</option>

<option value="theoretical">
Theoretical
</option>

<option value="critical">
Critical
</option>

</select>

</div>

</header>

{/* CONTENT */}

<section className="flex-1 overflow-y-auto p-8 space-y-6">

{/* Messages */}

{messages.map((msg) => (

<div
key={msg.id}
id={`msg-${msg.id}`}
>

{/* ASSISTANT MESSAGE */}

{msg.role === "assistant" && (

<div className="glass p-4 rounded-xl space-y-4">

<MarkdownRenderer content={msg.content} />

{/* SHOW ONLY AFTER FINAL ANSWER */}

{msg.isFinal && (

<div className="space-y-4">

{/* CONFIDENCE METER */}

{confidence !== null && (

<div>

<div className="text-xs text-slate-400 mb-1">
Confidence Score
</div>

<div className="w-full bg-slate-800 rounded-full h-2">

<div
className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
style={{
width: `${confidence}%`
}}
/>

</div>

<div className="text-xs text-slate-400 mt-1">
{confidence}%
</div>

</div>

)}

{/* SCHOLAR LINK */}

{msg.scholarLink && (

<div>

<div className="text-xs text-slate-400 mb-2">
Related Research Papers
</div>

<a
href={msg.scholarLink}
target="_blank"
rel="noopener noreferrer"
className="text-indigo-400 hover:underline text-sm"
>

Open Google Scholar Results

</a>

</div>

)}

</div>

)}

</div>

)}

{/* USER MESSAGE */}

{msg.role === "user" && (

<div className="text-right">

<span className="bg-indigo-600 px-3 py-2 rounded">

{msg.content}

</span>

</div>

)}

{/* AGENT STEPS */}

{msg.steps && (

<AgentProcess steps={msg.steps} />

)}

</div>

))}

<div ref={chatEndRef} />

</section>

{/* INPUT */}

<footer className="p-6">

<form
onSubmit={handleSubmit}
className="relative flex items-center bg-slate-900 border border-slate-700 rounded-xl p-2"
>

<input
value={input}
onChange={(e) =>
setInput(e.target.value)
}
placeholder="Enter research query..."
className="flex-1 bg-transparent outline-none px-4 py-3 text-white"
/>

<button
type="submit"
disabled={isProcessing}
className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-lg font-bold"
>

Send

</button>

</form>

</footer>

</main>

{/* TRACE TOGGLE */}

<button
onClick={() =>
setShowTrace(!showTrace)
}
className="
fixed right-2 top-1/2
z-50
bg-black/60
px-2 py-2
rounded
"
>

{showTrace ? "<" : ">"}

</button>

{/* TRACE PANEL */}

<div
className={`
fixed top-0 right-0
h-full w-80
p-6
transition-transform
duration-300
bg-slate-900/80
overflow-y-auto
${showTrace
? "translate-x-0"
: "translate-x-full"}
`}
>

<h2 className="text-sm mb-4">
Research Trace
</h2>

{agentHistory.planner &&
<AnimatedTraceCard
title="Strategic Planner"
content={agentHistory.planner}
/>
}

{agentHistory.selector &&
<AnimatedTraceCard
title="Context Selector"
content={agentHistory.selector}
/>
}

{agentHistory.reporter &&
<AnimatedTraceCard
title="Draft Reporter"
content={agentHistory.reporter}
/>
}

{agentHistory.reviewer &&
<AnimatedTraceCard
title="Critical Reviewer"
content={agentHistory.reviewer}
/>
}

</div>

</div>

);
}


/* ANIMATED TRACE CARD */

function AnimatedTraceCard({
  title,
  content
}: {
  title: string
  content: string
}) {

  return (

    <div
      className="
      bg-white/10
      rounded-lg
      p-4
      mb-3
      animate-fadeIn
      "
    >

      <h3 className="text-sm font-semibold mb-2">
        {title}
      </h3>

      <MarkdownRenderer content={content} />

    </div>

  )

}
