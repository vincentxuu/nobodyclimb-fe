/**
 * Mock for @gorhom/bottom-sheet in Jest tests.
 */
import React from 'react'
import { View } from 'react-native'

export const BottomSheet = ({ children }: { children?: React.ReactNode }) =>
  React.createElement(View, null, children)

export const BottomSheetModal = ({ children }: { children?: React.ReactNode }) =>
  React.createElement(View, null, children)

export const BottomSheetView = ({ children }: { children?: React.ReactNode }) =>
  React.createElement(View, null, children)

export const BottomSheetScrollView = ({ children }: { children?: React.ReactNode }) =>
  React.createElement(View, null, children)

export const BottomSheetFlatList = View

export const BottomSheetBackdrop = () => null

export const BottomSheetModalProvider = ({ children }: { children?: React.ReactNode }) =>
  React.createElement(View, null, children)

export function useBottomSheet() {
  return {
    expand: () => {},
    collapse: () => {},
    close: () => {},
    snapToIndex: () => {},
    snapToPosition: () => {},
    forceClose: () => {},
  }
}

export function useBottomSheetModal() {
  return {
    present: () => {},
    dismiss: () => {},
    dismissAll: () => {},
  }
}

export default BottomSheet
