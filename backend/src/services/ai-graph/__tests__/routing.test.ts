// backend/src/services/ai-graph/__tests__/routing.test.ts
import { describe, it, expect } from 'vitest';
import {
  routeAfterSemanticCache,
  routeAfterToolSelection,
  routeAfterTextToSql,
  routeAfterEmbedding,
  routeAfterJudge,
  routeAfterSelfReflection,
  routeAgenticDecision,
  routeAfterAgenticRetrieve,
} from '../routing';

const baseCfg = {
  judge_regen_quality_max: 3,
  max_pipeline_loops: 2,
  self_reflection_min_length: 50,
  agentic_max_steps: 5,
  agentic_min_docs_to_answer: 3,
  rag_strategy: 'baseline',
} as any;

describe('routeAfterSemanticCache', () => {
  it('returns END when earlyReturn is set', () => {
    const state = { earlyReturn: { answer: 'cached' } } as any;
    expect(routeAfterSemanticCache(state)).toBe('END');
  });
  it('returns toolSelection when no earlyReturn', () => {
    const state = {} as any;
    expect(routeAfterSemanticCache(state)).toBe('toolSelection');
  });
});

describe('routeAfterToolSelection', () => {
  it('returns END when earlyReturn is set', () => {
    expect(routeAfterToolSelection({ earlyReturn: { answer: 'x' } } as any)).toBe('END');
  });
  it('returns textToSql when queryType === sql', () => {
    expect(routeAfterToolSelection({ queryType: 'sql' } as any)).toBe('textToSql');
  });
  it('returns END when queryType === clarification-needed', () => {
    expect(routeAfterToolSelection({ queryType: 'clarification-needed' } as any)).toBe('END');
  });
  it('returns llmGeneration when queryType === general-knowledge', () => {
    expect(routeAfterToolSelection({ queryType: 'general-knowledge' } as any)).toBe('llmGeneration');
  });
  it('returns filterBuild (via embedding path) for normal queries', () => {
    expect(routeAfterToolSelection({ queryType: 'vector' } as any)).toBe('filterBuild');
  });
});

describe('routeAfterTextToSql', () => {
  it('returns END (clarification/error) when earlyReturn is set', () => {
    expect(routeAfterTextToSql({ earlyReturn: { answer: 'x' } } as any)).toBe('END');
  });
  it('returns llmGeneration when sqlCandidates has results', () => {
    expect(routeAfterTextToSql({ sqlCandidates: [{ id: 1 }] } as any)).toBe('llmGeneration');
  });
  it('returns embedding when sqlCandidates is empty (fallback)', () => {
    expect(routeAfterTextToSql({ sqlCandidates: [] } as any)).toBe('embedding');
  });
  it('returns embedding when sqlCandidates is undefined (fallback)', () => {
    expect(routeAfterTextToSql({} as any)).toBe('embedding');
  });
});

describe('routeAfterEmbedding', () => {
  it('returns hybridSearch when embeddingFailed', () => {
    expect(routeAfterEmbedding({ embeddingFailed: true } as any)).toBe('hybridSearch');
  });
  it('returns hyde when embedding succeeds', () => {
    expect(routeAfterEmbedding({} as any)).toBe('hyde');
  });
});

describe('routeAfterJudge', () => {
  it('returns selfReflection when quality is low and under loop limit', () => {
    const state = {
      pipelineConfig: baseCfg,
      quality: 2,
      loopCount: 0,
      context: 'x'.repeat(100),
    } as any;
    expect(routeAfterJudge(state)).toBe('selfReflection');
  });
  it('returns memoryExtractor when quality is good', () => {
    const state = {
      pipelineConfig: baseCfg,
      quality: 5,
      loopCount: 0,
      context: 'x'.repeat(100),
    } as any;
    expect(routeAfterJudge(state)).toBe('memoryExtractor');
  });
  it('returns memoryExtractor when loop limit reached', () => {
    const state = {
      pipelineConfig: baseCfg,
      quality: 2,
      loopCount: 2,
      context: 'x'.repeat(100),
    } as any;
    expect(routeAfterJudge(state)).toBe('memoryExtractor');
  });
});

describe('routeAfterSelfReflection', () => {
  it('returns hybridSearch when loopBack.targetPhase === retrieval', () => {
    const state = { loopBack: { targetPhase: 'retrieval' } } as any;
    expect(routeAfterSelfReflection(state)).toBe('hybridSearch');
  });
  it('returns llmGeneration when no loopBack', () => {
    expect(routeAfterSelfReflection({} as any)).toBe('llmGeneration');
  });
  it('returns llmGeneration when loopBack.targetPhase is not retrieval', () => {
    const state = { loopBack: { targetPhase: 'generation' } } as any;
    expect(routeAfterSelfReflection(state)).toBe('llmGeneration');
  });
});

describe('routeAgenticDecision', () => {
  it('returns END when earlyReturn is set', () => {
    expect(routeAgenticDecision({ earlyReturn: { answer: 'x' } } as any)).toBe('END');
  });
  it('returns llmGeneration when lastAgenticAction === ANSWER', () => {
    expect(routeAgenticDecision({ trace: { lastAgenticAction: 'ANSWER' } } as any)).toBe('llmGeneration');
  });
  it('returns agenticRetrieve otherwise', () => {
    expect(routeAgenticDecision({ trace: { lastAgenticAction: 'RETRIEVE' } } as any)).toBe('agenticRetrieve');
  });
});

describe('routeAfterAgenticRetrieve', () => {
  it('returns llmGeneration when max steps reached', () => {
    const state = { pipelineConfig: baseCfg, loopCount: 5, candidateMatches: [] } as any;
    expect(routeAfterAgenticRetrieve(state)).toBe('llmGeneration');
  });
  it('returns llmGeneration when enough docs', () => {
    const state = {
      pipelineConfig: baseCfg,
      loopCount: 1,
      candidateMatches: [{}, {}, {}],
    } as any;
    expect(routeAfterAgenticRetrieve(state)).toBe('llmGeneration');
  });
  it('returns agenticDecision when under limits', () => {
    const state = {
      pipelineConfig: baseCfg,
      loopCount: 1,
      candidateMatches: [{}],
    } as any;
    expect(routeAfterAgenticRetrieve(state)).toBe('agenticDecision');
  });
});
