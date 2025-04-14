import { create } from 'zustand'
import { Post, Gym, Gallery, PaginatedResponse, SearchParams } from '@/lib/types'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/lib/constants'

interface ContentState {
  // 文章相關
  posts: Post[]
  featuredPosts: Post[]
  currentPost: Post | null
  postsLoading: boolean
  postsError: string | null
  postsPagination: {
    currentPage: number
    totalPages: number
    hasMore: boolean
  }
  
  // 攀岩館相關
  gyms: Gym[]
  featuredGyms: Gym[]
  currentGym: Gym | null
  gymsLoading: boolean
  gymsError: string | null
  gymsPagination: {
    currentPage: number
    totalPages: number
    hasMore: boolean
  }
  
  // 相簿相關
  galleries: Gallery[]
  currentGallery: Gallery | null
  galleriesLoading: boolean
  galleriesError: string | null
  galleriesPagination: {
    currentPage: number
    totalPages: number
    hasMore: boolean
  }
  
  // 搜尋相關
  searchResults: {
    posts: Post[]
    gyms: Gym[]
    galleries: Gallery[]
  }
  searchLoading: boolean
  searchError: string | null
  
  // 動作 - 文章
  fetchPosts: (page?: number, limit?: number, tags?: string[]) => Promise<void>
  fetchPostById: (id: string) => Promise<void>
  fetchPostBySlug: (slug: string) => Promise<void>
  fetchFeaturedPosts: () => Promise<void>
  
  // 動作 - 攀岩館
  fetchGyms: (page?: number, limit?: number, facilities?: string[]) => Promise<void>
  fetchGymById: (id: string) => Promise<void>
  fetchGymBySlug: (slug: string) => Promise<void>
  fetchFeaturedGyms: () => Promise<void>
  
  // 動作 - 相簿
  fetchGalleries: (page?: number, limit?: number) => Promise<void>
  fetchGalleryById: (id: string) => Promise<void>
  fetchGalleryBySlug: (slug: string) => Promise<void>
  
  // 動作 - 搜尋
  search: (params: SearchParams) => Promise<void>
  clearSearch: () => void
}

export const useContentStore = create<ContentState>((set, get) => ({
  // 文章初始狀態
  posts: [],
  featuredPosts: [],
  currentPost: null,
  postsLoading: false,
  postsError: null,
  postsPagination: {
    currentPage: DEFAULT_PAGE,
    totalPages: 1,
    hasMore: false,
  },
  
  // 攀岩館初始狀態
  gyms: [],
  featuredGyms: [],
  currentGym: null,
  gymsLoading: false,
  gymsError: null,
  gymsPagination: {
    currentPage: DEFAULT_PAGE,
    totalPages: 1,
    hasMore: false,
  },
  
  // 相簿初始狀態
  galleries: [],
  currentGallery: null,
  galleriesLoading: false,
  galleriesError: null,
  galleriesPagination: {
    currentPage: DEFAULT_PAGE,
    totalPages: 1,
    hasMore: false,
  },
  
  // 搜尋初始狀態
  searchResults: {
    posts: [],
    gyms: [],
    galleries: [],
  },
  searchLoading: false,
  searchError: null,
  
  // 文章相關動作
  fetchPosts: async (page = DEFAULT_PAGE, limit = DEFAULT_PAGE_SIZE, tags = []) => {
    set({ postsLoading: true, postsError: null })
    try {
      // 實際專案需串接API
      // const response = await apiClient.get('/posts', { params: { page, limit, tags } })
      // const { data, meta } = response.data as PaginatedResponse<Post>
      
      // 模擬API回應
      setTimeout(() => {
        const mockPosts: Post[] = Array(limit).fill(0).map((_, i) => ({
          id: `post-${(page - 1) * limit + i + 1}`,
          title: `攀岩技巧分享 #${(page - 1) * limit + i + 1}`,
          slug: `climbing-tips-${(page - 1) * limit + i + 1}`,
          content: `這是第 ${(page - 1) * limit + i + 1} 篇文章的內容...`,
          summary: `學習進階攀岩技巧，提升你的攀岩能力...`,
          coverImage: `/images/post-${(i % 5) + 1}.jpg`,
          createdAt: new Date(Date.now() - i * 86400000),
          authorId: 'user-1',
          tags: ['技巧分享', '初學入門'],
          likes: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 20),
          views: Math.floor(Math.random() * 1000),
        }))
        
        set((state) => ({
          posts: page === 1 ? mockPosts : [...state.posts, ...mockPosts],
          postsLoading: false,
          postsPagination: {
            currentPage: page,
            totalPages: 5, // 模擬總頁數
            hasMore: page < 5, // 模擬還有更多頁
          },
        }))
      }, 800)
    } catch (error) {
      set({
        postsError: '無法載入文章，請稍後再試',
        postsLoading: false,
      })
    }
  },
  
  fetchPostById: async (id) => {
    set({ postsLoading: true, postsError: null })
    try {
      // 實際專案需串接API
      // const response = await apiClient.get(`/posts/${id}`)
      // const post = response.data as Post
      
      // 模擬API回應
      setTimeout(() => {
        const mockPost: Post = {
          id,
          title: `攀岩技巧分享 #${id}`,
          slug: `climbing-tips-${id}`,
          content: `這是文章 ${id} 的詳細內容，包含了許多攀岩技巧的分享...`,
          summary: `學習進階攀岩技巧，提升你的攀岩能力...`,
          coverImage: `/images/post-${(parseInt(id.split('-')[1]) % 5) + 1}.jpg`,
          createdAt: new Date(Date.now() - parseInt(id.split('-')[1]) * 86400000),
          authorId: 'user-1',
          author: {
            id: 'user-1',
            username: 'climbing_master',
            email: 'master@example.com',
            avatar: '/images/avatar-1.jpg',
            createdAt: new Date(Date.now() - 365 * 86400000),
          },
          tags: ['技巧分享', '初學入門'],
          images: [
            `/images/post-gallery-1.jpg`,
            `/images/post-gallery-2.jpg`,
            `/images/post-gallery-3.jpg`,
          ],
          likes: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 20),
          views: Math.floor(Math.random() * 1000),
        }
        
        set({
          currentPost: mockPost,
          postsLoading: false,
        })
      }, 800)
    } catch (error) {
      set({
        postsError: '無法載入文章，請稍後再試',
        postsLoading: false,
      })
    }
  },
  
  fetchPostBySlug: async (slug) => {
    set({ postsLoading: true, postsError: null })
    try {
      // 實際專案中需串接API
      // const response = await apiClient.get(`/posts/slug/${slug}`)
      // const post = response.data as Post
      
      // 模擬API回應
      const id = slug.split('-').pop() || '1'
      get().fetchPostById(`post-${id}`)
    } catch (error) {
      set({
        postsError: '無法載入文章，請稍後再試',
        postsLoading: false,
      })
    }
  },
  
  fetchFeaturedPosts: async () => {
    set({ postsLoading: true, postsError: null })
    try {
      // 實際專案中需串接API
      // const response = await apiClient.get('/posts/featured')
      // const posts = response.data as Post[]
      
      // 模擬API回應
      setTimeout(() => {
        const mockFeaturedPosts: Post[] = Array(3).fill(0).map((_, i) => ({
          id: `featured-post-${i + 1}`,
          title: `精選攀岩文章 #${i + 1}`,
          slug: `featured-climbing-article-${i + 1}`,
          content: `這是第 ${i + 1} 篇精選文章的內容...`,
          summary: `精選攀岩技巧與故事分享...`,
          coverImage: `/images/featured-${i + 1}.jpg`,
          createdAt: new Date(Date.now() - i * 86400000),
          authorId: 'user-1',
          tags: ['技巧分享', '精選'],
          likes: 100 + Math.floor(Math.random() * 200),
          comments: 20 + Math.floor(Math.random() * 30),
          views: 1000 + Math.floor(Math.random() * 2000),
        }))
        
        set({
          featuredPosts: mockFeaturedPosts,
          postsLoading: false,
        })
      }, 800)
    } catch (error) {
      set({
        postsError: '無法載入精選文章，請稍後再試',
        postsLoading: false,
      })
    }
  },
  
  // 攀岩館相關動作
  fetchGyms: async (page = DEFAULT_PAGE, limit = DEFAULT_PAGE_SIZE, facilities = []) => {
    set({ gymsLoading: true, gymsError: null })
    try {
      // 實際專案中需串接API
      // const response = await apiClient.get('/gyms', { params: { page, limit, facilities } })
      // const { data, meta } = response.data as PaginatedResponse<Gym>
      
      // 模擬API回應
      setTimeout(() => {
        const mockGyms: Gym[] = Array(limit).fill(0).map((_, i) => ({
          id: `gym-${(page - 1) * limit + i + 1}`,
          name: `攀岩館 #${(page - 1) * limit + i + 1}`,
          slug: `climbing-gym-${(page - 1) * limit + i + 1}`,
          description: `位於市中心的專業攀岩館，提供多樣化的攀岩路線...`,
          address: `台北市信義區松高路 ${100 + i} 號`,
          coverImage: `/images/gym-${(i % 5) + 1}.jpg`,
          createdAt: new Date(Date.now() - i * 86400000),
          facilities: ['抱石區', '先鋒攀登', '體能訓練區'],
          likes: Math.floor(Math.random() * 100),
          reviews: Math.floor(Math.random() * 50),
          rating: 4 + Math.random(),
        }))
        
        set((state) => ({
          gyms: page === 1 ? mockGyms : [...state.gyms, ...mockGyms],
          gymsLoading: false,
          gymsPagination: {
            currentPage: page,
            totalPages: 3, // 模擬總頁數
            hasMore: page < 3, // 模擬還有更多頁
          },
        }))
      }, 800)
    } catch (error) {
      set({
        gymsError: '無法載入攀岩館資訊，請稍後再試',
        gymsLoading: false,
      })
    }
  },
  
  fetchGymById: async (id) => {
    set({ gymsLoading: true, gymsError: null })
    try {
      // 實際專案中需串接API
      // const response = await apiClient.get(`/gyms/${id}`)
      // const gym = response.data as Gym
      
      // 模擬API回應
      setTimeout(() => {
        const mockGym: Gym = {
          id,
          name: `攀岩館 #${id}`,
          slug: `climbing-gym-${id}`,
          description: `這是一家頂級的攀岩館，提供多種難度的攀岩路線，適合各程度的攀岩愛好者...`,
          address: `台北市信義區松高路 ${100 + parseInt(id.split('-')[1])} 號`,
          coverImage: `/images/gym-${(parseInt(id.split('-')[1]) % 5) + 1}.jpg`,
          images: [
            `/images/gym-gallery-1.jpg`,
            `/images/gym-gallery-2.jpg`,
            `/images/gym-gallery-3.jpg`,
          ],
          website: 'https://example.com/gym',
          phone: '02-1234-5678',
          openingHours: {
            monday: '10:00-22:00',
            tuesday: '10:00-22:00',
            wednesday: '10:00-22:00',
            thursday: '10:00-22:00',
            friday: '10:00-23:00',
            saturday: '09:00-23:00',
            sunday: '09:00-22:00',
          },
          createdAt: new Date(Date.now() - 100 * 86400000),
          facilities: ['抱石區', '先鋒攀登', '體能訓練區', '休息區', '置物櫃'],
          likes: Math.floor(Math.random() * 100),
          reviews: Math.floor(Math.random() * 50),
          rating: 4 + Math.random(),
        }
        
        set({
          currentGym: mockGym,
          gymsLoading: false,
        })
      }, 800)
    } catch (error) {
      set({
        gymsError: '無法載入攀岩館資訊，請稍後再試',
        gymsLoading: false,
      })
    }
  },
  
  fetchGymBySlug: async (slug) => {
    set({ gymsLoading: true, gymsError: null })
    try {
      // 實際專案中需串接API
      // const response = await apiClient.get(`/gyms/slug/${slug}`)
      // const gym = response.data as Gym
      
      // 模擬API回應
      const id = slug.split('-').pop() || '1'
      get().fetchGymById(`gym-${id}`)
    } catch (error) {
      set({
        gymsError: '無法載入攀岩館資訊，請稍後再試',
        gymsLoading: false,
      })
    }
  },
  
  fetchFeaturedGyms: async () => {
    set({ gymsLoading: true, gymsError: null })
    try {
      // 實際專案中需串接API
      // const response = await apiClient.get('/gyms/featured')
      // const gyms = response.data as Gym[]
      
      // 模擬API回應
      setTimeout(() => {
        const mockFeaturedGyms: Gym[] = Array(3).fill(0).map((_, i) => ({
          id: `featured-gym-${i + 1}`,
          name: `精選攀岩館 #${i + 1}`,
          slug: `featured-climbing-gym-${i + 1}`,
          description: `最受歡迎的攀岩館之一，提供頂級設施...`,
          address: `台北市中山區中山北路 ${200 + i} 號`,
          coverImage: `/images/featured-gym-${i + 1}.jpg`,
          createdAt: new Date(Date.now() - i * 86400000),
          facilities: ['抱石區', '先鋒攀登', '體能訓練區', '咖啡廳'],
          likes: 150 + Math.floor(Math.random() * 100),
          reviews: 70 + Math.floor(Math.random() * 30),
          rating: 4.5 + Math.random() * 0.5,
        }))
        
        set({
          featuredGyms: mockFeaturedGyms,
          gymsLoading: false,
        })
      }, 800)
    } catch (error) {
      set({
        gymsError: '無法載入精選攀岩館，請稍後再試',
        gymsLoading: false,
      })
    }
  },
  
  // 相簿相關動作
  fetchGalleries: async (page = DEFAULT_PAGE, limit = DEFAULT_PAGE_SIZE) => {
    set({ galleriesLoading: true, galleriesError: null })
    try {
      // 實際專案中需串接API
      // const response = await apiClient.get('/galleries', { params: { page, limit } })
      // const { data, meta } = response.data as PaginatedResponse<Gallery>
      
      // 模擬API回應
      setTimeout(() => {
        const mockGalleries: Gallery[] = Array(limit).fill(0).map((_, i) => ({
          id: `gallery-${(page - 1) * limit + i + 1}`,
          title: `攀岩相簿 #${(page - 1) * limit + i + 1}`,
          slug: `climbing-gallery-${(page - 1) * limit + i + 1}`,
          description: `攀岩活動的精彩照片集錦...`,
          coverImage: `/images/gallery-cover-${(i % 5) + 1}.jpg`,
          images: Array(6).fill(0).map((_, j) => `/images/gallery-${(i % 5) + 1}-${j + 1}.jpg`),
          createdAt: new Date(Date.now() - i * 86400000),
          authorId: 'user-1',
          likes: Math.floor(Math.random() * 100),
          views: Math.floor(Math.random() * 500),
        }))
        
        set((state) => ({
          galleries: page === 1 ? mockGalleries : [...state.galleries, ...mockGalleries],
          galleriesLoading: false,
          galleriesPagination: {
            currentPage: page,
            totalPages: 4, // 模擬總頁數
            hasMore: page < 4, // 模擬還有更多頁
          },
        }))
      }, 800)
    } catch (error) {
      set({
        galleriesError: '無法載入相簿，請稍後再試',
        galleriesLoading: false,
      })
    }
  },
  
  fetchGalleryById: async (id) => {
    set({ galleriesLoading: true, galleriesError: null })
    try {
      // 實際專案中需串接API
      // const response = await apiClient.get(`/galleries/${id}`)
      // const gallery = response.data as Gallery
      
      // 模擬API回應
      setTimeout(() => {
        const mockGallery: Gallery = {
          id,
          title: `攀岩相簿 #${id}`,
          slug: `climbing-gallery-${id}`,
          description: `精彩的攀岩照片集錦，記錄了攀岩過程中的美好時刻...`,
          coverImage: `/images/gallery-cover-${(parseInt(id.split('-')[1]) % 5) + 1}.jpg`,
          images: Array(9).fill(0).map((_, j) => 
            `/images/gallery-${(parseInt(id.split('-')[1]) % 5) + 1}-${j + 1}.jpg`
          ),
          createdAt: new Date(Date.now() - parseInt(id.split('-')[1]) * 86400000),
          authorId: 'user-1',
          author: {
            id: 'user-1',
            username: 'photo_master',
            email: 'photo@example.com',
            avatar: '/images/avatar-2.jpg',
            createdAt: new Date(Date.now() - 200 * 86400000),
          },
          likes: Math.floor(Math.random() * 100),
          views: Math.floor(Math.random() * 500),
        }
        
        set({
          currentGallery: mockGallery,
          galleriesLoading: false,
        })
      }, 800)
    } catch (error) {
      set({
        galleriesError: '無法載入相簿，請稍後再試',
        galleriesLoading: false,
      })
    }
  },
  
  fetchGalleryBySlug: async (slug) => {
    set({ galleriesLoading: true, galleriesError: null })
    try {
      // 實際專案中需串接API
      // const response = await apiClient.get(`/galleries/slug/${slug}`)
      // const gallery = response.data as Gallery
      
      // 模擬API回應
      const id = slug.split('-').pop() || '1'
      get().fetchGalleryById(`gallery-${id}`)
    } catch (error) {
      set({
        galleriesError: '無法載入相簿，請稍後再試',
        galleriesLoading: false,
      })
    }
  },
  
  // 搜尋相關動作
  search: async (params: SearchParams) => {
    set({ searchLoading: true, searchError: null })
    try {
      // 實際專案中需串接API
      // const response = await apiClient.get('/search', { params })
      // const { posts, gyms, galleries } = response.data
      
      // 模擬API回應
      setTimeout(() => {
        // 模擬搜尋文章結果
        const mockPostResults: Post[] = Array(3).fill(0).map((_, i) => ({
          id: `search-post-${i + 1}`,
          title: `搜尋結果: ${params.query} - 文章 #${i + 1}`,
          slug: `search-result-${params.query}-post-${i + 1}`,
          content: `包含關鍵字 "${params.query}" 的文章內容...`,
          summary: `這是一篇關於 "${params.query}" 的文章摘要...`,
          coverImage: `/images/post-${(i % 5) + 1}.jpg`,
          createdAt: new Date(Date.now() - i * 86400000),
          authorId: 'user-1',
          tags: ['搜尋結果', params.query],
          likes: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 20),
          views: Math.floor(Math.random() * 1000),
        }))
        
        // 模擬搜尋攀岩館結果
        const mockGymResults: Gym[] = Array(2).fill(0).map((_, i) => ({
          id: `search-gym-${i + 1}`,
          name: `搜尋結果: ${params.query} - 攀岩館 #${i + 1}`,
          slug: `search-result-${params.query}-gym-${i + 1}`,
          description: `包含關鍵字 "${params.query}" 的攀岩館描述...`,
          address: `台北市信義區松高路 ${100 + i} 號`,
          coverImage: `/images/gym-${(i % 5) + 1}.jpg`,
          createdAt: new Date(Date.now() - i * 86400000),
          facilities: ['抱石區', '先鋒攀登', params.query],
          likes: Math.floor(Math.random() * 100),
          reviews: Math.floor(Math.random() * 50),
          rating: 4 + Math.random(),
        }))
        
        // 模擬搜尋相簿結果
        const mockGalleryResults: Gallery[] = Array(2).fill(0).map((_, i) => ({
          id: `search-gallery-${i + 1}`,
          title: `搜尋結果: ${params.query} - 相簿 #${i + 1}`,
          slug: `search-result-${params.query}-gallery-${i + 1}`,
          description: `包含關鍵字 "${params.query}" 的相簿描述...`,
          coverImage: `/images/gallery-cover-${(i % 5) + 1}.jpg`,
          images: Array(6).fill(0).map((_, j) => `/images/gallery-${(i % 5) + 1}-${j + 1}.jpg`),
          createdAt: new Date(Date.now() - i * 86400000),
          authorId: 'user-1',
          likes: Math.floor(Math.random() * 100),
          views: Math.floor(Math.random() * 500),
        }))
        
        // 根據搜尋類型過濾結果
        const filteredPosts = params.type === 'all' || params.type === 'post' ? mockPostResults : []
        const filteredGyms = params.type === 'all' || params.type === 'gym' ? mockGymResults : []
        const filteredGalleries = params.type === 'all' || params.type === 'gallery' ? mockGalleryResults : []
        
        set({
          searchResults: {
            posts: filteredPosts,
            gyms: filteredGyms,
            galleries: filteredGalleries,
          },
          searchLoading: false,
        })
      }, 1000)
    } catch (error) {
      set({
        searchError: '搜尋失敗，請稍後再試',
        searchLoading: false,
      })
    }
  },
  
  clearSearch: () => {
    set({
      searchResults: {
        posts: [],
        gyms: [],
        galleries: [],
      },
      searchError: null,
    })
  },
}))
