import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ConfirmDialog } from '../ConfirmDialog'

describe('ConfirmDialog', () => {
  const baseProps = {
    open: true,
    title: '確認刪除',
    message: '此操作無法復原，確定要繼續嗎？',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders title and message when open', () => {
    const { getByText } = render(<ConfirmDialog {...baseProps} />)
    expect(getByText('確認刪除')).toBeTruthy()
    expect(getByText('此操作無法復原，確定要繼續嗎？')).toBeTruthy()
  })

  it('renders default confirm and cancel labels', () => {
    const { getByText } = render(<ConfirmDialog {...baseProps} />)
    expect(getByText('確認')).toBeTruthy()
    expect(getByText('取消')).toBeTruthy()
  })

  it('renders custom labels', () => {
    const { getByText } = render(
      <ConfirmDialog {...baseProps} confirmLabel="刪除" cancelLabel="返回" />
    )
    expect(getByText('刪除')).toBeTruthy()
    expect(getByText('返回')).toBeTruthy()
  })

  it('calls onConfirm when confirm button pressed', () => {
    const onConfirm = jest.fn()
    const { getByText } = render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />)
    fireEvent.press(getByText('確認'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel button pressed', () => {
    const onCancel = jest.fn()
    const { getByText } = render(<ConfirmDialog {...baseProps} onCancel={onCancel} />)
    fireEvent.press(getByText('取消'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('disables both buttons when loading', () => {
    const onConfirm = jest.fn()
    const onCancel = jest.fn()
    const { getByText } = render(
      <ConfirmDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} loading={true} />
    )
    fireEvent.press(getByText('確認'))
    fireEvent.press(getByText('取消'))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('does not render when open is false', () => {
    const { queryByText } = render(<ConfirmDialog {...baseProps} open={false} />)
    expect(queryByText('確認刪除')).toBeNull()
  })
})
