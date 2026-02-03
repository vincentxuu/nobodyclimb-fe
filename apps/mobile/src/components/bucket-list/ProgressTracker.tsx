/**
 * ProgressTracker 組件
 *
 * 進度追蹤組件，支援百分比進度條和里程碑模式
 * 對應 apps/web/src/components/bucket-list/progress-tracker.tsx
 */
import React, { useMemo } from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Check, Circle } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, DURATION } from '@nobodyclimb/constants'
import type { Milestone } from '@nobodyclimb/types'
import { Text } from '../ui/Text'

type ProgressMode = 'manual' | 'milestone' | null

type ProgressSize = 'sm' | 'md' | 'lg'

interface SizeConfig {
  barHeight: number
  milestoneSize: number
  iconSize: number
  fontSize: number
  spacing: number
}

const SIZE_CONFIG: Record<ProgressSize, SizeConfig> = {
  sm: {
    barHeight: 6,
    milestoneSize: 20,
    iconSize: 12,
    fontSize: 10,
    spacing: 4,
  },
  md: {
    barHeight: 8,
    milestoneSize: 24,
    iconSize: 14,
    fontSize: 12,
    spacing: 8,
  },
  lg: {
    barHeight: 12,
    milestoneSize: 32,
    iconSize: 20,
    fontSize: 14,
    spacing: 12,
  },
}

export interface ProgressTrackerProps {
  /** 進度模式 */
  mode: ProgressMode
  /** 進度值 (0-100) */
  progress: number
  /** 里程碑列表 (milestone 模式) */
  milestones?: Milestone[] | string | null
  /** 是否顯示標籤 */
  showLabels?: boolean
  /** 尺寸 */
  size?: ProgressSize
  /** 是否可編輯 */
  editable?: boolean
  /** 進度變化回調 (manual 模式) */
  onProgressChange?: (progress: number) => void
  /** 里程碑切換回調 (milestone 模式) */
  onMilestoneToggle?: (milestoneId: string, completed: boolean) => void
}

/**
 * 進度追蹤組件
 */
export function ProgressTracker({
  mode,
  progress,
  milestones,
  showLabels = true,
  size = 'md',
  editable = false,
  onProgressChange,
  onMilestoneToggle,
}: ProgressTrackerProps) {
  const sizeConfig = SIZE_CONFIG[size]

  // 如果沒有模式，不渲染
  if (!mode) return null

  // 百分比進度模式
  if (mode === 'manual') {
    return (
      <ManualProgress
        progress={progress}
        showLabels={showLabels}
        sizeConfig={sizeConfig}
        editable={editable}
        onProgressChange={onProgressChange}
      />
    )
  }

  // 里程碑模式
  return (
    <MilestoneProgress
      progress={progress}
      milestones={milestones}
      showLabels={showLabels}
      sizeConfig={sizeConfig}
      editable={editable}
      onMilestoneToggle={onMilestoneToggle}
    />
  )
}

/**
 * 百分比進度條
 */
interface ManualProgressProps {
  progress: number
  showLabels: boolean
  sizeConfig: SizeConfig
  editable: boolean
  onProgressChange?: (progress: number) => void
}

function ManualProgress({
  progress,
  showLabels,
  sizeConfig,
}: ManualProgressProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))
  const progressAnim = useSharedValue(clampedProgress)

  React.useEffect(() => {
    progressAnim.value = withTiming(clampedProgress, {
      duration: DURATION.normal,
    })
  }, [clampedProgress, progressAnim])

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value}%`,
  }))

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.progressBar,
          {
            height: sizeConfig.barHeight,
            borderRadius: sizeConfig.barHeight / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              borderRadius: sizeConfig.barHeight / 2,
            },
            progressStyle,
          ]}
        />
      </View>
      {showLabels && (
        <View style={styles.labelRow}>
          <Text variant="caption" color="textSubtle">
            進度
          </Text>
          <Text variant="caption" color="textSubtle">
            {clampedProgress}%
          </Text>
        </View>
      )}
    </View>
  )
}

/**
 * 里程碑進度
 */
interface MilestoneProgressProps {
  progress: number
  milestones?: Milestone[] | string | null
  showLabels: boolean
  sizeConfig: SizeConfig
  editable: boolean
  onMilestoneToggle?: (milestoneId: string, completed: boolean) => void
}

function MilestoneProgress({
  progress,
  milestones: rawMilestones,
  showLabels,
  sizeConfig,
  editable,
  onMilestoneToggle,
}: MilestoneProgressProps) {
  // 解析 milestones（可能是字串或陣列）
  const parsedMilestones = useMemo(() => {
    if (!rawMilestones) return null
    if (typeof rawMilestones === 'string') {
      try {
        return JSON.parse(rawMilestones) as Milestone[]
      } catch {
        return null
      }
    }
    return rawMilestones
  }, [rawMilestones])

  // 排序里程碑
  const sortedMilestones = useMemo(() => {
    if (!parsedMilestones || !Array.isArray(parsedMilestones)) return []
    return [...parsedMilestones].sort((a, b) => a.percentage - b.percentage)
  }, [parsedMilestones])

  // 如果沒有里程碑，不渲染
  if (sortedMilestones.length === 0) return null

  const progressAnim = useSharedValue(progress)

  React.useEffect(() => {
    progressAnim.value = withTiming(progress, {
      duration: DURATION.normal,
    })
  }, [progress, progressAnim])

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value}%`,
  }))

  return (
    <View style={styles.container}>
      <View style={styles.milestoneContainer}>
        {/* 背景進度條 */}
        <View
          style={[
            styles.milestoneBar,
            {
              height: sizeConfig.barHeight,
              top: (sizeConfig.milestoneSize - sizeConfig.barHeight) / 2,
            },
          ]}
        />
        {/* 已完成進度條 */}
        <Animated.View
          style={[
            styles.milestoneFill,
            {
              height: sizeConfig.barHeight,
              top: (sizeConfig.milestoneSize - sizeConfig.barHeight) / 2,
            },
            progressStyle,
          ]}
        />
        {/* 里程碑點 */}
        <View style={styles.milestonePoints}>
          {sortedMilestones.map((milestone) => (
            <MilestonePoint
              key={milestone.id}
              milestone={milestone}
              sizeConfig={sizeConfig}
              editable={editable}
              onToggle={onMilestoneToggle}
            />
          ))}
        </View>
      </View>

      {/* 里程碑標籤 */}
      {showLabels && (
        <View style={styles.milestoneLabels}>
          {sortedMilestones.map((milestone) => (
            <View
              key={milestone.id}
              style={[
                styles.milestoneLabel,
                { width: `${100 / sortedMilestones.length}%` },
              ]}
            >
              <Text
                variant="caption"
                color={milestone.completed ? 'textMain' : 'textMuted'}
                numberOfLines={2}
                style={styles.milestoneLabelText}
              >
                {milestone.title}
              </Text>
              <Text variant="small" color="textMuted">
                {milestone.percentage}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

/**
 * 里程碑點
 */
interface MilestonePointProps {
  milestone: Milestone
  sizeConfig: SizeConfig
  editable: boolean
  onToggle?: (milestoneId: string, completed: boolean) => void
}

function MilestonePoint({
  milestone,
  sizeConfig,
  editable,
  onToggle,
}: MilestonePointProps) {
  const isCompleted = milestone.completed

  const handlePress = () => {
    if (editable && onToggle) {
      onToggle(milestone.id, !isCompleted)
    }
  }

  const pointStyle = [
    styles.milestonePoint,
    {
      width: sizeConfig.milestoneSize,
      height: sizeConfig.milestoneSize,
      borderRadius: sizeConfig.milestoneSize / 2,
    },
    isCompleted && styles.milestonePointCompleted,
  ]

  const iconColor = isCompleted
    ? SEMANTIC_COLORS.textMain
    : SEMANTIC_COLORS.textMuted

  return (
    <Pressable
      onPress={handlePress}
      disabled={!editable}
      style={pointStyle}
    >
      {isCompleted ? (
        <Check size={sizeConfig.iconSize} color={iconColor} />
      ) : (
        <Circle size={sizeConfig.iconSize - 4} color={iconColor} />
      )}
    </Pressable>
  )
}

/**
 * 簡化的進度條組件
 */
export interface ProgressBarProps {
  /** 進度值 (0-100) */
  progress: number
  /** 尺寸 */
  size?: ProgressSize
  /** 是否顯示標籤 */
  showLabel?: boolean
}

export function ProgressBar({
  progress,
  size = 'md',
  showLabel = true,
}: ProgressBarProps) {
  const sizeConfig = SIZE_CONFIG[size]
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.progressBar,
          {
            height: sizeConfig.barHeight,
            borderRadius: sizeConfig.barHeight / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: `${clampedProgress}%`,
              borderRadius: sizeConfig.barHeight / 2,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text
          variant="caption"
          color="textSubtle"
          style={styles.progressLabel}
        >
          {clampedProgress}%
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  progressBar: {
    width: '100%',
    backgroundColor: '#E5E5E5',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: `${SEMANTIC_COLORS.brand}B3`, // 70% opacity
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING[1],
  },
  progressLabel: {
    textAlign: 'right',
    marginTop: 2,
  },
  milestoneContainer: {
    position: 'relative',
    width: '100%',
  },
  milestoneBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
  },
  milestoneFill: {
    position: 'absolute',
    left: 0,
    backgroundColor: `${SEMANTIC_COLORS.brand}B3`,
    borderRadius: 4,
  },
  milestonePoints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestonePoint: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D3D3D3',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  milestonePointCompleted: {
    backgroundColor: `${SEMANTIC_COLORS.brand}B3`,
    borderColor: SEMANTIC_COLORS.textMain,
  },
  milestoneLabels: {
    flexDirection: 'row',
    marginTop: SPACING[2],
  },
  milestoneLabel: {
    alignItems: 'center',
  },
  milestoneLabelText: {
    textAlign: 'center',
    maxWidth: 80,
  },
})
