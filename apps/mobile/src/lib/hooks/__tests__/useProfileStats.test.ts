import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useProfileStats } from '../useProfileStats'
import { apiClient } from '@/lib/api'

jest.mock('@/lib/api')
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useProfileStats', () => {
  it('calls GET /users/me/stats and returns data', async () => {
    const mockStats = { total_ascents: 42, max_grade: '5.12a', crags_visited: 10 }
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: mockStats } })
    const { result } = renderHook(() => useProfileStats(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedApiClient.get).toHaveBeenCalledWith('/users/me/stats')
    expect(result.current.data).toEqual(mockStats)
  })

  it('sets isError when the request fails', async () => {
    mockedApiClient.get.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useProfileStats(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
