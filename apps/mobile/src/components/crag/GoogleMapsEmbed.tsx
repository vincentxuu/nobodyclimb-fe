import React from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { RADIUS } from '@nobodyclimb/constants'

interface GoogleMapsEmbedProps {
  latitude: number
  longitude: number
  height?: number
}

export function GoogleMapsEmbed({ latitude, longitude, height = 200 }: GoogleMapsEmbedProps) {
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ uri: mapUrl }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
})
