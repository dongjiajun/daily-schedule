import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { listTags, createTag, updateTag, deleteTag } from '../api/sdk.gen'
import { unwrap } from '../lib/unwrap'
import type { TagCreateRequest, TagResponse } from '../api/types.gen'

export function useTags() {
  return useQuery<TagResponse[]>({
    queryKey: ['tags'],
    queryFn: async () => unwrap(await listTags()) ?? [],
    staleTime: 60_000,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation<TagResponse, Error, TagCreateRequest>({
    mutationFn: async (data) => unwrap(await createTag({ body: data })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('标签创建成功')
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  return useMutation<TagResponse, Error, { id: number; data: TagCreateRequest }>({
    mutationFn: async ({ id, data }) => unwrap(await updateTag({ path: { id }, body: data })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('标签已更新')
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => { unwrap(await deleteTag({ path: { id } })) },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('标签已删除')
    },
    onError: (err) => toast.error(err.message),
  })
}
