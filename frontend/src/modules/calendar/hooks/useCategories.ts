import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { listCategories, createCategory, updateCategory, deleteCategory } from '@/api/sdk.gen'
import { unwrap } from '@/core/lib/unwrap'
import type { CategoryCreateRequest, CategoryResponse } from '@/api/types.gen'

export function useCategories() {
  return useQuery<CategoryResponse[]>({
    queryKey: ['categories'],
    queryFn: async () => unwrap(await listCategories()) ?? [],
    staleTime: 60_000,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation<CategoryResponse, Error, CategoryCreateRequest>({
    mutationFn: async (data) => unwrap(await createCategory({ body: data })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('分类创建成功')
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation<CategoryResponse, Error, { id: number; data: CategoryCreateRequest }>({
    mutationFn: async ({ id, data }) => unwrap(await updateCategory({ path: { id }, body: data })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('分类已更新')
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => { unwrap(await deleteCategory({ path: { id } })) },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('分类已删除')
    },
    onError: (err) => toast.error(err.message),
  })
}
