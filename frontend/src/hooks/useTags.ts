import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { listTags, createTag, deleteTag } from '../api/sdk.gen'
import type { TagCreateRequest, TagResponse } from '../api/types.gen'

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const resp = await listTags()
      return resp.data ?? []
    },
    staleTime: 60_000,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: TagCreateRequest): Promise<TagResponse | undefined> => {
      const r = await createTag({ body: data })
      return r.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteTag({ path: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('标签已删除')
    },
    onError: (err: Error) => {
      toast.error(`删除标签失败: ${err.message}`)
    },
  })
}
