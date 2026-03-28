import { GraphState } from '../state';
import { startSpan, endSpan } from '../../../utils/langfuse';

export async function filterBuildNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'filter-build', {
    query: state.request.query,
  });
  try {
    const { request, trace, queryService } = state;
    const { query } = request;
    const vectorFilter: Record<string, unknown> = { ...(state.vectorFilter ?? {}) };

    // similar route 路徑已在 tool-selection 建立 filter，跳過
    if (state.isSimRouteSearch) {
      endSpan(span, { output: { skipped: true, reason: 'sim_route_search' } });
      return { vectorFilter };
    }

    const parsedQuery = state.parsedQuery;
    const preloadedCrags = state.preloadedCrags ?? [];
    const preloadedAreas = state.preloadedAreas ?? [];

    const newTrace: Record<string, unknown> = { ...trace };

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
      newTrace['query_parsing'] = {
        tool: null as string | null,
        query_type: state.queryType,
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
    const filterSource = state.isSimRouteSearch ? 'sim_route' : (newTrace['query_parsing'] ? 'llm_parsed' : 'regex_fallback');
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

    newTrace['filter'] = {
      applied: vectorFilter,
      source: filterSource,
      ...(Object.keys(matchedTexts).length > 0 ? { matched_texts: matchedTexts } : {}),
      ...(Object.keys(resolvedIds).length > 0 ? { resolved_ids: resolvedIds } : {}),
    };

    // Context 補充：對話歷史補充位置
    const recentHistory = state.recentHistory;
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

    const filterTrace = newTrace['filter'] as Record<string, unknown>;
    filterTrace.history_supplemented = historySupplementedLocation;
    if (historySupplementedLocation) {
      const historyText = recentHistory.map((m) => m.content).join(' ');
      const existingMatchedTexts = (filterTrace.matched_texts as Record<string, string> | undefined) ?? {};
      filterTrace.matched_texts = { ...existingMatchedTexts, from_history: historyText.slice(0, 100) };
    }
    newTrace['filter'] = filterTrace;

    endSpan(span, { output: { filterSource, filterKeys: Object.keys(vectorFilter) } });
    return {
      vectorFilter,
      trace: newTrace,
    };
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } });
    throw err;
  }
}
