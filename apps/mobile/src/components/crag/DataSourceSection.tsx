import { BORDER_RADIUS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { Clock, Database, MessageSquare, User } from 'lucide-react-native'
import React from 'react'
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Text } from '@/components/ui'

export interface DataSourceInfo {
  source: string
  sourceUrl?: string
  lastUpdated?: string
  maintainer: string
  maintainerUrl?: string
  version?: string
}

interface DataSourceSectionProps {
  data: DataSourceInfo
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return '-'
  }
}

interface InfoRowProps {
  icon: React.ReactNode
  label: string
  value: string
  url?: string
}

function InfoRow({ icon, label, value, url }: InfoRowProps) {
  const handlePress = () => {
    if (url) {
      Linking.openURL(url)
    }
  }

  return (
    <View style={styles.row}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
      {url ? (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
          <Text style={styles.linkValue}>{value}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
    </View>
  )
}

export function DataSourceSection({ data }: DataSourceSectionProps) {
  const iconColor = WB_COLORS[40] ?? '#9CA3AF'
  const iconSize = 16

  return (
    <View style={styles.container}>
      <InfoRow
        icon={<Database size={iconSize} color={iconColor} />}
        label="資料來源"
        value={data.source}
        url={data.sourceUrl}
      />
      <View style={styles.divider} />
      <InfoRow
        icon={<Clock size={iconSize} color={iconColor} />}
        label="最後更新"
        value={formatDate(data.lastUpdated)}
      />
      <View style={styles.divider} />
      <InfoRow
        icon={<User size={iconSize} color={iconColor} />}
        label="資料維護"
        value={data.maintainer}
        url={data.maintainerUrl}
      />
      <View style={styles.divider} />
      <InfoRow
        icon={<MessageSquare size={iconSize} color={iconColor} />}
        label="回報錯誤"
        value="提交回報"
        url="https://forms.gle/Q1d4UXWpTUHVVCY88"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: WB_COLORS[5],
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[2],
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: SPACING[2],
  },
  label: {
    fontSize: 14,
    color: WB_COLORS[60],
    marginRight: SPACING[2],
    minWidth: 64,
  },
  value: {
    fontSize: 14,
    color: WB_COLORS[90],
    flex: 1,
  },
  linkValue: {
    fontSize: 14,
    color: '#F97316',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: WB_COLORS[20],
  },
})
