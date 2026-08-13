export interface AgentService {

  // STEP 1 — Planner + Selector

  planAndSelect(
    query: string
  ): Promise<{
    planText: string
    selector: {
      focus: string
      rationale: string
    }
  }>

  // STEP 2 — Reporter + Reviewer

  reportAndReview(
    query: string,
    context: string,
    perspective: any
  ): Promise<{
    draft: string
    review: string
  }>

  // STEP 3 — Final Synthesizer

  finalSynthesizerAgent(
    query: string,
    draft: string,
    review: string,
    perspective: any
  ): Promise<{
    content: string
    metadata?: any
  }>

}