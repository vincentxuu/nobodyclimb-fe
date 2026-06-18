import { Redirect } from 'expo-router'

export default function ProfileIndexScreen() {
  return <Redirect href={'/profile/editor' as never} />
}
