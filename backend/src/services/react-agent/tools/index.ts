import { ToolRegistry } from '../registry'
import { cragInfoTool } from './crag-info'
import { recommendTool } from './recommend'
import { searchCragsTool } from './search-crags'
import { searchRoutesTool } from './search-routes'
import { sqlQueryTool } from './sql-query'
import { userProfileTool } from './user-profile'
import { weatherTool } from './weather'

/** 建立並註冊所有 react-agent tools */
export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry()
  registry.registerTool(searchRoutesTool)
  registry.registerTool(searchCragsTool)
  registry.registerTool(sqlQueryTool)
  registry.registerTool(weatherTool)
  registry.registerTool(userProfileTool)
  registry.registerTool(recommendTool)
  registry.registerTool(cragInfoTool)
  return registry
}
