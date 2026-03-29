import { fireEvent, render } from '@testing-library/react-native'
import { AscentCard } from '../AscentCard'

const mockAscent = {
  id: 'asc-1',
  ascent_type: 'redpoint' as const,
  route_name: '浪人劍客',
  crag_name: '龍洞',
  grade: '5.12a',
  date: '2026-03-01',
  attempts: 3,
  rating: 4,
  notes: '第一次完攀，很開心！',
}

describe('AscentCard', () => {
  it('renders route name', () => {
    const { getByText } = render(
      <AscentCard ascent={mockAscent} onEdit={jest.fn()} onDelete={jest.fn()} />
    )
    expect(getByText('浪人劍客')).toBeTruthy()
  })

  it('renders crag name and grade', () => {
    const { getByText } = render(
      <AscentCard ascent={mockAscent} onEdit={jest.fn()} onDelete={jest.fn()} />
    )
    expect(getByText('龍洞')).toBeTruthy()
    expect(getByText('5.12a')).toBeTruthy()
  })

  it('renders ascent type label', () => {
    const { getByText } = render(
      <AscentCard ascent={mockAscent} onEdit={jest.fn()} onDelete={jest.fn()} />
    )
    expect(getByText('Redpoint')).toBeTruthy()
  })

  it('renders formatted date', () => {
    const { getByText } = render(
      <AscentCard ascent={mockAscent} onEdit={jest.fn()} onDelete={jest.fn()} />
    )
    expect(getByText('2026-03-01')).toBeTruthy()
  })

  it('calls onEdit when edit button pressed', () => {
    const onEdit = jest.fn()
    const { getByTestId } = render(
      <AscentCard ascent={mockAscent} onEdit={onEdit} onDelete={jest.fn()} />
    )
    fireEvent.press(getByTestId('ascent-card-edit'))
    expect(onEdit).toHaveBeenCalledWith(mockAscent)
  })

  it('calls onDelete when delete button pressed', () => {
    const onDelete = jest.fn()
    const { getByTestId } = render(
      <AscentCard ascent={mockAscent} onEdit={jest.fn()} onDelete={onDelete} />
    )
    fireEvent.press(getByTestId('ascent-card-delete'))
    expect(onDelete).toHaveBeenCalledWith('asc-1')
  })

  it('renders notes when provided', () => {
    const { getByText } = render(
      <AscentCard ascent={mockAscent} onEdit={jest.fn()} onDelete={jest.fn()} />
    )
    expect(getByText('第一次完攀，很開心！')).toBeTruthy()
  })
})
