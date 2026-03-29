import { fireEvent, render } from '@testing-library/react-native'
import { AscentTypeSelect } from '../AscentTypeSelect'

describe('AscentTypeSelect', () => {
  it('renders all 8 ascent types', () => {
    const { getAllByRole } = render(<AscentTypeSelect value="redpoint" onChange={jest.fn()} />)
    expect(getAllByRole('button')).toHaveLength(8)
  })

  it('renders labels for each type', () => {
    const { getByText } = render(<AscentTypeSelect value="redpoint" onChange={jest.fn()} />)
    expect(getByText('Redpoint')).toBeTruthy()
    expect(getByText('Flash')).toBeTruthy()
    expect(getByText('Onsight')).toBeTruthy()
    expect(getByText('Attempt')).toBeTruthy()
    expect(getByText('Top Rope')).toBeTruthy()
    expect(getByText('Lead')).toBeTruthy()
    expect(getByText('Second')).toBeTruthy()
    expect(getByText('Repeat')).toBeTruthy()
  })

  it('calls onChange with correct type when pressed', () => {
    const onChange = jest.fn()
    const { getByText } = render(<AscentTypeSelect value="redpoint" onChange={onChange} />)
    fireEvent.press(getByText('Flash'))
    expect(onChange).toHaveBeenCalledWith('flash')
  })

  it('highlights currently selected type', () => {
    const { getByTestId } = render(<AscentTypeSelect value="flash" onChange={jest.fn()} />)
    const flashButton = getByTestId('ascent-type-flash')
    expect(flashButton.props.accessibilityState?.selected).toBe(true)
  })

  it('does not highlight unselected types', () => {
    const { getByTestId } = render(<AscentTypeSelect value="flash" onChange={jest.fn()} />)
    const redpointButton = getByTestId('ascent-type-redpoint')
    expect(redpointButton.props.accessibilityState?.selected).toBe(false)
  })
})
