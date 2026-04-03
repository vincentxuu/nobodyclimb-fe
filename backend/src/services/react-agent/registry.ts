import type { ToolSchema } from '../ai-graph/providers/types'
import type { Tool, ToolContext } from './types'

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map()

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool)
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  getTools(tags?: string[]): Tool[] {
    const all = Array.from(this.tools.values())
    if (!tags || tags.length === 0) return all
    return all.filter((t) => t.tags.some((tag) => tags.includes(tag)))
  }

  /** 移除指定 tool（用於重複失敗保護） */
  removeTool(name: string): void {
    this.tools.delete(name)
  }

  /** 取得所有 tool 名稱 */
  getToolNames(): string[] {
    return Array.from(this.tools.keys())
  }

  /** 將所有 tool 轉為 LLM tool_use API schema 格式 */
  toAPISchema(ctx: ToolContext, tags?: string[]): ToolSchema[] {
    return this.getTools(tags).map((tool) => ({
      name: tool.name,
      description: tool.prompt(ctx),
      parameters: tool.parameters,
    }))
  }

  /**
   * 動態生成 system prompt 的工具說明區塊。
   * 每個 tool 的描述來自 tool.prompt(ctx)，可根據 context（如是否登入）調整內容。
   * 供 buildReactAgentBasePrompt() 使用。
   */
  toSystemPromptSection(ctx: ToolContext): string {
    return this.getTools()
      .map((tool) => `- **${tool.name}**：${tool.prompt(ctx)}`)
      .join('\n')
  }
}
