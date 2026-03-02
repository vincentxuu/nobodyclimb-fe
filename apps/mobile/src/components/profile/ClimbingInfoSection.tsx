import React, { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import ProfileFormField from './ProfileFormField'
import ProfileTextDisplay from './ProfileTextDisplay'
import RouteTypeSelector from './RouteTypeSelector'

interface ClimbingInfoSectionProps {
  startYear: string
  frequentGyms: string
  favoriteRouteType: string
  isEditing: boolean
  isMobile?: boolean
  onChange: (field: string, value: string | boolean) => void
}

export default function ClimbingInfoSection({
  startYear,
  frequentGyms,
  favoriteRouteType,
  isEditing,
  onChange,
}: ClimbingInfoSectionProps) {
  // 生成年份選項（最近 30 年）
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const options = []
    for (let year = currentYear; year >= currentYear - 30; year--) {
      options.push({
        label: year.toString(),
        value: year.toString(),
      })
    }
    return options
  }, [])

  return (
    <View style={styles.container}>
      <ProfileFormField label="哪一年開始攀岩">
        {isEditing ? (
          <Select
            value={startYear}
            onValueChange={(value) => onChange('startYear', value)}
            placeholder="選擇年份"
            options={yearOptions}
          />
        ) : (
          <ProfileTextDisplay text={startYear ? `${startYear} 年` : '未設定'} />
        )}
      </ProfileFormField>
      <ProfileFormField label="平常出沒的地方" hint="用逗號分隔多個地點">
        {isEditing ? (
          <Input
            value={frequentGyms}
            onChangeText={(text) => onChange('frequentGyms', text)}
            placeholder="例如：小岩攀岩館, 紅石攀岩館"
          />
        ) : (
          <ProfileTextDisplay
            text={frequentGyms || '未設定'}
            asTags={Boolean(frequentGyms)}
          />
        )}
      </ProfileFormField>
      <ProfileFormField label="喜歡的路線型態">
        {isEditing ? (
          <RouteTypeSelector
            value={favoriteRouteType}
            onChange={(value) => onChange('favoriteRouteType', value)}
          />
        ) : (
          <ProfileTextDisplay
            text={favoriteRouteType || '未設定'}
            asTags={Boolean(favoriteRouteType)}
          />
        )}
      </ProfileFormField>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
})
