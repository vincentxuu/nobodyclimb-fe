import { BORDER_RADIUS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { Cloud, Droplets, ThermometerSun } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'
import { apiClient } from '@/lib/api'

interface WeatherDisplayProps {
  location: string
  latitude?: number
  longitude?: number
}

interface ForecastItem {
  date: string
  minTemp: number | null
  maxTemp: number | null
  condition: string | null
  precipitation: number | null
}

interface WeatherData {
  location: string
  temperature: number | null
  minTemp: number | null
  maxTemp: number | null
  condition: string | null
  precipitation: number | null
  humidity: number | null
  comfort: string | null
  updatedAt: string
  forecast: ForecastItem[]
}

const WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']

function getWeatherIconColor(condition: string | null): string {
  if (!condition) return '#9ca3af'
  if (condition.includes('晴')) return '#facc15'
  if (condition.includes('雨')) return '#3b82f6'
  if (condition.includes('雷')) return '#a855f7'
  return '#9ca3af'
}

function formatForecastLabel(dateStr: string, index: number): string {
  const forecastDate = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  forecastDate.setHours(0, 0, 0, 0)

  const isEven = index % 2 === 0
  const periodLabel = isEven ? '早' : '晚'

  if (forecastDate.getTime() === today.getTime()) {
    return `今天${periodLabel}`
  }
  if (forecastDate.getTime() === tomorrow.getTime()) {
    return `明天${periodLabel}`
  }

  const weekday = WEEKDAYS[forecastDate.getDay()]
  return `${weekday}${periodLabel}`
}

export function WeatherDisplay({ location, latitude, longitude }: WeatherDisplayProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchWeather() {
      setLoading(true)
      setError(false)
      try {
        let response
        if (latitude !== undefined && longitude !== undefined) {
          response = await apiClient.get('/weather/coordinates', {
            params: { lat: latitude, lon: longitude },
          })
        } else {
          response = await apiClient.get('/weather', {
            params: { location },
          })
        }
        const data: WeatherData = response.data?.data ?? response.data
        if (!cancelled) {
          setWeather(data)
        }
      } catch {
        if (!cancelled) {
          setError(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchWeather()

    return () => {
      cancelled = true
    }
  }, [location, latitude, longitude])

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={WB_COLORS[60]} />
      </View>
    )
  }

  if (error || !weather) {
    return null
  }

  const iconColor = getWeatherIconColor(weather.condition)

  return (
    <View style={styles.card}>
      {/* Current Weather */}
      <View style={styles.currentWeather}>
        <View style={styles.tempRow}>
          <Text style={styles.temperature}>
            {weather.temperature !== null ? `${Math.round(weather.temperature)}°` : '--°'}
          </Text>
          <View style={styles.conditionBlock}>
            <Cloud size={20} color={iconColor} />
            {weather.condition ? (
              <Text style={styles.conditionText}>{weather.condition}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.metaRow}>
          {weather.minTemp !== null && weather.maxTemp !== null ? (
            <View style={styles.metaItem}>
              <ThermometerSun size={14} color="#9ca3af" />
              <Text style={styles.metaText}>
                {Math.round(weather.minTemp)}° / {Math.round(weather.maxTemp)}°
              </Text>
            </View>
          ) : null}

          {weather.precipitation !== null ? (
            <View style={styles.metaItem}>
              <Droplets size={14} color="#9ca3af" />
              <Text style={styles.metaText}>{weather.precipitation}%</Text>
            </View>
          ) : null}

          {weather.humidity !== null ? (
            <View style={styles.metaItem}>
              <Droplets size={14} color="#9ca3af" />
              <Text style={styles.metaText}>濕度 {weather.humidity}%</Text>
            </View>
          ) : null}
        </View>

        {weather.comfort ? <Text style={styles.comfortText}>{weather.comfort}</Text> : null}
      </View>

      {/* Forecast */}
      {weather.forecast && weather.forecast.length > 0 ? (
        <>
          <View style={styles.divider} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.forecastScroll}
          >
            {weather.forecast.slice(0, 14).map((item, index) => {
              const forecastIconColor = getWeatherIconColor(item.condition)
              return (
                <View key={`${item.date}-${index}`} style={styles.forecastItem}>
                  <Text style={styles.forecastLabel}>{formatForecastLabel(item.date, index)}</Text>
                  <Cloud size={18} color={forecastIconColor} />
                  <Text style={styles.forecastTemp}>
                    {item.minTemp !== null ? `${Math.round(item.minTemp)}°` : '--'}
                    {' / '}
                    {item.maxTemp !== null ? `${Math.round(item.maxTemp)}°` : '--'}
                  </Text>
                  {item.precipitation !== null ? (
                    <Text style={styles.forecastPrecip}>{item.precipitation}%</Text>
                  ) : null}
                </View>
              )
            })}
          </ScrollView>
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    overflow: 'hidden',
  },
  currentWeather: {
    gap: SPACING[2],
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  temperature: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 56,
  },
  conditionBlock: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: SPACING[1],
  },
  conditionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[3],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
  },
  comfortText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: SPACING[1],
  },
  divider: {
    height: 1,
    backgroundColor: WB_COLORS[20],
    marginVertical: SPACING[3],
  },
  forecastScroll: {
    flexDirection: 'row',
    gap: SPACING[2],
    paddingBottom: SPACING[1],
  },
  forecastItem: {
    width: 70,
    alignItems: 'center',
    gap: SPACING[1],
    paddingVertical: SPACING[2],
  },
  forecastLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  forecastTemp: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
  },
  forecastPrecip: {
    fontSize: 11,
    color: '#3b82f6',
    textAlign: 'center',
  },
})
