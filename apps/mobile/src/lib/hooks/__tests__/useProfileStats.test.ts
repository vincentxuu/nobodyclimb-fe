import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import { createElement } from 'react'
import { apiClient } from '@/lib/api'
import { useProfileStats } from '../useProfileStats'

jest.mock('@/lib/api')
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useProfileStats', () => {
  it('loads my biography first and returns biography stats', async () => {
    const mockBiography = { id: 'bio-1' }
    const mockStats = { total_views: 42, total_likes: 7 }
    mockedApiClient.get
      .mockResolvedValueOnce({ data: { data: mockBiography } })
      .mockResolvedValueOnce({ data: { data: mockStats } })

    const { result } = renderHook(() => useProfileStats(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(1, '/biographies/me')
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(2, '/biographies/bio-1/stats')
    expect(result.current.biography).toEqual(mockBiography)
    expect(result.current.data).toEqual(mockStats)
  })

  it('sets isError when the request fails', async () => {
    mockedApiClient.get.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useProfileStats(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
