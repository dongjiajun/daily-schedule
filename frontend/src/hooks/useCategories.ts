import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listCategories, createCategory, updateCategory, deleteCategory } from '../api/sdk.gen'
import type { CategoryCreateRequest, CategoryResponse } from '../api/types.gen'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const resp = await listCategories()
      return resp.data ?? []
    },
    staleTime: 60_000,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CategoryCreateRequest): Promise<CategoryResponse | undefined> => {
      const r = await createCategory({ body: data })
      return r.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      { id, data }: { id: number; data: CategoryCreateRequest }
    ): Promise<CategoryResponse | undefined> => {
      const r = await updateCategory({ path: { id }, body: data })
      return r.data
    },
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
