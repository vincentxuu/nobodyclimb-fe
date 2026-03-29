import { BORDER_RADIUS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { AlertCircle, Camera, ExternalLink } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'
import { apiClient } from '@/lib/api'

interface TrafficCamerasCardProps {
  latitude: number
  longitude: number
}

interface CameraData {
  camid: string
  camname: string
  camuri: string
  location: string
  direction?: string
}

const SERVICE_URL = 'https://www.1968services.tw/'
const CAM_URL = (camid: string) => `https://www.1968services.tw/cam/${camid}`

export function TrafficCamerasCard({ latitude, longitude }: TrafficCamerasCardProps) {
  const [cameras, setCameras] = useState<CameraData[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchCameras() {
      setLoading(true)
      try {
        const response = await apiClient.get('/traffic/cameras', {
          params: { lat: latitude, lon: longitude },
        })
        const data: CameraData[] = response.data?.data ?? []
        if (!cancelled) {
          setCameras(data.slice(0, 6))
          setSelectedIndex(0)
        }
      } catch {
        if (!cancelled) {
          setCameras([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchCameras()
    return () => {
      cancelled = true
    }
  }, [latitude, longitude])

  const selectedCamera = cameras[selectedIndex] ?? null

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Camera size={18} color={WB_COLORS[70]} />
          <Text style={styles.headerTitle}>交通攝影機</Text>
        </View>
        <Pressable
          onPress={() => Linking.openURL(SERVICE_URL)}
          style={styles.headerLink}
          accessibilityLabel="開啟 1968 服務網站"
          accessibilityRole="link"
        >
          <Text style={styles.headerLinkText}>1968 服務</Text>
          <ExternalLink size={14} color={'#FFE70C'} />
        </Pressable>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={'#FFE70C'} />
        </View>
      ) : cameras.length === 0 ? (
        <View style={styles.center}>
          <AlertCircle size={32} color={WB_COLORS[40]} />
          <Text style={styles.emptyText}>附近沒有找到交通攝影機</Text>
          <Pressable
            onPress={() => Linking.openURL(SERVICE_URL)}
            style={styles.emptyLink}
            accessibilityLabel="前往 1968 服務"
            accessibilityRole="link"
          >
            <Text style={styles.emptyLinkText}>前往 1968 服務</Text>
            <ExternalLink size={13} color={'#FFE70C'} />
          </Pressable>
        </View>
      ) : (
        <>
          {/* Main camera image */}
          {selectedCamera && (
            <Pressable
              onPress={() => Linking.openURL(CAM_URL(selectedCamera.camid))}
              accessibilityLabel={`開啟攝影機 ${selectedCamera.camname}`}
              accessibilityRole="link"
            >
              <Image
                source={{ uri: selectedCamera.camuri }}
                style={styles.mainImage}
                resizeMode="cover"
                accessibilityLabel={selectedCamera.camname}
              />
            </Pressable>
          )}

          {/* Camera name and direction */}
          {selectedCamera && (
            <View style={styles.cameraInfo}>
              <Text style={styles.cameraName} numberOfLines={1}>
                {selectedCamera.camname}
              </Text>
              {selectedCamera.direction ? (
                <Text style={styles.cameraDirection} numberOfLines={1}>
                  {selectedCamera.direction}
                </Text>
              ) : null}
            </View>
          )}

          {/* Thumbnail grid */}
          <View style={styles.thumbnailGrid}>
            {cameras.map((camera, index) => {
              const isSelected = index === selectedIndex
              return (
                <Pressable
                  key={camera.camid}
                  onPress={() => setSelectedIndex(index)}
                  style={[styles.thumbnailWrapper, isSelected && styles.thumbnailSelected]}
                  accessibilityLabel={`選擇攝影機 ${camera.camname}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Image
                    source={{ uri: camera.camuri }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                    accessibilityLabel={camera.camname}
                  />
                </Pressable>
              )
            })}
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[4],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: WB_COLORS[100],
    marginLeft: SPACING[2],
  },
  headerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLinkText: {
    fontSize: 13,
    color: '#FFE70C',
    marginRight: 4,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING[4] * 2,
    gap: SPACING[2],
  },
  emptyText: {
    fontSize: 14,
    color: WB_COLORS[50],
    marginTop: SPACING[2],
  },
  emptyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING[2],
    gap: 4,
  },
  emptyLinkText: {
    fontSize: 13,
    color: '#FFE70C',
    marginRight: 4,
  },
  mainImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: BORDER_RADIUS.lg / 2,
    backgroundColor: WB_COLORS[10],
  },
  cameraInfo: {
    marginTop: SPACING[2],
    marginBottom: SPACING[3],
  },
  cameraName: {
    fontSize: 14,
    fontWeight: '600',
    color: WB_COLORS[90],
  },
  cameraDirection: {
    fontSize: 12,
    color: WB_COLORS[50],
    marginTop: 2,
  },
  thumbnailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
  },
  thumbnailWrapper: {
    width: '30%',
    borderRadius: BORDER_RADIUS.lg / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailSelected: {
    borderColor: '#FFE70C',
  },
  thumbnailImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: WB_COLORS[10],
  },
})
