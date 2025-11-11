/**
 * API 모듈 통합 export
 */

export { createApiClient, callEdgeFunction, ApiClient } from './client'
export type { ApiClientOptions, RequestOptions, EdgeFunctionOptions } from './client'

export { createEdgeFunctionClient } from './edge-functions'
export type {
  EdgeFunctionClient,
  AnalyzeRequest,
  AnalyzeResponse,
  SaveAnalysisRequest,
  SaveAnalysisResponse,
} from './edge-functions'

