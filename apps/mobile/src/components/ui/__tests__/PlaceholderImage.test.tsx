import React from 'react'
import { render } from '@testing-library/react-native'
import { PlaceholderImage } from '../PlaceholderImage'

describe('PlaceholderImage', () => {
  it('renders without crashing with required props', () => {
    expect(() =>
      render(<PlaceholderImage width={200} height={150} />)
    ).not.toThrow()
  })

  it('renders with testID', () => {
    const { getByTestId } = render(
      <PlaceholderImage width={200} height={150} testID="placeholder" />
    )
    expect(getByTestId('placeholder')).toBeTruthy()
  })

  it('renders label when provided', () => {
    const { getByText } = render(
      <PlaceholderImage width={200} height={150} label="暫無圖片" />
    )
    expect(getByText('暫無圖片')).toBeTruthy()
  })

  it('applies correct dimensions', () => {
    const { getByTestId } = render(
      <PlaceholderImage width={300} height={200} testID="placeholder" />
    )
    const el = getByTestId('placeholder')
    expect(el.props.style).toMatchObject(
      expect.arrayContaining([expect.objectContaining({ width: 300, height: 200 })])
    )
  })
})
