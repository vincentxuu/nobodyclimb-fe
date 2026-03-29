import { SEMANTIC_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CreateAscentFlow } from '@/components/ascent/CreateAscentFlow'

export default function CreateAscentPage() {
  const router = useRouter()
  return (
    <SafeAreaView style={styles.container}>
      <CreateAscentFlow onSuccess={() => router.back()} onCancel={() => router.back()} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SEMANTIC_COLORS.pageBg },
})
