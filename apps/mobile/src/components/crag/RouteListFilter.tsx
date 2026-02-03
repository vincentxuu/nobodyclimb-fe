/**
 * 路線篩選組件
 *
 * 對應 apps/web/src/components/crag/route-list-filter.tsx
 */
import React from 'react'
import { StyleSheet, View, ScrollView, Pressable } from 'react-native'
import { Search, X } from 'lucide-react-native'

import { Text, Input } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { GRADE_FILTERS, TYPE_FILTERS } from '@/lib/crag-data'

interface RouteListFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedArea: string
  onAreaChange: (area: string) => void
  selectedSector: string
  onSectorChange: (sector: string) => void
  selectedGrade: string
  onGradeChange: (grade: string) => void
  selectedType: string
  onTypeChange: (type: string) => void
  areas: Array<{ id: string; name: string }>
  sectors: Array<{ id: string; name: string }>
  /** 是否顯示區域篩選器，預設 true */
  showAreaFilter?: boolean
  /** 是否顯示 Sector 篩選器，預設 true */
  showSectorFilter?: boolean
}

interface FilterChipProps {
  label: string
  selected: boolean
  onPress: () => void
}

function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected && styles.chipSelected,
      ]}
    >
      <Text
        variant="small"
        style={[
          styles.chipText,
          selected && styles.chipTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export function RouteListFilter({
  searchQuery,
  onSearchChange,
  selectedArea,
  onAreaChange,
  selectedSector,
  onSectorChange,
  selectedGrade,
  onGradeChange,
  selectedType,
  onTypeChange,
  areas,
  sectors,
  showAreaFilter = true,
  showSectorFilter = true,
}: RouteListFilterProps) {
  const handleClearSearch = () => {
    onSearchChange('')
  }

  return (
    <View style={styles.container}>
      {/* 搜尋欄 */}
      <View style={styles.searchContainer}>
        <Input
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="搜尋路線..."
          leftElement={<Search size={18} color={SEMANTIC_COLORS.textMuted} />}
          rightElement={
            searchQuery ? (
              <Pressable onPress={handleClearSearch}>
                <X size={18} color={SEMANTIC_COLORS.textMuted} />
              </Pressable>
            ) : undefined
          }
        />
      </View>

      {/* 區域篩選 */}
      {showAreaFilter && areas.length > 0 && (
        <View style={styles.filterSection}>
          <Text variant="caption" color="textMuted" style={styles.filterLabel}>
            區域
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipList}
          >
            <FilterChip
              label="全部"
              selected={selectedArea === 'all'}
              onPress={() => {
                onAreaChange('all')
                onSectorChange('all')
              }}
            />
            {areas.map((area) => (
              <FilterChip
                key={area.id}
                label={area.name}
                selected={selectedArea === area.id}
                onPress={() => {
                  onAreaChange(area.id)
                  onSectorChange('all')
                }}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Sector 篩選 */}
      {showSectorFilter && sectors.length > 0 && selectedArea !== 'all' && (
        <View style={styles.filterSection}>
          <Text variant="caption" color="textMuted" style={styles.filterLabel}>
            Sector
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipList}
          >
            <FilterChip
              label="全部"
              selected={selectedSector === 'all'}
              onPress={() => onSectorChange('all')}
            />
            {sectors.map((sector) => (
              <FilterChip
                key={sector.id}
                label={sector.name}
                selected={selectedSector === sector.id}
                onPress={() => onSectorChange(sector.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* 難度篩選 */}
      <View style={styles.filterSection}>
        <Text variant="caption" color="textMuted" style={styles.filterLabel}>
          難度
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
        >
          {GRADE_FILTERS.map((filter) => (
            <FilterChip
              key={filter.id}
              label={filter.label}
              selected={selectedGrade === filter.id}
              onPress={() => onGradeChange(filter.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* 類型篩選 */}
      <View style={styles.filterSection}>
        <Text variant="caption" color="textMuted" style={styles.filterLabel}>
          類型
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
        >
          {TYPE_FILTERS.map((filter) => (
            <FilterChip
              key={filter.id}
              label={filter.label}
              selected={selectedType === filter.id}
              onPress={() => onTypeChange(filter.id)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  searchContainer: {
    marginBottom: SPACING.xs,
  },
  filterSection: {
    gap: 4,
  },
  filterLabel: {
    marginLeft: 4,
    marginBottom: 2,
  },
  chipList: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 2,
  },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: '#1B1A1A',
    borderColor: '#1B1A1A',
  },
  chipText: {
    color: SEMANTIC_COLORS.textSubtle,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
})
