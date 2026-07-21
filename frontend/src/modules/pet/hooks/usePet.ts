import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getMyPet, createPet, updatePet, interactWithPet, getShopItems, purchaseItem } from '@/api/sdk.gen'
import { unwrap } from '@/core/lib/unwrap'
import type { CreatePetRequest, InteractRequest, PurchaseRequest, UpdatePetRequest } from '@/api/types.gen'

export function useMyPet() {
  return useQuery({
    queryKey: ['pet', 'me'],
    queryFn: async () => unwrap(await getMyPet()),
    retry: (failureCount, error) => {
      // 404 不重试——用户可能还没有宠物
      if (error.message?.includes('404') || error.message?.includes('请先创建宠物')) return false
      return failureCount < 2
    },
    refetchInterval: 30_000, // 30 秒轮询
  })
}

export function useCreatePet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreatePetRequest) => unwrap(await createPet({ body: data })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet', 'me'] })
      toast.success('宠物创建成功！')
    },
    onError: (err: Error) => { toast.error(err.message) },
  })
}

export function useUpdatePet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdatePetRequest) => unwrap(await updatePet({ body: data })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet', 'me'] })
      toast.success('宠物已更新')
    },
    onError: (err: Error) => { toast.error(err.message) },
  })
}

export function useInteract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: InteractRequest) => unwrap(await interactWithPet({ body: data })),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pet', 'me'] })
      const mood = result.moodChange! >= 0 ? `+${result.moodChange}` : `${result.moodChange}`
      const hunger = result.hungerChange! >= 0 ? `+${result.hungerChange}` : `${result.hungerChange}`
      toast.success(`心情 ${mood}  饱腹 ${hunger}  +${result.experienceGain}经验`)
    },
    onError: (err: Error) => { toast.error(err.message) },
  })
}

export function useShopItems() {
  return useQuery({
    queryKey: ['shop', 'items'],
    queryFn: async () => unwrap(await getShopItems()),
    staleTime: 60_000,
  })
}

export function usePurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: PurchaseRequest) => unwrap(await purchaseItem({ body: data })),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pet', 'me'] })
      toast.success(`购买成功！-${result.totalCost} 专注币`)
    },
    onError: (err: Error) => { toast.error(err.message) },
  })
}
