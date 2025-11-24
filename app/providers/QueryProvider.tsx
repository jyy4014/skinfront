'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5분 (기본값 증가)
            gcTime: 10 * 60 * 1000, // 10분
            retry: 1, // 재시도 횟수 감소 (빠른 실패)
            refetchOnWindowFocus: false,
            refetchOnMount: false, // 마운트 시 refetch 방지 (캐시 우선)
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

