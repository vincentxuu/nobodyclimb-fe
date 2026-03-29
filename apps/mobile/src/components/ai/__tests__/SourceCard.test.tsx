import { fireEvent, render } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { SourceCard } from '../SourceCard'

jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)

const MOCK_SOURCE = {
  id: 's1',
  type: 'route' as const,
  title: '藍色海灣',
  excerpt: '適合初中級者的經典路線',
  url: 'https://example.com/route/1',
  score: 0.9,
}

describe('SourceCard', () => {
  it('renders title and excerpt', () => {
    const { getByText } = render(<SourceCard source={MOCK_SOURCE} />)
    expect(getByText('藍色海灣')).toBeTruthy()
    expect(getByText('適合初中級者的經典路線')).toBeTruthy()
  })

  it('opens URL on press', () => {
    const { getByText } = render(<SourceCard source={MOCK_SOURCE} />)
    fireEvent.press(getByText('藍色海灣'))
    expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/route/1')
  })

  it('renders route, crag, and video types without crashing', () => {
    const types = ['route', 'crag', 'video'] as const
    types.forEach((type) => {
      expect(() => render(<SourceCard source={{ ...MOCK_SOURCE, type }} />)).not.toThrow()
    })
  })
})
