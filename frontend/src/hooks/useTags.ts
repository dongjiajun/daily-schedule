import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { listTags, createTag, deleteTag } from '../api/sdk.gen'
import type { TagCreateRequest, TagResponse } from '../api/types.gen'

export function useTags() {
  return useQuery<TagResponse[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const resp = await listTags()
      return (resp.data ?? []) as TagResponse[]
    },
    staleTime: 60_000,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation<TagResponse | undefined, Error, TagCreateRequest>({
    mutationFn: async (data) => {
      const r = await createTag({ body: data })
      return r.data as TagResponse | undefined
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('标签创建成功')
    },
    onError: (err) => toast.error(`创建标签失败: ${err.message}`),
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => { await deleteTag({ path: { id } }) },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('标签已删除')
    },
    onError: (err) => toast.error(`删除标签失败: ${err.message}`),
  })
}
