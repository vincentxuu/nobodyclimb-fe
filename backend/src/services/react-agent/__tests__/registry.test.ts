import { describe, expect, it } from 'vitest'
import { ToolRegistry } from '../registry'
import type { Tool, ToolContext } from '../types'

function makeTool(overrides: Partial<Tool> = {}): Tool {
  return {
    name: 'test_tool',
    tags: ['test'],
    alwaysLoad: true,
    concurrencySafe: true,
    maxResultChars: 1000,
    cacheTTL: 0,
    parameters: { type: 'object', properties: {} },
    prompt: () => 'Test tool description',
    execute: async () => ({}),
    formatResult: () => ({ content: 'result' }),
    ...overrides,
  }
}

describe('ToolRegistry', () => {
  it('registers and retrieves tools', () => {
    const registry = new ToolRegistry()
    const tool = makeTool({ name: 'search_routes' })
    registry.registerTool(tool)
    expect(registry.getTool('search_routes')).toBe(tool)
    expect(registry.getTool('nonexistent')).toBeUndefined()
  })

  it('getTools returns all tools when no tags', () => {
    const registry = new ToolRegistry()
    registry.registerTool(makeTool({ name: 'a', tags: ['retrieval'] }))
    registry.registerTool(makeTool({ name: 'b', tags: ['data'] }))
    registry.registerTool(makeTool({ name: 'c', tags: ['user'] }))
    expect(registry.getTools()).toHaveLength(3)
  })

  it('getTools filters by tags', () => {
    const registry = new ToolRegistry()
    registry.registerTool(makeTool({ name: 'a', tags: ['retrieval'] }))
    registry.registerTool(makeTool({ name: 'b', tags: ['data', 'statistics'] }))
    registry.registerTool(makeTool({ name: 'c', tags: ['user'] }))

    expect(registry.getTools(['retrieval'])).toHaveLength(1)
    expect(registry.getTools(['data'])).toHaveLength(1)
    expect(registry.getTools(['retrieval', 'user'])).toHaveLength(2)
    expect(registry.getTools(['nonexistent'])).toHaveLength(0)
  })

  it('removeTool removes a tool', () => {
    const registry = new ToolRegistry()
    registry.registerTool(makeTool({ name: 'search_routes' }))
    expect(registry.getTools()).toHaveLength(1)
    registry.removeTool('search_routes')
    expect(registry.getTools()).toHaveLength(0)
    expect(registry.getTool('search_routes')).toBeUndefined()
  })

  it('removeTool is safe for nonexistent tools', () => {
    const registry = new ToolRegistry()
    expect(() => registry.removeTool('nonexistent')).not.toThrow()
  })

  it('getToolNames returns all tool names', () => {
    const registry = new ToolRegistry()
    registry.registerTool(makeTool({ name: 'a' }))
    registry.registerTool(makeTool({ name: 'b' }))
    expect(registry.getToolNames()).toEqual(['a', 'b'])
  })

  it('toAPISchema converts to LLM schema format', () => {
    const registry = new ToolRegistry()
    registry.registerTool(
      makeTool({
        name: 'search_routes',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
        },
        prompt: () => 'Search climbing routes',
      })
    )
    registry.registerTool(
      makeTool({
        name: 'weather',
        parameters: {
          type: 'object',
          properties: { crag: { type: 'string' } },
        },
        prompt: () => 'Check weather',
      })
    )

    const schemas = registry.toAPISchema({} as ToolContext)
    expect(schemas).toHaveLength(2)
    expect(schemas[0]).toEqual({
      name: 'search_routes',
      description: 'Search climbing routes',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    })
    expect(schemas[1]).toEqual({
      name: 'weather',
      description: 'Check weather',
      parameters: {
        type: 'object',
        properties: { crag: { type: 'string' } },
      },
    })
  })

  it('toAPISchema calls prompt with context', () => {
    const registry = new ToolRegistry()
    const ctx = { userId: 'user-123' } as ToolContext
    registry.registerTool(
      makeTool({
        name: 'user_profile',
        prompt: (c) => (c.userId ? 'Query user profile' : 'User not logged in'),
      })
    )

    const schemas = registry.toAPISchema(ctx)
    expect(schemas[0].description).toBe('Query user profile')

    const anonCtx = { userId: null } as ToolContext
    const anonSchemas = registry.toAPISchema(anonCtx)
    expect(anonSchemas[0].description).toBe('User not logged in')
  })

  it('toAPISchema with tag filter', () => {
    const registry = new ToolRegistry()
    registry.registerTool(makeTool({ name: 'a', tags: ['retrieval'] }))
    registry.registerTool(makeTool({ name: 'b', tags: ['data'] }))
    const schemas = registry.toAPISchema({} as ToolContext, ['retrieval'])
    expect(schemas).toHaveLength(1)
    expect(schemas[0].name).toBe('a')
  })
})
