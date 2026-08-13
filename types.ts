
export enum AgentStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type AgentRole = 'planner' | 'selector' | 'reporter' | 'reviewer' | 'final';

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface PlannerOutput {
  plan: string[];
}

export interface SelectorOutput {
  focus: string;
  rationale: string;
}

export interface AgentResponse {
  content: string;
  metadata?: any;
}

export interface AgentStep {
  role: AgentRole;
  name: string;
  description: string;
  status: AgentStatus;
  output?: string;
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  steps?: AgentStep[]
  isThinking?: boolean
  

  isFinal?: boolean

  scholarLink?: string
  scholarKeywords?: string[]
  scholarQuery?: string
}

export type AppView = 'landing' | 'signin' | 'chat';
export interface AgentService {
  planAndSelect(query: string): Promise<any>

  reportAndReview(
    query: string,
    focus: string,
    perspective: string
  ): Promise<any>

  finalSynthesizerAgent(
    query: string,
    draft: string,
    review: string,
    perspective: string
  ): Promise<any>
}
