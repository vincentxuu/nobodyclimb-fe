import { SEMANTIC_COLORS } from '@nobodyclimb/constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { Alert, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CreateAscentFlow } from '@/components/ascent/CreateAscentFlow'

const getRecommendationCountKey = () => {
  const today = new Date().toISOString().slice(0, 10)
  return `daily_recommendation_count:${today}`
}

export default function CreateAscentPage() {
  const router = useRouter()

  const handleSuccess = async () => {
    const countKey = getRecommendationCountKey()
    const storedCount = await AsyncStorage.getItem(countKey)
    const count = Number.parseInt(storedCount ?? '0', 10) || 0

    if (count < 3) {
      await AsyncStorage.setItem(countKey, String(count + 1))
      Alert.alert('新增成功', '攀登記錄已新增。要看看 AI 推薦的下一條路線嗎？', [
        { text: '稍後再說', style: 'cancel', onPress: () => router.back() },
        { text: '查看推薦', onPress: () => router.replace('/profile/recommendations' as any) },
      ])
      return
    }

    Alert.alert('新增成功', '攀登記錄已新增', [{ text: '確定', onPress: () => router.back() }])
  }

  return (
    <SafeAreaView style={styles.container}>
      <CreateAscentFlow onSuccess={handleSuccess} onCancel={() => router.back()} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SEMANTIC_COLORS.pageBg },
})
