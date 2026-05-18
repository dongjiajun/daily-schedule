// ---- Event ----
export interface EventCreateRequest {
  title: string
  description?: string
  startTime: string
  endTime: string
  allDay?: boolean
  location?: string
  color?: string
  reminderMinutes?: number
  categoryId?: number
  tagIds?: number[]
}

export interface EventUpdateRequest extends EventCreateRequest {}

export interface TagResponse {
  id?: number
  name?: string
  color?: string
}

export interface EventResponse {
  id?: number
  title?: string
  description?: string
  startTime?: string
  endTime?: string
  allDay?: boolean
  location?: string
  color?: string
  reminderMinutes?: number
  categoryId?: number
  categoryName?: string
  categoryColor?: string
  tags?: TagResponse[]
  createdAt?: string
  updatedAt?: string
}

// ---- Category ----
export interface CategoryCreateRequest {
  name: string
  color?: string
  description?: string
}

export interface CategoryResponse {
  id?: number
  name?: string
  color?: string
  description?: string
}

// ---- Tag ----
export interface TagCreateRequest {
  name: string
  color?: string
}

// ---- Reminder ----
export interface ReminderEvent {
  id: number
  title: string
  startTime: string
  reminderMinutes: number
}

// ---- Error response ----
export interface ApiResponse {
  code?: number
  message?: string
}

// ---- SDK data/response types ----
export interface ListEventsData {
  query: { start: string; end: string; categoryId?: number; keyword?: string; page?: number; size?: number }
}
export type ListEventsResponses = EventResponse[]

export interface CreateEventData { body: EventCreateRequest }
export type CreateEventResponses = EventResponse

export interface GetEventByIdData { path: { id: number } }
export type GetEventByIdResponses = EventResponse

export interface UpdateEventData { path: { id: number }; body: EventUpdateRequest }
export type UpdateEventResponses = EventResponse

export interface DeleteEventData { path: { id: number } }
export type DeleteEventResponses = void

export type ListCategoriesData = Record<string, never>
export type ListCategoriesResponses = CategoryResponse[]

export interface CreateCategoryData { body: CategoryCreateRequest }
export type CreateCategoryResponses = CategoryResponse

export interface UpdateCategoryData { path: { id: number }; body: CategoryCreateRequest }
export type UpdateCategoryResponses = void

export interface DeleteCategoryData { path: { id: number } }
export type DeleteCategoryResponses = void

export type ListTagsData = Record<string, never>
export type ListTagsResponses = TagResponse[]

export interface CreateTagData { body: TagCreateRequest }
export type CreateTagResponses = TagResponse

export interface UpdateTagData { path: { id: number }; body: TagCreateRequest }
export type UpdateTagResponses = void

export interface DeleteTagData { path: { id: number } }
export type DeleteTagResponses = void
