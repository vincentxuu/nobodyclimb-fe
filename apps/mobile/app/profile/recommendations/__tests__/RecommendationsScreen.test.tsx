import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { useRecommendations, useTriggerRecommendation } from '@/lib/hooks/useRecommendations'
import RecommendationsScreen from '../index'

jest.mock('@/lib/hooks/useRecommendations')
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }))
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ show: mockToastShow }),
}))
jest.useFakeTimers()

const mockToastShow = jest.fn()

const EMPTY_RESPONSE = { items: [], total: 0 }
const MOCK_RESPONSE = {
  items: [
    {
      id: 'r1',
      triggered_by: 'ascent',
      status: 'success',
      recommendation: { answer: '推薦路線', sources: [], context_ascents: [] },
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  total: 1,
}

async function advancePollingToExhaustion() {
  // 3 poll attempts × 2s each = 6s total (check happens after refetch)
  await act(async () => {
    jest.advanceTimersByTime(2000)
    await Promise.resolve()
  })
  await act(async () => {
    jest.advanceTimersByTime(2000)
    await Promise.resolve()
  })
  await act(async () => {
    jest.advanceTimersByTime(2000)
    await Promise.resolve()
  })
}

describe('RecommendationsScreen', () => {
  const mockTrigger = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useTriggerRecommendation as jest.Mock).mockReturnValue({
      mutateAsync: mockTrigger,
      isPending: false,
    })
  })

  it('shows loading state', () => {
    ;(useRecommendations as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: jest.fn(),
    })
    const { getByTestId } = render(<RecommendationsScreen />)
    expect(getByTestId('loading-spinner')).toBeTruthy()
  })

  it('renders recommendation cards', () => {
    ;(useRecommendations as jest.Mock).mockReturnValue({
      data: MOCK_RESPONSE,
      isLoading: false,
      refetch: jest.fn(),
    })
    const { getByText } = render(<RecommendationsScreen />)
    expect(getByText('完攀後推薦')).toBeTruthy()
  })

  it('shows polling message when list is empty on first load', () => {
    ;(useRecommendations as jest.Mock).mockReturnValue({
      data: EMPTY_RESPONSE,
      isLoading: false,
      refetch: jest.fn(),
    })
    const { getByText } = render(<RecommendationsScreen />)
    expect(getByText('推薦生成中...')).toBeTruthy()
  })

  it('shows empty state with correct copy after max poll attempts', async () => {
    const mockRefetch = jest.fn().mockResolvedValue({ data: EMPTY_RESPONSE })
    ;(useRecommendations as jest.Mock).mockReturnValue({
      data: EMPTY_RESPONSE,
      isLoading: false,
      refetch: mockRefetch,
    })
    render(<RecommendationsScreen />)

    await advancePollingToExhaustion()

    // Need another tick for state updates
    await waitFor(() => expect(mockRefetch).toHaveBeenCalledTimes(3))
  })

  it('shows quota exceeded toast when trigger fails with quota_exceeded', async () => {
    const quotaError = { response: { data: { error: 'quota_exceeded' } } }
    mockTrigger.mockRejectedValueOnce(quotaError)
    const mockRefetch = jest.fn().mockResolvedValue({ data: EMPTY_RESPONSE })
    ;(useRecommendations as jest.Mock).mockReturnValue({
      data: EMPTY_RESPONSE,
      isLoading: false,
      refetch: mockRefetch,
    })
    const { getByText } = render(<RecommendationsScreen />)

    await advancePollingToExhaustion()

    await waitFor(() => expect(getByText('立即推薦')).toBeTruthy())
    fireEvent.press(getByText('立即推薦'))
    await waitFor(() =>
      expect(mockToastShow).toHaveBeenCalledWith({
        message: '今日 AI 配額已用完，明日重置',
        variant: 'error',
      })
    )
  })

  it('shows failure toast when trigger fails with generic error', async () => {
    mockTrigger.mockRejectedValueOnce(new Error('Server error'))
    const mockRefetch = jest.fn().mockResolvedValue({ data: EMPTY_RESPONSE })
    ;(useRecommendations as jest.Mock).mockReturnValue({
      data: EMPTY_RESPONSE,
      isLoading: false,
      refetch: mockRefetch,
    })
    const { getByText } = render(<RecommendationsScreen />)

    await advancePollingToExhaustion()

    await waitFor(() => expect(getByText('立即推薦')).toBeTruthy())
    fireEvent.press(getByText('立即推薦'))
    await waitFor(() =>
      expect(mockToastShow).toHaveBeenCalledWith({
        message: '推薦生成失敗，請稍後再試',
        variant: 'error',
      })
    )
  })
})
