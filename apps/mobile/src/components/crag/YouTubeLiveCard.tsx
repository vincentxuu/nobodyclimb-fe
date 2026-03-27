import React from 'react';
import { View, StyleSheet, Linking, TouchableOpacity, Image } from 'react-native';
import { Text } from '@/components/ui';
import { SPACING, WB_COLORS, BORDER_RADIUS } from '@nobodyclimb/constants';
import { ExternalLink, Play } from 'lucide-react-native';

interface YouTubeLiveCardProps {
  videoId: string;
  title?: string;
  description?: string;
}

export function YouTubeLiveCard({ videoId, title = '即時影像', description }: YouTubeLiveCardProps) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const handleOpenYouTube = () => {
    Linking.openURL(watchUrl);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.externalLink} onPress={handleOpenYouTube} accessibilityRole="link" accessibilityLabel="在 YouTube 觀看">
          <Text style={styles.externalLinkText}>在 YouTube 觀看</Text>
          <ExternalLink size={14} color={WB_COLORS[60]} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleOpenYouTube}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`播放 ${title}`}
      >
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
            accessibilityLabel={title}
          />
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    gap: SPACING[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: WB_COLORS[90],
    flex: 1,
  },
  externalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  externalLinkText: {
    fontSize: 13,
    color: WB_COLORS[60],
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  description: {
    fontSize: 14,
    color: WB_COLORS[70],
    lineHeight: 20,
  },
});
