import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  })
}
