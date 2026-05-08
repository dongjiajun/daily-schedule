import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listCategories, createCategory, updateCategory, deleteCategory } from '../api/sdk.gen'
import type { CategoryCreateRequest } from '../api/types.gen'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const resp = await listCategories({ path: {} })
      return resp.data?.data ?? []
    },
    staleTime: 60_000,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CategoryCreateRequest) =>
      createCategory({ path: {}, body: data }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryCreateRequest }) =>
      updateCategory({ path: { id }, body: data }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCategory({ path: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}
