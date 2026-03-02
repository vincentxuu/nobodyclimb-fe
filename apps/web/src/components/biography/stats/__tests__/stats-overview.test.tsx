import { render, screen } from '@testing-library/react'
import { StatsOverview } from '../stats-overview'
import type { BiographyStats } from '@/lib/types'

const mockStats: BiographyStats = {
  total_views: 1234,
  total_likes: 56,
  follower_count: 78,
  following_count: 12,
  bucket_list: {
    total: 10,
    active: 5,
    completed: 3,
  },
  stories: {
    total: 8,
    core_completed: 3,
    advanced_completed: 5,
  },
  locations_count: 15,
}

describe('StatsOverview', () => {
  it('renders stat cards with correct values', () => {
    render(<StatsOverview stats={mockStats} />)

    // Check that stat values are rendered (using getAllByText since some values may appear multiple times)
    expect(screen.getAllByText('1234').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('56').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('78').length).toBeGreaterThanOrEqual(1)
  })

  it('renders stat labels', () => {
    render(<StatsOverview stats={mockStats} />)

    // Using getAllByText since some labels may appear multiple times
    expect(screen.getAllByText('瀏覽次數').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('收到的讚').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('追蹤者').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('完成目標').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('已分享故事').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('攀岩足跡').length).toBeGreaterThanOrEqual(1)
  })

  it('renders story completion section', () => {
    render(<StatsOverview stats={mockStats} />)

    expect(screen.getByText('故事完成度')).toBeInTheDocument()
    expect(screen.getByText('核心故事')).toBeInTheDocument()
    expect(screen.getByText('進階故事')).toBeInTheDocument()
  })

  it('renders goal completion section', () => {
    render(<StatsOverview stats={mockStats} />)

    expect(screen.getByText('目標達成率')).toBeInTheDocument()
    expect(screen.getByText('已完成')).toBeInTheDocument()
    expect(screen.getByText('進行中')).toBeInTheDocument()
    expect(screen.getByText('總計')).toBeInTheDocument()
  })

  it('renders social interaction section', () => {
    render(<StatsOverview stats={mockStats} />)

    expect(screen.getByText('社群互動')).toBeInTheDocument()
    expect(screen.getByText('追蹤中')).toBeInTheDocument()
  })

  it('handles zero values correctly', () => {
    const zeroStats: BiographyStats = {
      ...mockStats,
      total_views: 0,
      total_likes: 0,
      follower_count: 0,
      following_count: 0,
      bucket_list: {
        total: 0,
        active: 0,
        completed: 0,
      },
      stories: {
        total: 0,
        core_completed: 0,
        advanced_completed: 0,
      },
      locations_count: 0,
    }

    render(<StatsOverview stats={zeroStats} />)

    // Should render without crashing
    expect(screen.getByText('故事完成度')).toBeInTheDocument()
    expect(screen.getByText('目標達成率')).toBeInTheDocument()
  })
})
