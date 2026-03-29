import { render } from '@testing-library/react-native'
import { useStoryDetail } from '@/lib/hooks/useStoryDetail'
import StoryDetailScreen from '../index'

jest.mock('@/lib/hooks/useStoryDetail', () => ({
  ...jest.requireActual('@/lib/hooks/useStoryDetail'),
  useStoryDetail: jest.fn(),
}))
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({ back: jest.fn(), replace: jest.fn() })),
  Link: ({ children }: { children: React.ReactNode }) => children,
}))
jest.mock('@/components/biography/display/ContentInteractionBar', () => ({
  ContentInteractionBar: () => null,
}))

const { useLocalSearchParams } = require('expo-router')

const MOCK_CORE_STORY = {
  id: '1',
  title: '核心故事標題',
  content: '## 內容\n\n這是一個故事。',
  author: { id: 'u1', name: '小明', biography_id: 'b1' },
  is_liked: false,
  like_count: 5,
  comment_count: 2,
}

const MOCK_ONE_LINER = {
  id: '2',
  question: '你為什麼爬山？',
  answer: '因為山在那裡。',
  author: { id: 'u1', name: '小明', biography_id: 'b1' },
  is_liked: false,
  like_count: 3,
  comment_count: 1,
}

const MOCK_STORY = {
  id: '3',
  title: '我的攀岩故事',
  content: '一個小小的故事。',
  category_name: '岩場故事',
  author: { id: 'u1', name: '小明', biography_id: 'b1' },
  is_liked: false,
  like_count: 1,
  comment_count: 0,
}

describe('StoryDetailScreen', () => {
  it('renders loading state', () => {
    useLocalSearchParams.mockReturnValue({ type: 'core-stories', id: '1' })
    ;(useStoryDetail as jest.Mock).mockReturnValue({ data: undefined, isLoading: true })
    const { getByTestId } = render(<StoryDetailScreen />)
    expect(getByTestId('loading-spinner')).toBeTruthy()
  })

  it('renders core-stories with title and author', () => {
    useLocalSearchParams.mockReturnValue({ type: 'core-stories', id: '1' })
    ;(useStoryDetail as jest.Mock).mockReturnValue({ data: MOCK_CORE_STORY, isLoading: false })
    const { getByText } = render(<StoryDetailScreen />)
    expect(getByText('核心故事標題')).toBeTruthy()
    expect(getByText('小明')).toBeTruthy()
  })

  it('renders one-liners with question as title', () => {
    useLocalSearchParams.mockReturnValue({ type: 'one-liners', id: '2' })
    ;(useStoryDetail as jest.Mock).mockReturnValue({ data: MOCK_ONE_LINER, isLoading: false })
    const { getByText } = render(<StoryDetailScreen />)
    expect(getByText('你為什麼爬山？')).toBeTruthy()
  })

  it('renders stories with title', () => {
    useLocalSearchParams.mockReturnValue({ type: 'stories', id: '3' })
    ;(useStoryDetail as jest.Mock).mockReturnValue({ data: MOCK_STORY, isLoading: false })
    const { getByText } = render(<StoryDetailScreen />)
    expect(getByText('我的攀岩故事')).toBeTruthy()
  })

  it('redirects to tabs when type is invalid', () => {
    const mockReplace = jest.fn()
    const { useRouter } = require('expo-router')
    useRouter.mockReturnValue({ back: jest.fn(), replace: mockReplace })
    useLocalSearchParams.mockReturnValue({ type: 'invalid-type', id: '1' })
    ;(useStoryDetail as jest.Mock).mockReturnValue({ data: undefined, isLoading: false })
    render(<StoryDetailScreen />)
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)')
  })

  it('shows biography link when author biography_id is present', () => {
    useLocalSearchParams.mockReturnValue({ type: 'core-stories', id: '1' })
    ;(useStoryDetail as jest.Mock).mockReturnValue({ data: MOCK_CORE_STORY, isLoading: false })
    const { getByText } = render(<StoryDetailScreen />)
    expect(getByText('查看更多')).toBeTruthy()
  })

  it('hides biography link when author biography_id is absent', () => {
    const dataWithoutBiography = { ...MOCK_CORE_STORY, author: { id: 'u2', name: '無簡介作者' } }
    useLocalSearchParams.mockReturnValue({ type: 'core-stories', id: '1' })
    ;(useStoryDetail as jest.Mock).mockReturnValue({ data: dataWithoutBiography, isLoading: false })
    const { queryByText } = render(<StoryDetailScreen />)
    expect(queryByText('查看更多')).toBeNull()
  })

  it('renders one-liner answer as content', () => {
    useLocalSearchParams.mockReturnValue({ type: 'one-liners', id: '2' })
    ;(useStoryDetail as jest.Mock).mockReturnValue({ data: MOCK_ONE_LINER, isLoading: false })
    const { getByText } = render(<StoryDetailScreen />)
    expect(getByText('因為山在那裡。')).toBeTruthy()
  })
})
