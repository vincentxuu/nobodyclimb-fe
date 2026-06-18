import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import React from 'react'
import { apiClient } from '@/lib/api'
import { useUpdateBucketMilestone } from '../useBucketList'

jest.mock('@/lib/api')
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useUpdateBucketMilestone', () => {
  it('updates a bucket-list milestone with the web endpoint shape', async () => {
    mockedApiClient.put.mockResolvedValueOnce({ data: { success: true } })

    const { result } = renderHook(() => useUpdateBucketMilestone(), { wrapper: createWrapper() })
    result.current.mutate({ id: 'goal-1', milestoneId: 'milestone-1', completed: true })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedApiClient.put).toHaveBeenCalledWith('/bucket-list/goal-1/milestone', {
      milestone_id: 'milestone-1',
      completed: true,
    })
  })
})
