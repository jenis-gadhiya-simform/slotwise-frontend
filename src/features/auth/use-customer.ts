import { useSuspenseQuery } from '@tanstack/react-query'
import type { CustomerViewer } from '@/lib/types'
import { meQueryOptions } from './api'

/** The signed-in customer, live from the `/me` cache. Only under `/account`, whose guard guarantees it. */
export function useCustomer(): CustomerViewer {
  return useSuspenseQuery(meQueryOptions()).data as CustomerViewer
}
