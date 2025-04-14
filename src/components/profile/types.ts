export interface ProfileData {
  name: string;
  startYear: string;
  frequentGyms: string;
  favoriteRouteType: string;
  climbingReason: string;
  climbingMeaning: string;
  climbingBucketList: string;
  adviceForBeginners: string;
  isPublic: boolean;
}

// 初始資料
export const initialProfileData: ProfileData = {
  name: '許岩手',
  startYear: '2020',
  frequentGyms: '小岩攀岩館',
  favoriteRouteType: '長路線',
  climbingReason: '因為朋友介紹開始攀岩，體驗過後深深愛上這種運動的挑戰性和成就感。',
  climbingMeaning: '攀岩對我來說是一種生活方式，讓我能夠挑戰自我、放鬆心情，也認識了很多志同道合的朋友。',
  climbingBucketList: '想要挑戰世界各地的著名岩場，特別是泰國的Tonsai和美國的Yosemite。希望能在攀岩世界中不斷進步，挑戰更高難度的路線。',
  adviceForBeginners: '享受其中是最重要的事！',
  isPublic: true
};
