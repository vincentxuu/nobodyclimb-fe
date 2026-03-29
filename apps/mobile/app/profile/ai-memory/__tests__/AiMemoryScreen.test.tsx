import { fireEvent, render, waitFor } from '@testing-library/react-native'
import AiMemoryScreen from '../index'

jest.mock('@/lib/hooks/useAiMemory', () => ({
  useAiMemory: jest.fn(),
  useDeleteAiMemory: jest.fn(),
}))
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}))
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ show: mockToastShow }),
}))

const mockToastShow = jest.fn()

import { useAiMemory, useDeleteAiMemory } from '@/lib/hooks/useAiMemory'

const MOCK_MEMORIES = [
  {
    id: '1',
    memory_key: 'climbing_level',
    memory_type: 'fact',
    content: '5.10a',
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    memory_key: 'preferred_region',
    memory_type: 'preference',
    content: '龍洞',
    updated_at: new Date().toISOString(),
  },
]

describe('AiMemoryScreen', () => {
  const mockMutateAsync = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useDeleteAiMemory as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    })
  })

  it('renders loading state', () => {
    ;(useAiMemory as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    const { getByTestId } = render(<AiMemoryScreen />)
    expect(getByTestId('loading-spinner')).toBeTruthy()
  })

  it('renders memories list', () => {
    ;(useAiMemory as jest.Mock).mockReturnValue({
      data: MOCK_MEMORIES,
      isLoading: false,
      isError: false,
    })
    const { getByText } = render(<AiMemoryScreen />)
    expect(getByText('攀岩程度')).toBeTruthy()
    expect(getByText('5.10a')).toBeTruthy()
    expect(getByText('偏好地區')).toBeTruthy()
    expect(getByText('龍洞')).toBeTruthy()
  })

  it('renders empty state when no memories', () => {
    ;(useAiMemory as jest.Mock).mockReturnValue({ data: [], isLoading: false, isError: false })
    const { getByText } = render(<AiMemoryScreen />)
    expect(getByText('AI 會在你提問後自動學習你的偏好，目前尚無記憶')).toBeTruthy()
  })

  it('renders error state when query fails', () => {
    ;(useAiMemory as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    const { getByText } = render(<AiMemoryScreen />)
    expect(getByText('載入失敗，請稍後再試')).toBeTruthy()
  })

  it('shows confirm dialog when delete button pressed', () => {
    ;(useAiMemory as jest.Mock).mockReturnValue({
      data: MOCK_MEMORIES,
      isLoading: false,
      isError: false,
    })
    const { getAllByTestId, getByText } = render(<AiMemoryScreen />)
    fireEvent.press(getAllByTestId('delete-btn')[0])
    expect(getByText('確定刪除此記憶？')).toBeTruthy()
  })

  it('calls deleteMemory on confirm and shows success toast', async () => {
    ;(useAiMemory as jest.Mock).mockReturnValue({
      data: MOCK_MEMORIES,
      isLoading: false,
      isError: false,
    })
    const { getAllByTestId, getByText } = render(<AiMemoryScreen />)
    fireEvent.press(getAllByTestId('delete-btn')[0])
    fireEvent.press(getByText('刪除'))
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith('1'))
    await waitFor(() =>
      expect(mockToastShow).toHaveBeenCalledWith({ message: '記憶已刪除', variant: 'success' })
    )
  })

  it('shows error toast when delete fails', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Network error'))
    ;(useAiMemory as jest.Mock).mockReturnValue({
      data: MOCK_MEMORIES,
      isLoading: false,
      isError: false,
    })
    const { getAllByTestId, getByText } = render(<AiMemoryScreen />)
    fireEvent.press(getAllByTestId('delete-btn')[0])
    fireEvent.press(getByText('刪除'))
    await waitFor(() =>
      expect(mockToastShow).toHaveBeenCalledWith({
        message: '刪除失敗，請稍後再試',
        variant: 'error',
      })
    )
  })
})
