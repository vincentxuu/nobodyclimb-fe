/**
 * DayCard
 *
 * 每日訓練卡片，對應 apps/web/src/components/quiz/training/DayCard.tsx
 */

import { BORDER_RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import type { PersonalityTypeCode, TrainingDay, TrainingProgressRecord } from '@nobodyclimb/types'
import { Check, ChevronDown, Clock, Dumbbell, StickyNote } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Button, Text, TextArea } from '@/components/ui'

interface DayCardProps {
  day: TrainingDay
  weekNumber: number
  progressRecord?: TrainingProgressRecord
  accentColor: string
  onToggleComplete: (payload: {
    personality_type: PersonalityTypeCode
    week: number
    day: number
    completed: boolean
    notes?: string | null
  }) => void
  personalityType: PersonalityTypeCode
}

export function DayCard({
  day,
  weekNumber,
  progressRecord,
  accentColor,
  onToggleComplete,
  personalityType,
}: DayCardProps) {
  const isCompleted = !!progressRecord?.completed
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState(progressRecord?.notes ?? '')
  const hasNotes = !!progressRecord?.notes

  useEffect(() => {
    setNotes(progressRecord?.notes ?? '')
  }, [progressRecord?.notes])

  const handleToggle = () => {
    onToggleComplete({
      personality_type: personalityType,
      week: weekNumber,
      day: day.dayNumber,
      completed: !isCompleted,
    })
  }

  const handleSaveNotes = () => {
    onToggleComplete({
      personality_type: personalityType,
      week: weekNumber,
      day: day.dayNumber,
      completed: isCompleted,
      notes: notes || null,
    })
    setShowNotes(false)
  }

  return (
    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
      <View style={styles.row}>
        <Pressable
          onPress={handleToggle}
          style={[styles.checkbox, isCompleted && styles.checkboxDone]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted }}
          accessibilityLabel={`Day ${day.dayNumber} ${isCompleted ? '已完成' : '未完成'}`}
        >
          {isCompleted && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
        </Pressable>

        <View style={[styles.content, isCompleted && styles.contentCompleted]}>
          <View style={styles.titleRow}>
            <Text variant="bodyBold" style={styles.title}>
              Day {day.dayNumber}：{day.title}
            </Text>
            {hasNotes && <StickyNote size={14} color="#F59E0B" />}
          </View>

          <Text variant="small" color="textSubtle" style={styles.description}>
            {day.description}
          </Text>

          <View style={styles.durationRow}>
            <Clock size={14} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="small" color="textMuted">
              {day.duration} 分鐘
            </Text>
          </View>

          <View style={styles.exercises}>
            {day.exercises.map((exercise, i) => (
              <View key={i} style={styles.exercise}>
                <Dumbbell size={14} color={SEMANTIC_COLORS.textMuted} style={styles.exerciseIcon} />
                <Text variant="small" style={styles.exerciseText}>
                  <Text variant="small" fontWeight="600">
                    {exercise.name}
                  </Text>
                  <Text variant="small" color="textSubtle">
                    {' '}
                    — {exercise.description}
                  </Text>
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.notesSection}>
            <Pressable onPress={() => setShowNotes(!showNotes)} style={styles.notesToggle}>
              <ChevronDown
                size={14}
                color={SEMANTIC_COLORS.textMuted}
                style={showNotes ? styles.chevronUp : undefined}
              />
              <Text variant="small" color="textMuted">
                {hasNotes ? '查看筆記' : '新增筆記'}
              </Text>
            </Pressable>

            {showNotes && (
              <View style={styles.notesEditor}>
                <TextArea
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="記錄今天的訓練心得..."
                  minRows={3}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onPress={handleSaveNotes}
                  style={{ backgroundColor: accentColor, alignSelf: 'flex-start' }}
                >
                  儲存筆記
                </Button>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: SEMANTIC_COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING[4],
  },
  cardCompleted: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF580',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING[3],
  },
  checkbox: {
    width: 24,
    height: 24,
    marginTop: 2,
    borderWidth: 2,
    borderColor: SEMANTIC_COLORS.borderSubtle,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    borderColor: SEMANTIC_COLORS.success,
    backgroundColor: SEMANTIC_COLORS.success,
  },
  content: {
    flex: 1,
  },
  contentCompleted: {
    opacity: 0.6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  title: {
    flexShrink: 1,
  },
  description: {
    marginTop: SPACING[1],
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    marginTop: SPACING[2],
  },
  exercises: {
    marginTop: SPACING[3],
    gap: SPACING[2],
  },
  exercise: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  exerciseIcon: {
    marginTop: 3,
  },
  exerciseText: {
    flex: 1,
  },
  notesSection: {
    marginTop: SPACING[3],
    paddingTop: SPACING[2],
    borderTopWidth: 1,
    borderTopColor: SEMANTIC_COLORS.border,
  },
  notesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  notesEditor: {
    marginTop: SPACING[2],
    gap: SPACING[2],
  },
})
