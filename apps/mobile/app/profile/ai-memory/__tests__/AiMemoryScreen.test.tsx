import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import AiMemoryScreen from '../index'

jest.mock('@/lib/hooks/useAiMemory', () => ({
  useAiMemory: jest.fn(),
  useDeleteAiMemory: jest.fn(),
}))
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}))
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ show: jest.fn() }),
}))

import { useAiMemory, useDeleteAiMemory } from '@/lib/hooks/useAiMemory'

const MOCK_MEMORIES = [
  { id: '1', memory_key: 'climbing_level', memory_type: 'fact', content: '5.10a', updated_at: new Date().toISOString() },
  { id: '2', memory_key: 'preferred_region', memory_type: 'preference', content: '龍洞', updated_at: new Date().toISOString() },
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
    ;(useAiMemory as jest.Mock).mockReturnValue({ data: undefined, isLoading: true })
    const { getByTestId } = render(<AiMemoryScreen />)
    expect(getByTestId('loading-spinner')).toBeTruthy()
  })

  it('renders memories list', () => {
    ;(useAiMemory as jest.Mock).mockReturnValue({ data: MOCK_MEMORIES, isLoading: false })
    const { getByText } = render(<AiMemoryScreen />)
    expect(getByText('攀岩程度')).toBeTruthy()
    expect(getByText('5.10a')).toBeTruthy()
    expect(getByText('偏好地區')).toBeTruthy()
    expect(getByText('龍洞')).toBeTruthy()
  })

  it('renders empty state when no memories', () => {
    ;(useAiMemory as jest.Mock).mockReturnValue({ data: [], isLoading: false })
    const { getByText } = render(<AiMemoryScreen />)
    expect(getByText('AI 會在你提問後自動學習你的偏好，目前尚無記憶')).toBeTruthy()
  })

  it('shows confirm dialog when delete button pressed', () => {
    ;(useAiMemory as jest.Mock).mockReturnValue({ data: MOCK_MEMORIES, isLoading: false })
    const { getAllByTestId, getByText } = render(<AiMemoryScreen />)
    fireEvent.press(getAllByTestId('delete-btn')[0])
    expect(getByText('確定刪除此記憶？')).toBeTruthy()
  })

  it('calls deleteMemory on confirm', async () => {
    ;(useAiMemory as jest.Mock).mockReturnValue({ data: MOCK_MEMORIES, isLoading: false })
    const { getAllByTestId, getByText } = render(<AiMemoryScreen />)
    fireEvent.press(getAllByTestId('delete-btn')[0])
    fireEvent.press(getByText('刪除'))
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith('1'))
  })
})
