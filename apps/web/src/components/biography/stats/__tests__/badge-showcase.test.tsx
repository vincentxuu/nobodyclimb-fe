import { render, screen, fireEvent } from '@testing-library/react'
import { BadgeShowcase, CompactBadgeDisplay } from '../badge-showcase'
import type { BadgeProgress } from '@/lib/types'

const mockBadgeProgress: BadgeProgress[] = [
  {
    badge_id: 'story_beginner',
    unlocked: true,
    progress: 100,
    current_value: 1,
    target_value: 1,
    unlocked_at: '2024-01-01T00:00:00Z',
  },
  {
    badge_id: 'achiever',
    unlocked: true,
    progress: 100,
    current_value: 1,
    target_value: 1,
    unlocked_at: '2024-01-02T00:00:00Z',
  },
  {
    badge_id: 'supportive',
    unlocked: false,
    progress: 50,
    current_value: 25,
    target_value: 50,
    unlocked_at: null,
  },
  {
    badge_id: 'traveler',
    unlocked: false,
    progress: 20,
    current_value: 1,
    target_value: 5,
    unlocked_at: null,
  },
]

describe('BadgeShowcase', () => {
  it('renders badge showcase header', () => {
    render(<BadgeShowcase badgeProgress={mockBadgeProgress} />)

    expect(screen.getByText('徽章收藏')).toBeInTheDocument()
  })

  it('displays unlocked badge count', () => {
    render(<BadgeShowcase badgeProgress={mockBadgeProgress} />)

    // Check that unlocked count is displayed (format: 已解鎖 X/Y 個徽章)
    expect(screen.getByText(/已解鎖/)).toBeInTheDocument()
    expect(screen.getByText(/個徽章/)).toBeInTheDocument()
  })

  it('renders category filter buttons', () => {
    render(<BadgeShowcase badgeProgress={mockBadgeProgress} />)

    expect(screen.getByText('全部')).toBeInTheDocument()
    expect(screen.getByText('故事分享')).toBeInTheDocument()
    expect(screen.getByText('目標追蹤')).toBeInTheDocument()
    expect(screen.getByText('社群互動')).toBeInTheDocument()
    expect(screen.getByText('攀岩足跡')).toBeInTheDocument()
  })

  it('allows filtering by category', () => {
    render(<BadgeShowcase badgeProgress={mockBadgeProgress} />)

    const storyButton = screen.getByText('故事分享')
    fireEvent.click(storyButton)

    // Button should be active (has different background)
    expect(storyButton).toHaveClass('bg-gray-900')
  })

  it('shows "即將解鎖" section when there are badges near completion', () => {
    render(<BadgeShowcase badgeProgress={mockBadgeProgress} />)

    expect(screen.getByText('即將解鎖')).toBeInTheDocument()
  })

  it('handles empty badge progress', () => {
    render(<BadgeShowcase badgeProgress={[]} />)

    expect(screen.getByText('徽章收藏')).toBeInTheDocument()
    // Check that unlocked count is displayed
    expect(screen.getByText(/已解鎖/)).toBeInTheDocument()
  })
})

describe('CompactBadgeDisplay', () => {
  it('renders unlocked badges', () => {
    render(<CompactBadgeDisplay badgeProgress={mockBadgeProgress} />)

    // Should render without crashing
    expect(document.querySelector('.flex')).toBeInTheDocument()
  })

  it('shows message when no badges unlocked', () => {
    const noBadges: BadgeProgress[] = [
      {
        badge_id: 'story_beginner',
        unlocked: false,
        progress: 0,
        current_value: 0,
        target_value: 1,
        unlocked_at: null,
      },
    ]

    render(<CompactBadgeDisplay badgeProgress={noBadges} />)

    expect(screen.getByText('尚未解鎖任何徽章')).toBeInTheDocument()
  })

  it('respects maxDisplay prop', () => {
    const manyBadges: BadgeProgress[] = Array(10)
      .fill(null)
      .map((_, index) => ({
        badge_id: `badge_${index}`,
        unlocked: true,
        progress: 100,
        current_value: 1,
        target_value: 1,
        unlocked_at: '2024-01-01T00:00:00Z',
      }))

    render(<CompactBadgeDisplay badgeProgress={manyBadges} maxDisplay={3} />)

    // Should show +7 indicator
    expect(screen.getByText('+7')).toBeInTheDocument()
  })
})
