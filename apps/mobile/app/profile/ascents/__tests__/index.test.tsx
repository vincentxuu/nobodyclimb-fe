import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import AscentsPage from '../index'

jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ show: jest.fn() }),
}))

jest.mock('@/lib/hooks/useAscents', () => ({
  useMyAscents: () => ({
    data: { ascents: [], total: 0, page: 1, limit: 10 },
    isLoading: false,
    refetch: jest.fn(),
  }),
  useMyAscentStats: () => ({
    data: { total: 5, unique_routes: 4, unique_crags: 2, highest_grade: '5.11a' },
    isLoading: false,
  }),
  useUpdateAscent: () => ({ mutate: jest.fn(), isPending: false }),
  useDeleteAscent: () => ({ mutate: jest.fn(), isPending: false }),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}))

describe('AscentsPage', () => {
  it('renders page title', async () => {
    const { getByText } = render(<AscentsPage />)
    await waitFor(() => expect(getByText('攀登記錄')).toBeTruthy())
  })

  it('renders 4 stat cards', async () => {
    const { getByText } = render(<AscentsPage />)
    await waitFor(() => {
      expect(getByText('5')).toBeTruthy()
      expect(getByText('4')).toBeTruthy()
      expect(getByText('2')).toBeTruthy()
      expect(getByText('5.11a')).toBeTruthy()
    })
  })

  it('renders empty state when no ascents', async () => {
    const { getByText } = render(<AscentsPage />)
    await waitFor(() => expect(getByText('尚無攀登記錄')).toBeTruthy())
  })

  it('renders FAB button for new record', async () => {
    const { getByTestId } = render(<AscentsPage />)
    await waitFor(() => expect(getByTestId('fab-new-ascent')).toBeTruthy())
  })
})
