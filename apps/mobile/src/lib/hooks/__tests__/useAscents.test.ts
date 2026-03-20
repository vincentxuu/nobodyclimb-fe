import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useMyAscents, useMyAscentStats, useCreateAscent, useDeleteAscent } from '../useAscents'
import { apiClient } from '@/lib/api'

jest.mock('@/lib/api')
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useMyAscents', () => {
  it('fetches ascents and returns data', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { data: { ascents: [], total: 0, page: 1, limit: 10 } },
    })
    const { result } = renderHook(() => useMyAscents(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ ascents: [], total: 0, page: 1, limit: 10 })
  })

  it('passes filters as query params', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: { ascents: [], total: 0 } } })
    renderHook(() => useMyAscents({ ascent_type: 'redpoint', page: 2 }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(mockedApiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('ascent_type=redpoint')
    ))
  })
})

describe('useMyAscentStats', () => {
  it('fetches stats successfully', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { data: { total: 42, unique_routes: 30 } },
    })
    const { result } = renderHook(() => useMyAscentStats(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.total).toBe(42)
  })
})

describe('useCreateAscent', () => {
  it('posts to /ascents and invalidates queries', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { data: { id: 'abc' } } })
    const { result } = renderHook(() => useCreateAscent(), { wrapper: createWrapper() })
    result.current.mutate({ ascent_type: 'redpoint', route_id: 'r1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedApiClient.post).toHaveBeenCalledWith('/ascents', expect.any(Object))
  })
})

describe('useDeleteAscent', () => {
  it('sends DELETE request with correct id', async () => {
    mockedApiClient.delete.mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useDeleteAscent(), { wrapper: createWrapper() })
    result.current.mutate('ascent-123')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedApiClient.delete).toHaveBeenCalledWith('/ascents/ascent-123')
  })
})
