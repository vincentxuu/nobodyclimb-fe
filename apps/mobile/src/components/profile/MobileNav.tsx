import React from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { Text } from '../ui/Text'
import { useMobileNav, MobileNavSection } from './MobileNavContext'
import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'

const NAV_ITEMS: { id: MobileNavSection; label: string }[] = [
  { id: 'basic', label: '基本資料' },
  { id: 'climbing', label: '攀岩資訊' },
  { id: 'social', label: '社群連結' },
  { id: 'experience', label: '攀岩經歷' },
  { id: 'advanced', label: '進階故事' },
  { id: 'footprints', label: '攀岩足跡' },
  { id: 'settings', label: '隱私設定' },
]

export default function MobileNav() {
  const { activeSection, scrollToSection } = useMobileNav()

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id
          return (
            <Pressable
              key={item.id}
              onPress={() => scrollToSection(item.id)}
              style={[styles.navItem, isActive && styles.navItemActive]}
            >
              <Text
                variant="body"
                style={[
                  styles.navText,
                  isActive && styles.navTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  navItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.gray[100],
  },
  navItemActive: {
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  navText: {
    color: SEMANTIC_COLORS.textMuted,
  },
  navTextActive: {
    color: COLORS.white,
  },
})
