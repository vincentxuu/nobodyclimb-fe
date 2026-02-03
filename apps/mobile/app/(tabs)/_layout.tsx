import { Tabs } from 'expo-router'
import { Home, Users, User, Compass } from 'lucide-react-native'
import { SEMANTIC_COLORS, FONT_SIZE } from '@nobodyclimb/constants'

const ICON_SIZE = 24

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: SEMANTIC_COLORS.textMain,
        tabBarInactiveTintColor: SEMANTIC_COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: FONT_SIZE.xs,
          fontWeight: '500',
        },
        tabBarStyle: {
          height: 56,
          backgroundColor: SEMANTIC_COLORS.cardBg,
          borderTopWidth: 1,
          borderTopColor: SEMANTIC_COLORS.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首頁',
          tabBarIcon: ({ color }) => <Home size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '探索',
          tabBarIcon: ({ color }) => <Compass size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="biography"
        options={{
          title: '傳記',
          tabBarIcon: ({ color }) => <Users size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '個人',
          tabBarIcon: ({ color }) => <User size={ICON_SIZE} color={color} />,
        }}
      />
    </Tabs>
  )
}
