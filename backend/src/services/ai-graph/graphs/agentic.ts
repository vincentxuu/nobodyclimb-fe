import { StateGraph, END, START } from '@langchain/langgraph';
import { GraphStateAnnotation } from '../state';
import { semanticCacheNode } from '../nodes/semantic-cache';
import { toolSelectionNode } from '../nodes/tool-selection';
import { textToSqlNode } from '../nodes/text-to-sql';
import { agenticDecisionNode } from '../nodes/agentic-decision';
import { agenticRetrieveNode } from '../nodes/agentic-retrieve';
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
  routeAgenticDecision,
  routeAfterAgenticRetrieve,
  routeAfterJudge,
  routeAfterSelfReflection,
} from '../routing';

export function buildAgenticGraph() {
  const graph = new StateGraph(GraphStateAnnotation)
    .addNode('semanticCache', semanticCacheNode)
    .addNode('toolSelection', toolSelectionNode)
    .addNode('textToSql', textToSqlNode)
    .addNode('agenticDecision', agenticDecisionNode)
    .addNode('agenticRetrieve', agenticRetrieveNode)
    .addNode('hybridSearch', hybridSearchNode)
    .addNode('crossEncoder', crossEncoderNode)
    .addNode('mmr', mmrNode)
    .addNode('popularityRerank', popularityRerankNode)
    .addNode('llmGeneration', llmGenerationNode)
    .addNode('judge', judgeNode)
    .addNode('selfReflection', selfReflectionNode)
    .addNode('memoryExtractor', memoryExtractorNode);

  graph.addEdge(START, 'semanticCache');
  graph.addConditionalEdges('semanticCache', routeAfterSemanticCache, {
    END,
    toolSelection: 'toolSelection',
  });
  // Agentic 策略：tool-selection 後向量搜尋路徑導向 agenticDecision（而非 filterBuild）
  graph.addConditionalEdges('toolSelection', routeAfterToolSelection, {
    textToSql: 'textToSql',          // SQL 路徑
    filterBuild: 'agenticDecision',  // 向量搜尋路徑 → agentic decision
    llmGeneration: 'llmGeneration',
    END,
  });
  graph.addConditionalEdges('textToSql', routeAfterTextToSql, {
    llmGeneration: 'llmGeneration',
    embedding: 'agenticDecision',  // SQL 無結果 fallback → agentic decision
    END,
  });
  graph.addConditionalEdges('agenticDecision', routeAgenticDecision, {
    agenticRetrieve: 'agenticRetrieve',
    llmGeneration: 'llmGeneration',
    END,
  });
  graph.addConditionalEdges('agenticRetrieve', routeAfterAgenticRetrieve, {
    agenticDecision: 'agenticDecision',
    llmGeneration: 'llmGeneration',
  });
  graph.addEdge('llmGeneration', 'judge');
  graph.addConditionalEdges('judge', routeAfterJudge, {
    selfReflection: 'selfReflection',
    memoryExtractor: 'memoryExtractor',
  });
  graph.addConditionalEdges('selfReflection', routeAfterSelfReflection, {
    hybridSearch: 'hybridSearch',
    llmGeneration: 'llmGeneration',
  });
  graph.addEdge('hybridSearch', 'crossEncoder');
  graph.addEdge('crossEncoder', 'mmr');
  graph.addEdge('mmr', 'popularityRerank');
  graph.addEdge('popularityRerank', 'agenticDecision');
  graph.addEdge('memoryExtractor', END);

  return graph.compile();
}

export const agenticGraph = buildAgenticGraph();
