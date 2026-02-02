import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Text } from '../ui/Text'
import { Icon } from '../ui/Icon'
import { AvatarWithFallback } from '../ui/AvatarWithFallback'
import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'

interface BiographyAvatarSectionProps {
  avatarUrl: string | null
  coverImageUrl: string | null
  isEditing: boolean
  isMobile?: boolean
  onAvatarUpload: (uri: string) => Promise<void>
  onCoverImageUpload: (uri: string) => Promise<void>
  onAvatarDelete: () => void
  onCoverImageDelete: () => void
}

export default function BiographyAvatarSection({
  avatarUrl,
  coverImageUrl,
  isEditing,
  onAvatarUpload,
  onCoverImageUpload,
  onAvatarDelete,
  onCoverImageDelete,
}: BiographyAvatarSectionProps) {
  const pickImage = async (type: 'avatar' | 'cover') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [21, 9],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      if (type === 'avatar') {
        await onAvatarUpload(result.assets[0].uri)
      } else {
        await onCoverImageUpload(result.assets[0].uri)
      }
    }
  }

  return (
    <View style={styles.container}>
      {/* Cover Image */}
      <View style={styles.coverContainer}>
        {coverImageUrl ? (
          <Image
            source={{ uri: coverImageUrl }}
            style={styles.coverImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Icon name="Image" size="lg" color={COLORS.gray[400]} />
            <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted, marginTop: 8 }}>
              封面照片
            </Text>
          </View>
        )}
        {isEditing && (
          <View style={styles.coverActions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => pickImage('cover')}
            >
              <Icon name="Camera" size="sm" color={COLORS.white} />
            </Pressable>
            {coverImageUrl && (
              <Pressable
                style={[styles.actionButton, styles.deleteButton]}
                onPress={onCoverImageDelete}
              >
                <Icon name="Trash2" size="sm" color={COLORS.white} />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatarContainer}>
          <AvatarWithFallback
            src={avatarUrl}
            size="xl"
            fallback=""
          />
          {isEditing && (
            <View style={styles.avatarActions}>
              <Pressable
                style={styles.avatarButton}
                onPress={() => pickImage('avatar')}
              >
                <Icon name="Camera" size="xs" color={COLORS.white} />
              </Pressable>
              {avatarUrl && (
                <Pressable
                  style={[styles.avatarButton, styles.deleteButton]}
                  onPress={onAvatarDelete}
                >
                  <Icon name="X" size="xs" color={COLORS.white} />
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  coverContainer: {
    width: '100%',
    aspectRatio: 21 / 9,
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverActions: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(220,38,38,0.8)',
  },
  avatarWrapper: {
    marginTop: -40,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    borderWidth: 3,
    borderColor: COLORS.white,
    borderRadius: 999,
  },
  avatarActions: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    gap: 4,
  },
  avatarButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
