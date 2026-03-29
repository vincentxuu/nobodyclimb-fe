import { END, Send, START, StateGraph } from '@langchain/langgraph'
import { executePlanStepNode } from '../nodes/execute-plan-step'
import { judgeNode } from '../nodes/judge'
import { llmGenerationNode } from '../nodes/llm-generation'
import { memoryExtractorNode } from '../nodes/memory-extractor'
import { planningNode } from '../nodes/planning'
import { selfReflectionNode } from '../nodes/self-reflection'
import { semanticCacheNode } from '../nodes/semantic-cache'
import { synthesisNode } from '../nodes/synthesis'
import { routeAfterJudge, routeAfterSelfReflection, routeAfterSemanticCache } from '../routing'
import { GraphState, GraphStateAnnotation } from '../state'

type PlanStep = { id: number; query: string; tool: string; filters: Record<string, unknown> }

/**
 * 將並行的 plan steps 分派為獨立的 Send 呼叫（map-reduce pattern）
 * 注意：只適合互相獨立的步驟
 */
function dispatchPlanSteps(state: GraphState): Send[] | string {
  const planSteps = (state.multiToolPlan?.steps ?? []) as unknown as PlanStep[]
  if (planSteps.length === 0) {
    return 'synthesis' // fallback if no steps
  }
  return planSteps.map((step) => new Send('executePlanStep', { ...state, currentPlanStep: step }))
}

export function buildPlanExecuteGraph() {
  const graph = new StateGraph(GraphStateAnnotation)
    .addNode('semanticCache', semanticCacheNode)
    .addNode('planning', planningNode)
    .addNode('executePlanStep', executePlanStepNode)
    .addNode('synthesis', synthesisNode)
    .addNode('llmGeneration', llmGenerationNode)
    .addNode('judge', judgeNode)
    .addNode('selfReflection', selfReflectionNode)
    .addNode('memoryExtractor', memoryExtractorNode)

  graph.addEdge(START, 'semanticCache')
  graph.addConditionalEdges('semanticCache', routeAfterSemanticCache, {
    END,
    toolSelection: 'planning',
  })
  graph.addConditionalEdges('planning', dispatchPlanSteps, ['executePlanStep', 'synthesis'])
  graph.addEdge('executePlanStep', 'synthesis')
  graph.addEdge('synthesis', 'llmGeneration')
  graph.addEdge('llmGeneration', 'judge')
  graph.addConditionalEdges('judge', routeAfterJudge, {
    selfReflection: 'selfReflection',
    memoryExtractor: 'memoryExtractor',
  })
  graph.addConditionalEdges('selfReflection', routeAfterSelfReflection, {
    hybridSearch: 'synthesis', // re-synthesize on self-reflection
    llmGeneration: 'llmGeneration',
  })
  graph.addEdge('memoryExtractor', END)

  return graph.compile()
}

export const planExecuteGraph = buildPlanExecuteGraph()
