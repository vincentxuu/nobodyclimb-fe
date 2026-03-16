import { render, waitFor, act } from '@testing-library/react-native'
import RecommendationsScreen from '../index'
import { useRecommendations, useTriggerRecommendation } from '@/lib/hooks/useRecommendations'

jest.mock('@/lib/hooks/useRecommendations')
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }))
jest.useFakeTimers()

const EMPTY_RESPONSE = { items: [], total: 0 }
const MOCK_RESPONSE = {
  items: [
    {
      id: 'r1', triggered_by: 'ascent', status: 'success',
      recommendation: { answer: '推薦路線', sources: [], context_ascents: [] },
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  total: 1,
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
    ;(useRecommendations as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, refetch: jest.fn() })
    const { getByTestId } = render(<RecommendationsScreen />)
    expect(getByTestId('loading-spinner')).toBeTruthy()
  })

  it('renders recommendation cards', () => {
    ;(useRecommendations as jest.Mock).mockReturnValue({ data: MOCK_RESPONSE, isLoading: false, refetch: jest.fn() })
    const { getByText } = render(<RecommendationsScreen />)
    expect(getByText('完攀後推薦')).toBeTruthy()
  })

  it('shows polling message when list is empty on first load', () => {
    ;(useRecommendations as jest.Mock).mockReturnValue({ data: EMPTY_RESPONSE, isLoading: false, refetch: jest.fn() })
    const { getByText } = render(<RecommendationsScreen />)
    expect(getByText('推薦生成中...')).toBeTruthy()
  })

  it('shows empty state after max poll attempts with no data', async () => {
    const mockRefetch = jest.fn().mockResolvedValue({ data: EMPTY_RESPONSE })
    ;(useRecommendations as jest.Mock).mockReturnValue({ data: EMPTY_RESPONSE, isLoading: false, refetch: mockRefetch })
    const { getByText } = render(<RecommendationsScreen />)

    await act(async () => {
      jest.advanceTimersByTime(2000)
      await Promise.resolve()
      jest.advanceTimersByTime(2000)
      await Promise.resolve()
      jest.advanceTimersByTime(2000)
      await Promise.resolve()
    })
    await waitFor(() => expect(getByText('目前沒有推薦路線')).toBeTruthy())
  })
})
