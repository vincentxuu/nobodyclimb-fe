import { PipelineStep, PipelineContext } from '../types';

export const filterBuildStep: PipelineStep = {
  id: 'filter-build',
  name: 'Filter 建構',
  description: '從查詢中提取 grade/crag/region/area 過濾條件',
  phase: 'pre-retrieval',
  defaultEnabled: true,
  defaultOrder: 5,
  requires: ['queryType'],
  provides: ['vectorFilter'],
  skipWhen: [{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed'] }],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const { request, trace, queryService } = ctx;
    const { query } = request;
    const vectorFilter = ctx.vectorFilter ?? {};

    // similar route 路徑已在 tool-selection 建立 filter，跳過
    if (ctx.isSimRouteSearch) {
      ctx.vectorFilter = vectorFilter;
      return ctx;
    }

    const parsedQuery = ctx.parsedQuery;
    const preloadedCrags = ctx.preloadedCrags ?? [];
    const preloadedAreas = ctx.preloadedAreas ?? [];

    if (parsedQuery) {
      const builtFilters = await queryService.buildFiltersFromParsed(parsedQuery);

      Object.assign(vectorFilter, builtFilters);

      // 補充保底：LLM 未抽取 grade
      if (!vectorFilter['grade_numeric']) {
        const gradeFilter = queryService.extractGradeFilter(query);
        if (gradeFilter) vectorFilter['grade_numeric'] = gradeFilter;
      }

      // 補充保底：多岩場偵測
      const locationFilter = queryService.extractLocationFilter(query, preloadedCrags, preloadedAreas);

      if (locationFilter.areaId && !vectorFilter['area_id']) {
        vectorFilter['area_id'] = { $eq: locationFilter.areaId };
      } else if (locationFilter.cragIds && locationFilter.cragIds.length > 1) {
        vectorFilter['crag_id'] = { $in: locationFilter.cragIds };
      } else if (locationFilter.cragIds && locationFilter.cragIds.length === 1 && !vectorFilter['crag_id']) {
        vectorFilter['crag_id'] = { $eq: locationFilter.cragIds[0] };
      } else if (locationFilter.region && !vectorFilter['crag_id'] && !vectorFilter['area_id'] && !vectorFilter['region']) {
        vectorFilter['region'] = { $eq: locationFilter.region };
      }
    } else {
      // Fallback：regex 方法
      trace.query_parsing = {
        tool: null as string | null,
        query_type: ctx.queryType,
        alternatives: ['search_routes', 'search_crags', 'general_knowledge'],
        params: {},
        fallback_used: true,
      };

      const gradeFilter = queryService.extractGradeFilter(query);
      const locationFilter = queryService.extractLocationFilter(query, preloadedCrags, preloadedAreas);
      const typeFilter = queryService.extractTypeFilter(query);

      if (gradeFilter) vectorFilter['grade_numeric'] = gradeFilter;
      if (locationFilter.areaId) {
        vectorFilter['area_id'] = { $eq: locationFilter.areaId };
        vectorFilter['type'] = { $eq: 'route' };
      } else if (locationFilter.cragIds && locationFilter.cragIds.length > 0) {
        vectorFilter['crag_id'] = locationFilter.cragIds.length === 1 ? { $eq: locationFilter.cragIds[0] } : { $in: locationFilter.cragIds };
        if (typeFilter) vectorFilter['type'] = { $eq: typeFilter };
      } else if (locationFilter.region) {
        vectorFilter['region'] = { $eq: locationFilter.region };
        if (typeFilter) vectorFilter['type'] = { $eq: typeFilter };
      } else if (typeFilter) {
        vectorFilter['type'] = { $eq: typeFilter };
      }
    }

    // filter trace
    const filterSource = ctx.isSimRouteSearch ? 'sim_route' : (trace.query_parsing ? 'llm_parsed' : 'regex_fallback');
    const matchedTexts: Record<string, string> = {};
    if (parsedQuery?.params) {
      const p = parsedQuery.params as Record<string, string | undefined>;
      if (p.area_name) matchedTexts.area_name = p.area_name;
      if (p.crag_name) matchedTexts.crag_name = p.crag_name;
      if (p.grade) matchedTexts.grade = p.grade;
      if (p.route_type) matchedTexts.route_type = p.route_type;
      if (p.region) matchedTexts.region = p.region;
    }
    const resolvedIds: Record<string, string | string[] | null> = {};
    const areaIdVal = vectorFilter['area_id'] as { $eq?: string } | undefined;
    if (areaIdVal?.$eq) resolvedIds.area_id = areaIdVal.$eq;
    const cragIdVal = vectorFilter['crag_id'] as { $eq?: string; $in?: string[] } | undefined;
    if (cragIdVal?.$eq) resolvedIds.crag_id = cragIdVal.$eq;
    else if (cragIdVal?.$in) resolvedIds.crag_id = cragIdVal.$in;
    trace.filter = {
      applied: vectorFilter,
      source: filterSource,
      ...(Object.keys(matchedTexts).length > 0 ? { matched_texts: matchedTexts } : {}),
      ...(Object.keys(resolvedIds).length > 0 ? { resolved_ids: resolvedIds } : {}),
    };

    // Context 補充：對話歷史補充位置
    const recentHistory = ctx.recentHistory;
    let historySupplementedLocation = false;
    const hasExplicitLocationFilter = !!(vectorFilter['crag_id'] || vectorFilter['area_id'] || vectorFilter['region']);
    if (!hasExplicitLocationFilter && recentHistory.length > 0 && queryService.isContextDependentQuery(query)) {
      const historyText = recentHistory.map((m) => m.content).join(' ');
      const historyLocation = queryService.extractLocationFilter(historyText, preloadedCrags, preloadedAreas);

      if (historyLocation.areaId) {
        vectorFilter['area_id'] = { $eq: historyLocation.areaId };
        vectorFilter['type'] = { $eq: 'route' };
        historySupplementedLocation = true;
      } else if (historyLocation.cragIds && historyLocation.cragIds.length > 0) {
        vectorFilter['crag_id'] = historyLocation.cragIds.length === 1
          ? { $eq: historyLocation.cragIds[0] }
          : { $in: historyLocation.cragIds };
        if (!vectorFilter['type']) vectorFilter['type'] = { $eq: 'route' };
        historySupplementedLocation = true;
      } else if (historyLocation.region) {
        vectorFilter['region'] = { $eq: historyLocation.region };
        historySupplementedLocation = true;
      } else {
        const routeRef = await queryService.extractRouteReference(historyText);
        if (routeRef?.cragId) {
          vectorFilter['crag_id'] = { $eq: routeRef.cragId };
          if (!vectorFilter['type']) vectorFilter['type'] = { $eq: 'route' };
          historySupplementedLocation = true;
        }
      }
    }

    if (trace.filter) {
      const filterTrace = trace.filter as Record<string, unknown>;
      filterTrace.history_supplemented = historySupplementedLocation;
      if (historySupplementedLocation) {
        const historyText = recentHistory.map((m) => m.content).join(' ');
        const existingMatchedTexts = (filterTrace.matched_texts as Record<string, string> | undefined) ?? {};
        filterTrace.matched_texts = { ...existingMatchedTexts, from_history: historyText.slice(0, 100) };
      }
    }

    ctx.vectorFilter = vectorFilter;
    return ctx;
  },
};
