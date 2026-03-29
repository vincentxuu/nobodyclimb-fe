import { END, START, StateGraph } from '@langchain/langgraph'
import { crossEncoderNode } from '../nodes/cross-encoder'
import { embeddingNode } from '../nodes/embedding'
import { filterBuildNode } from '../nodes/filter-build'
import { hybridSearchNode } from '../nodes/hybrid-search'
import { hydeNode } from '../nodes/hyde'
import { judgeNode } from '../nodes/judge'
import { llmGenerationNode } from '../nodes/llm-generation'
import { memoryExtractorNode } from '../nodes/memory-extractor'
import { mmrNode } from '../nodes/mmr'
import { multiQueryNode } from '../nodes/multi-query'
import { popularityRerankNode } from '../nodes/popularity-rerank'
import { selfReflectionNode } from '../nodes/self-reflection'
import { semanticCacheNode } from '../nodes/semantic-cache'
import { textToSqlNode } from '../nodes/text-to-sql'
import { toolSelectionNode } from '../nodes/tool-selection'
import {
  routeAfterEmbedding,
  routeAfterJudge,
  routeAfterSelfReflection,
  routeAfterSemanticCache,
  routeAfterTextToSql,
  routeAfterToolSelection,
} from '../routing'
import { GraphStateAnnotation } from '../state'

export function buildBaselineGraph() {
  const graph = new StateGraph(GraphStateAnnotation)
    .addNode('semanticCache', semanticCacheNode)
    .addNode('toolSelection', toolSelectionNode)
    .addNode('textToSql', textToSqlNode)
    .addNode('filterBuild', filterBuildNode)
    .addNode('embedding', embeddingNode)
    .addNode('hyde', hydeNode)
    .addNode('multiQuery', multiQueryNode)
    .addNode('hybridSearch', hybridSearchNode)
    .addNode('crossEncoder', crossEncoderNode)
    .addNode('mmr', mmrNode)
    .addNode('popularityRerank', popularityRerankNode)
    .addNode('llmGeneration', llmGenerationNode)
    .addNode('judge', judgeNode)
    .addNode('selfReflection', selfReflectionNode)
    .addNode('memoryExtractor', memoryExtractorNode)

  // Edges
  graph.addEdge(START, 'semanticCache')
  graph.addConditionalEdges('semanticCache', routeAfterSemanticCache, {
    END,
    toolSelection: 'toolSelection',
  })
  graph.addConditionalEdges('toolSelection', routeAfterToolSelection, {
    textToSql: 'textToSql',
    filterBuild: 'filterBuild',
    llmGeneration: 'llmGeneration',
    END,
  })
  graph.addConditionalEdges('textToSql', routeAfterTextToSql, {
    llmGeneration: 'llmGeneration',
    embedding: 'embedding',
    END,
  })
  graph.addEdge('filterBuild', 'embedding')
  graph.addConditionalEdges('embedding', routeAfterEmbedding, {
    hyde: 'hyde',
    hybridSearch: 'hybridSearch',
  })
  graph.addEdge('hyde', 'multiQuery')
  graph.addEdge('multiQuery', 'hybridSearch')
  graph.addEdge('hybridSearch', 'crossEncoder')
  graph.addEdge('crossEncoder', 'mmr')
  graph.addEdge('mmr', 'popularityRerank')
  graph.addEdge('popularityRerank', 'llmGeneration')
  graph.addEdge('llmGeneration', 'judge')
  graph.addConditionalEdges('judge', routeAfterJudge, {
    selfReflection: 'selfReflection',
    memoryExtractor: 'memoryExtractor',
  })
  graph.addConditionalEdges('selfReflection', routeAfterSelfReflection, {
    hybridSearch: 'hybridSearch',
    llmGeneration: 'llmGeneration',
  })
  graph.addEdge('memoryExtractor', END)

  return graph.compile()
}

export const baselineGraph = buildBaselineGraph()
