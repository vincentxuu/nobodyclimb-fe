import { renderHook, waitFor, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useRecommendations, useTriggerRecommendation } from '../useRecommendations'
import { apiClient } from '@/lib/api'

jest.mock('@/lib/api')
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const MOCK_RESPONSE = {
  items: [
    {
      id: 'r1',
      triggered_by: 'ascent',
      status: 'success',
      recommendation: {
        answer: '推薦你嘗試龍洞南壁的 5.10a 路線',
        sources: [{ id: 's1', type: 'route', title: '藍色海灣', excerpt: '適合初中級者', url: 'https://example.com', score: 0.9 }],
        context_ascents: [],
      },
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  total: 1,
}

describe('useRecommendations', () => {
  it('fetches recommendations with default pagination', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: MOCK_RESPONSE } })
    const { result } = renderHook(() => useRecommendations(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(1)
    expect(mockedApiClient.get).toHaveBeenCalledWith('/ai/recommendations?offset=0&limit=10')
  })

  it('fetches recommendations with custom pagination', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: { items: [], total: 0 } } })
    const { result } = renderHook(() => useRecommendations(10, 5), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedApiClient.get).toHaveBeenCalledWith('/ai/recommendations?offset=10&limit=5')
  })
})

describe('useTriggerRecommendation', () => {
  it('posts to /ai/recommendations', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { data: {} } })
    const { result } = renderHook(() => useTriggerRecommendation(), { wrapper: createWrapper() })
    await act(async () => { await result.current.mutateAsync() })
    expect(mockedApiClient.post).toHaveBeenCalledWith('/ai/recommendations')
  })
})
