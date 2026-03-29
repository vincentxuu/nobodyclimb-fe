import { fireEvent, render } from '@testing-library/react-native'
import { CreateAscentFlow } from '../CreateAscentFlow'

jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn().mockResolvedValue({ data: { data: { crags: [], routes: [] } } }),
    post: jest.fn().mockResolvedValue({ data: { data: { id: 'new-1' } } }),
  },
}))

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: jest.fn().mockReturnValue({ data: [], isLoading: false }),
    useMutation: jest.fn().mockReturnValue({ mutate: jest.fn(), isPending: false }),
    useQueryClient: jest.fn().mockReturnValue({ invalidateQueries: jest.fn() }),
  }
})

describe('CreateAscentFlow', () => {
  it('renders step 1 (crag search) initially', () => {
    const { getByText } = render(<CreateAscentFlow onSuccess={jest.fn()} onCancel={jest.fn()} />)
    expect(getByText('選擇岩場')).toBeTruthy()
  })

  it('renders search input on step 1', () => {
    const { getByPlaceholderText } = render(
      <CreateAscentFlow onSuccess={jest.fn()} onCancel={jest.fn()} />
    )
    expect(getByPlaceholderText('搜尋岩場名稱...')).toBeTruthy()
  })

  it('calls onCancel when cancel button pressed', () => {
    const onCancel = jest.fn()
    const { getByText } = render(<CreateAscentFlow onSuccess={jest.fn()} onCancel={onCancel} />)
    fireEvent.press(getByText('取消'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows step indicator', () => {
    const { getByTestId } = render(<CreateAscentFlow onSuccess={jest.fn()} onCancel={jest.fn()} />)
    expect(getByTestId('step-indicator')).toBeTruthy()
  })
})
