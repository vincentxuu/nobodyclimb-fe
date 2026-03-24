import { StateGraph, END, START } from '@langchain/langgraph';
import { GraphStateAnnotation } from '../state';
import { semanticCacheNode } from '../nodes/semantic-cache';
import { toolSelectionNode } from '../nodes/tool-selection';
import { filterBuildNode } from '../nodes/filter-build';
import { embeddingNode } from '../nodes/embedding';
import { hydeNode } from '../nodes/hyde';
import { multiQueryNode } from '../nodes/multi-query';
import { textToSqlNode } from '../nodes/text-to-sql';
import { hybridSearchNode } from '../nodes/hybrid-search';
import { crossEncoderNode } from '../nodes/cross-encoder';
import { mmrNode } from '../nodes/mmr';
import { popularityRerankNode } from '../nodes/popularity-rerank';
import { llmGenerationNode } from '../nodes/llm-generation';
import { judgeNode } from '../nodes/judge';
import { selfReflectionNode } from '../nodes/self-reflection';
import { memoryExtractorNode } from '../nodes/memory-extractor';
import {
  routeAfterSemanticCache,
  routeAfterToolSelection,
  routeAfterTextToSql,
  routeAfterEmbedding,
  routeAfterJudge,
  routeAfterSelfReflection,
} from '../routing';

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
    .addNode('memoryExtractor', memoryExtractorNode);

  // Edges
  graph.addEdge(START, 'semanticCache');
  graph.addConditionalEdges('semanticCache', routeAfterSemanticCache, {
    END,
    toolSelection: 'toolSelection',
  });
  graph.addConditionalEdges('toolSelection', routeAfterToolSelection, {
    textToSql: 'textToSql',
    filterBuild: 'filterBuild',
    llmGeneration: 'llmGeneration',
    END,
  });
  graph.addConditionalEdges('textToSql', routeAfterTextToSql, {
    llmGeneration: 'llmGeneration',
    embedding: 'embedding',
    END,
  });
  graph.addEdge('filterBuild', 'embedding');
  graph.addConditionalEdges('embedding', routeAfterEmbedding, {
    hyde: 'hyde',
    hybridSearch: 'hybridSearch',
  });
  graph.addEdge('hyde', 'multiQuery');
  graph.addEdge('multiQuery', 'hybridSearch');
  graph.addEdge('hybridSearch', 'crossEncoder');
  graph.addEdge('crossEncoder', 'mmr');
  graph.addEdge('mmr', 'popularityRerank');
  graph.addEdge('popularityRerank', 'llmGeneration');
  graph.addEdge('llmGeneration', 'judge');
  graph.addConditionalEdges('judge', routeAfterJudge, {
    selfReflection: 'selfReflection',
    memoryExtractor: 'memoryExtractor',
  });
  graph.addConditionalEdges('selfReflection', routeAfterSelfReflection, {
    hybridSearch: 'hybridSearch',
    llmGeneration: 'llmGeneration',
  });
  graph.addEdge('memoryExtractor', END);

  return graph.compile();
}

export const baselineGraph = buildBaselineGraph();
