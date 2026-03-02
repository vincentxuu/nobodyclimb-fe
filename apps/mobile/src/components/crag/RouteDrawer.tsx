/**
 * 路線抽屜組件 (Mobile 底部抽屜)
 *
 * 對應 apps/web/src/app/crag/[id]/CragDetailClient.tsx 中的手機版抽屜
 */
import React, { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react'
import { StyleSheet, View, FlatList, Pressable } from 'react-native'
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet'
import { X } from 'lucide-react-native'

import { Text, IconButton } from '@/components/ui'
import { RouteListFilter } from './RouteListFilter'
import { RouteListItem } from './RouteListItem'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import type { RouteSidebarItem } from '@/lib/crag-data'

interface RouteDrawerProps {
  cragName: string
  routes: RouteSidebarItem[]
  filteredRoutes: RouteSidebarItem[]
  filterState: {
    searchQuery: string
    selectedArea: string
    selectedSector: string
    selectedGrade: string
    selectedType: string
  }
  onSearchChange: (query: string) => void
  onAreaChange: (area: string) => void
  onSectorChange: (sector: string) => void
  onGradeChange: (grade: string) => void
  onTypeChange: (type: string) => void
  areas: Array<{ id: string; name: string }>
  sectors: Array<{ id: string; name: string }>
  onRoutePress: (routeId: string) => void
  onClose: () => void
}

export interface RouteDrawerRef {
  open: () => void
  close: () => void
}

export const RouteDrawer = forwardRef<RouteDrawerRef, RouteDrawerProps>(
  (
    {
      cragName,
      routes,
      filteredRoutes,
      filterState,
      onSearchChange,
      onAreaChange,
      onSectorChange,
      onGradeChange,
      onTypeChange,
      areas,
      sectors,
      onRoutePress,
      onClose,
    },
    ref
  ) => {
    const bottomSheetRef = useRef<BottomSheet>(null)

    // 定義抽屜高度
    const snapPoints = useMemo(() => ['75%'], [])

    // 暴露方法給父組件
    useImperativeHandle(ref, () => ({
      open: () => {
        bottomSheetRef.current?.expand()
      },
      close: () => {
        bottomSheetRef.current?.close()
      },
    }))

    // 渲染背景遮罩
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    )

    // 渲染路線列表項
    const renderRouteItem = useCallback(
      ({ item }: { item: RouteSidebarItem }) => (
        <RouteListItem
          id={item.id}
          name={item.name}
          grade={item.grade}
          type={item.type}
          areaName={item.areaName}
          sector={item.sector}
          onPress={() => {
            onRoutePress(item.id)
            onClose()
          }}
        />
      ),
      [onRoutePress, onClose]
    )

    const routeCountText =
      filteredRoutes.length === routes.length
        ? `${routes.length} 條路線`
        : `${filteredRoutes.length} / ${routes.length} 條路線`

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onClose}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.indicator}
        backgroundStyle={styles.background}
      >
        <BottomSheetView style={styles.container}>
          {/* 標題列 */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text variant="h4" fontWeight="600">
                {cragName}
              </Text>
              <Text variant="caption" color="textMuted">
                {routeCountText}
              </Text>
            </View>
            <IconButton
              icon={<X size={20} color={SEMANTIC_COLORS.textMain} />}
              onPress={onClose}
              variant="ghost"
              size="sm"
            />
          </View>

          {/* 篩選區 */}
          <View style={styles.filterContainer}>
            <RouteListFilter
              searchQuery={filterState.searchQuery}
              onSearchChange={onSearchChange}
              selectedArea={filterState.selectedArea}
              onAreaChange={onAreaChange}
              selectedSector={filterState.selectedSector}
              onSectorChange={onSectorChange}
              selectedGrade={filterState.selectedGrade}
              onGradeChange={onGradeChange}
              selectedType={filterState.selectedType}
              onTypeChange={onTypeChange}
              areas={areas}
              sectors={sectors}
            />
          </View>

          {/* 路線列表 */}
          <View style={styles.listContainer}>
            <BottomSheetFlatList
              data={filteredRoutes}
              keyExtractor={(item) => item.id}
              renderItem={renderRouteItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text color="textMuted">沒有符合條件的路線</Text>
                </View>
              }
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
    )
  }
)

RouteDrawer.displayName = 'RouteDrawer'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  indicator: {
    backgroundColor: '#D4D4D4',
    width: 36,
    height: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flex: 1,
  },
  filterContainer: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.sm,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
})
