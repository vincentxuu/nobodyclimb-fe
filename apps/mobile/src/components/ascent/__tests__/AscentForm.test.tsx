import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { AscentForm } from '../AscentForm'

const mockAscent = {
  id: 'asc-1',
  ascent_type: 'redpoint' as const,
  route_name: '浪人劍客',
  crag_name: '龍洞',
  grade: '5.12a',
  date: '2026-03-01',
  attempts: 3,
  rating: 4,
  notes: '備註',
}

describe('AscentForm', () => {
  it('renders when visible is true', () => {
    const { getByText } = render(
      <AscentForm visible={true} ascent={mockAscent} onSubmit={jest.fn()} onClose={jest.fn()} loading={false} />
    )
    expect(getByText('編輯攀登記錄')).toBeTruthy()
  })

  it('does not render content when visible is false', () => {
    const { queryByText } = render(
      <AscentForm visible={false} ascent={mockAscent} onSubmit={jest.fn()} onClose={jest.fn()} loading={false} />
    )
    expect(queryByText('編輯攀登記錄')).toBeNull()
  })

  it('pre-fills notes field with existing value', () => {
    const { getByDisplayValue } = render(
      <AscentForm visible={true} ascent={mockAscent} onSubmit={jest.fn()} onClose={jest.fn()} loading={false} />
    )
    expect(getByDisplayValue('備註')).toBeTruthy()
  })

  it('calls onClose when cancel pressed', () => {
    const onClose = jest.fn()
    const { getByText } = render(
      <AscentForm visible={true} ascent={mockAscent} onSubmit={onClose} onClose={onClose} loading={false} />
    )
    fireEvent.press(getByText('取消'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onSubmit with updated data when save pressed', () => {
    const onSubmit = jest.fn()
    const { getByText, getByDisplayValue } = render(
      <AscentForm visible={true} ascent={mockAscent} onSubmit={onSubmit} onClose={jest.fn()} loading={false} />
    )
    fireEvent.changeText(getByDisplayValue('備註'), '新備註')
    fireEvent.press(getByText('儲存'))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ notes: '新備註' }))
  })

  it('disables save button when loading', () => {
    const { getByText } = render(
      <AscentForm visible={true} ascent={mockAscent} onSubmit={jest.fn()} onClose={jest.fn()} loading={true} />
    )
    expect(getByText('儲存')).toBeTruthy()
  })
})
