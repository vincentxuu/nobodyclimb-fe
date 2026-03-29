import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import { createElement } from 'react'
import { apiClient } from '@/lib/api'
import { isValidStoryType, useStoryDetail } from '../useStoryDetail'

jest.mock('@/lib/api')
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('isValidStoryType', () => {
  it('returns true for valid story types', () => {
    expect(isValidStoryType('core-stories')).toBe(true)
    expect(isValidStoryType('one-liners')).toBe(true)
    expect(isValidStoryType('stories')).toBe(true)
  })

  it('returns false for invalid types', () => {
    expect(isValidStoryType('invalid')).toBe(false)
    expect(isValidStoryType('')).toBe(false)
    expect(isValidStoryType('STORIES')).toBe(false)
    expect(isValidStoryType('core_stories')).toBe(false)
  })
})

describe('useStoryDetail', () => {
  const MOCK_STORY = { id: '1', title: '攀岩初體驗', content: '## 第一次' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    ['core-stories', '/content/core-stories/1/detail'],
    ['one-liners', '/content/one-liners/1/detail'],
    ['stories', '/content/stories/1/detail'],
  ] as const)('fetches %s from correct endpoint', async (type, endpoint) => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: MOCK_STORY } })
    const { result } = renderHook(() => useStoryDetail(type, '1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedApiClient.get).toHaveBeenCalledWith(endpoint)
    expect(result.current.data).toEqual(MOCK_STORY)
  })

  it('does not fetch for invalid story type', () => {
    const { result } = renderHook(() => useStoryDetail('invalid' as never, '1'), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedApiClient.get).not.toHaveBeenCalled()
  })
})
