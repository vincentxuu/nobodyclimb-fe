import { render } from '@testing-library/react-native'
import { BadgeShowcase } from '../badge-showcase'
import { BarChart, CircularProgress, ProgressBar, StatCard } from '../progress-chart'

describe('CircularProgress', () => {
  it('renders percentage text', () => {
    const { getByText } = render(<CircularProgress value={75} />)
    expect(getByText('75%')).toBeTruthy()
  })
  it('renders all size variants without crashing', () => {
    ;(['sm', 'md', 'lg', 'xl'] as const).forEach((size) => {
      expect(() => render(<CircularProgress value={50} size={size} />)).not.toThrow()
    })
  })
})

describe('ProgressBar', () => {
  it('renders label and value', () => {
    const { getByText } = render(<ProgressBar label="完攀率" value={60} maxValue={100} />)
    expect(getByText('完攀率')).toBeTruthy()
  })
})

describe('BarChart', () => {
  it('renders bar labels', () => {
    const data = [
      { label: '1月', value: 5 },
      { label: '2月', value: 12 },
    ]
    const { getByText } = render(<BarChart data={data} />)
    expect(getByText('1月')).toBeTruthy()
    expect(getByText('2月')).toBeTruthy()
  })
  it('handles empty data without crashing', () => {
    expect(() => render(<BarChart data={[]} />)).not.toThrow()
  })
})

describe('StatCard', () => {
  it('renders title and value', () => {
    const { getByText } = render(<StatCard title="總完攀" value={42} />)
    expect(getByText('總完攀')).toBeTruthy()
    expect(getByText('42')).toBeTruthy()
  })
  it('renders subtitle when provided', () => {
    const { getByText } = render(<StatCard title="總完攀" value={42} subtitle="本月 +5" />)
    expect(getByText('本月 +5')).toBeTruthy()
  })
})

describe('BadgeShowcase', () => {
  const MOCK_BADGES = [
    {
      id: '1',
      name: '初登頂',
      category: 'achievement',
      description: '首次完攀',
      earned_at: '2024-01-01',
    },
  ]
  it('renders badge names', () => {
    const { getByText } = render(<BadgeShowcase badges={MOCK_BADGES} />)
    expect(getByText('初登頂')).toBeTruthy()
  })
  it('shows empty state when no badges', () => {
    const { getByText } = render(<BadgeShowcase badges={[]} />)
    expect(getByText('尚無徽章')).toBeTruthy()
  })
})
