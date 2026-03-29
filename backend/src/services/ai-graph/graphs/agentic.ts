import { END, START, StateGraph } from '@langchain/langgraph'
import { agenticDecisionNode } from '../nodes/agentic-decision'
import { agenticRetrieveNode } from '../nodes/agentic-retrieve'
import { crossEncoderNode } from '../nodes/cross-encoder'
import { embeddingNode } from '../nodes/embedding'
import { filterBuildNode } from '../nodes/filter-build'
import { hybridSearchNode } from '../nodes/hybrid-search'
import { judgeNode } from '../nodes/judge'
import { llmGenerationNode } from '../nodes/llm-generation'
import { memoryExtractorNode } from '../nodes/memory-extractor'
import { mmrNode } from '../nodes/mmr'
import { popularityRerankNode } from '../nodes/popularity-rerank'
import { selfReflectionNode } from '../nodes/self-reflection'
import { semanticCacheNode } from '../nodes/semantic-cache'
import { textToSqlNode } from '../nodes/text-to-sql'
import { toolSelectionNode } from '../nodes/tool-selection'
import {
  routeAfterAgenticRetrieve,
  routeAfterJudge,
  routeAfterSelfReflection,
  routeAfterSemanticCache,
  routeAfterTextToSql,
  routeAfterToolSelection,
  routeAgenticDecision,
} from '../routing'
import { GraphStateAnnotation } from '../state'

export function buildAgenticGraph() {
  const graph = new StateGraph(GraphStateAnnotation)
    .addNode('semanticCache', semanticCacheNode)
    .addNode('toolSelection', toolSelectionNode)
    .addNode('textToSql', textToSqlNode)
    .addNode('filterBuild', filterBuildNode)
    .addNode('embedding', embeddingNode)
    .addNode('agenticDecision', agenticDecisionNode)
    .addNode('agenticRetrieve', agenticRetrieveNode)
    .addNode('hybridSearch', hybridSearchNode)
    .addNode('crossEncoder', crossEncoderNode)
    .addNode('mmr', mmrNode)
    .addNode('popularityRerank', popularityRerankNode)
    .addNode('llmGeneration', llmGenerationNode)
    .addNode('judge', judgeNode)
    .addNode('selfReflection', selfReflectionNode)
    .addNode('memoryExtractor', memoryExtractorNode)

  graph.addEdge(START, 'semanticCache')
  graph.addConditionalEdges('semanticCache', routeAfterSemanticCache, {
    END,
    toolSelection: 'toolSelection',
  })
  // Agentic 策略：先經過 filterBuild 建構結構化約束（crag、grade 等），再進入 agentic 迭代
  graph.addConditionalEdges('toolSelection', routeAfterToolSelection, {
    textToSql: 'textToSql',
    filterBuild: 'filterBuild',
    llmGeneration: 'llmGeneration',
    END,
  })
  graph.addConditionalEdges('textToSql', routeAfterTextToSql, {
    llmGeneration: 'llmGeneration',
    embedding: 'filterBuild', // SQL 無結果 fallback → filterBuild → embedding → agentic
    END,
  })
  graph.addEdge('filterBuild', 'embedding')
  graph.addEdge('embedding', 'agenticDecision')
  graph.addConditionalEdges('agenticDecision', routeAgenticDecision, {
    agenticRetrieve: 'agenticRetrieve',
    llmGeneration: 'llmGeneration',
    END,
  })
  graph.addConditionalEdges('agenticRetrieve', routeAfterAgenticRetrieve, {
    agenticDecision: 'agenticDecision',
    llmGeneration: 'llmGeneration',
  })
  graph.addEdge('llmGeneration', 'judge')
  graph.addConditionalEdges('judge', routeAfterJudge, {
    selfReflection: 'selfReflection',
    memoryExtractor: 'memoryExtractor',
  })
  graph.addConditionalEdges('selfReflection', routeAfterSelfReflection, {
    hybridSearch: 'hybridSearch',
    llmGeneration: 'llmGeneration',
  })
  graph.addEdge('hybridSearch', 'crossEncoder')
  graph.addEdge('crossEncoder', 'mmr')
  graph.addEdge('mmr', 'popularityRerank')
  graph.addEdge('popularityRerank', 'agenticDecision')
  graph.addEdge('memoryExtractor', END)

  return graph.compile()
}

export const agenticGraph = buildAgenticGraph()
