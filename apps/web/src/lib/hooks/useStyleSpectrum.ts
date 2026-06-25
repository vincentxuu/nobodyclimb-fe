import { useQuery } from '@tanstack/react-query'
import { evolutionApi } from '@/lib/api/evolution'

export function useStyleSpectrum(enabled = true) {
  return useQuery({
    queryKey: ['quiz', 'evolution', 'style-spectrum'],
    queryFn: async () => {
      const { data } = await evolutionApi.getStyleSpectrum()
      return data.data
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
