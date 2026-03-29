import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import React from 'react'
import { apiClient } from '@/lib/api'
import { useAiMemory, useDeleteAiMemory } from '../useAiMemory'

jest.mock('@/lib/api')
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const MOCK_MEMORIES = [
  {
    id: '1',
    memory_key: 'climbing_level',
    memory_type: 'fact',
    content: '5.10a',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    memory_key: 'preferred_region',
    memory_type: 'preference',
    content: '龍洞',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

describe('useAiMemory', () => {
  it('fetches AI memories from /ai/memory', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: MOCK_MEMORIES } })
    const { result } = renderHook(() => useAiMemory(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(2)
    expect(mockedApiClient.get).toHaveBeenCalledWith('/ai/memory')
  })

  it('returns empty array when no memories', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: [] } })
    const { result } = renderHook(() => useAiMemory(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(0)
  })
})

describe('useDeleteAiMemory', () => {
  it('calls DELETE /ai/memory/:id', async () => {
    mockedApiClient.delete.mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useDeleteAiMemory(), { wrapper: createWrapper() })
    await result.current.mutateAsync('1')
    expect(mockedApiClient.delete).toHaveBeenCalledWith('/ai/memory/1')
  })
})
