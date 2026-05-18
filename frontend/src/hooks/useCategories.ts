import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { listCategories, createCategory, updateCategory, deleteCategory } from '../api/sdk.gen'
import type { CategoryCreateRequest, CategoryResponse } from '../api/types.gen'

export function useCategories() {
  return useQuery<CategoryResponse[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const resp = await listCategories()
      return (resp.data ?? []) as CategoryResponse[]
    },
    staleTime: 60_000,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation<CategoryResponse | undefined, Error, CategoryCreateRequest>({
    mutationFn: async (data) => {
      const r = await createCategory({ body: data })
      return r.data as CategoryResponse | undefined
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('分类创建成功')
    },
    onError: (err) => toast.error(`创建分类失败: ${err.message}`),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation<CategoryResponse | undefined, Error, { id: number; data: CategoryCreateRequest }>({
    mutationFn: async ({ id, data }) => {
      const r = await updateCategory({ path: { id }, body: data })
      return r.data as CategoryResponse | undefined
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('分类已更新')
    },
    onError: (err) => toast.error(`更新分类失败: ${err.message}`),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => { await deleteCategory({ path: { id } }) },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('分类已删除')
    },
    onError: (err) => toast.error(`删除分类失败: ${err.message}`),
  })
}
