// Event types
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

export interface EventListResponse {
  code?: number
  message?: string
  data?: EventResponse[]
  total?: number
  page?: number
  size?: number
}

// Category types
export interface CategoryCreateRequest {
  name: string
  color?: string
  description?: string
}

export type CategoryCreateRequest = {
    name: string;
    color?: string;
    description?: string;
};

// Tag types
export interface TagCreateRequest {
  name: string
  color?: string
}

export type TagCreateRequest = {
    name: string;
    color?: string;
};

// API response wrapper
export interface ModelApiResponse {
  code?: number
  message?: string
  data?: any
}

/**
 * SSE `reminder` 事件的 data JSON 反序列化结构
 */
export type ReminderEvent = {
    /**
     * 日程 ID
     */
    id?: number;
    /**
     * 日程标题
     */
    title?: string;
    /**
     * 日程开始时间
     */
    startTime?: string;
    /**
     * 提前提醒分钟数
     */
    reminderMinutes?: number;
};

/**
 * 统一错误响应包装
 */
export type ApiResponse = {
    code?: number;
    message?: string;
};

export interface DeleteEventData {
  path: { id: number }
}
export type DeleteEventResponses = void

export type ListEventsErrors = {
    /**
     * 请求参数不合法
     */
    400: ApiResponse;
};

export type ListEventsError = ListEventsErrors[keyof ListEventsErrors];

export type ListEventsResponses = {
    /**
     * 成功
     */
    200: Array<EventResponse>;
};

export interface UpdateEventData {
  path: { id: number }
  body: EventUpdateRequest
}
export type UpdateEventResponses = EventResponse

export type ListCategoriesData = Record<string, never>
export type ListCategoriesResponses = CategoryListResponse

export type CreateEventErrors = {
    /**
     * 请求参数不合法
     */
    400: ApiResponse;
};

export type CreateEventError = CreateEventErrors[keyof CreateEventErrors];

export type CreateEventResponses = {
    /**
     * 创建成功
     */
    201: EventResponse;
};

export interface DeleteCategoryData {
  path: { id: number }
}
export type DeleteCategoryResponses = void

export interface UpdateCategoryData {
  path: { id: number }
  body: CategoryCreateRequest
}
export type UpdateCategoryResponses = void

export type DeleteEventErrors = {
    /**
     * 资源不存在
     */
    404: ApiResponse;
};

export type DeleteEventError = DeleteEventErrors[keyof DeleteEventErrors];

export type DeleteEventResponses = {
    /**
     * 删除成功
     */
    204: void;
};

export interface CreateTagData {
  body: TagCreateRequest
}
export type CreateTagResponses = TagResponse

export interface DeleteTagData {
  path: { id: number }
}
export type DeleteTagResponses = void

export type GetEventByIdErrors = {
    /**
     * 资源不存在
     */
    404: ApiResponse;
};

export type GetEventByIdError = GetEventByIdErrors[keyof GetEventByIdErrors];

export type GetEventByIdResponses = {
    /**
     * 成功
     */
    200: EventResponse;
};

export type GetEventByIdResponse = GetEventByIdResponses[keyof GetEventByIdResponses];

export type UpdateEventData = {
    body: EventUpdateRequest;
    path: {
        id: number;
    };
    query?: never;
    url: '/events/{id}';
};

export type UpdateEventErrors = {
    /**
     * 请求参数不合法
     */
    400: ApiResponse;
    /**
     * 资源不存在
     */
    404: ApiResponse;
};

export type UpdateEventError = UpdateEventErrors[keyof UpdateEventErrors];

export type UpdateEventResponses = {
    /**
     * 更新成功
     */
    200: EventResponse;
};

export type UpdateEventResponse = UpdateEventResponses[keyof UpdateEventResponses];

export type ListCategoriesData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/categories';
};

export type ListCategoriesResponses = {
    /**
     * 成功
     */
    200: Array<CategoryResponse>;
};

export type ListCategoriesResponse = ListCategoriesResponses[keyof ListCategoriesResponses];

export type CreateCategoryData = {
    body: CategoryCreateRequest;
    path?: never;
    query?: never;
    url: '/categories';
};

export type CreateCategoryErrors = {
    /**
     * 请求参数不合法
     */
    400: ApiResponse;
};

export type CreateCategoryError = CreateCategoryErrors[keyof CreateCategoryErrors];

export type CreateCategoryResponses = {
    /**
     * 创建成功
     */
    201: CategoryResponse;
};

export type CreateCategoryResponse = CreateCategoryResponses[keyof CreateCategoryResponses];

export type DeleteCategoryData = {
    body?: never;
    path: {
        id: number;
    };
    query?: never;
    url: '/categories/{id}';
};

export type DeleteCategoryErrors = {
    /**
     * 资源不存在
     */
    404: ApiResponse;
};

export type DeleteCategoryError = DeleteCategoryErrors[keyof DeleteCategoryErrors];

export type DeleteCategoryResponses = {
    /**
     * 删除成功
     */
    204: void;
};

export type DeleteCategoryResponse = DeleteCategoryResponses[keyof DeleteCategoryResponses];

export type UpdateCategoryData = {
    body: CategoryCreateRequest;
    path: {
        id: number;
    };
    query?: never;
    url: '/categories/{id}';
};

export type UpdateCategoryErrors = {
    /**
     * 资源不存在
     */
    404: ApiResponse;
};

export type UpdateCategoryError = UpdateCategoryErrors[keyof UpdateCategoryErrors];

export type UpdateCategoryResponses = {
    /**
     * 更新成功
     */
    200: CategoryResponse;
};

export type UpdateCategoryResponse = UpdateCategoryResponses[keyof UpdateCategoryResponses];

export type ListTagsData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/tags';
};

export type ListTagsResponses = {
    /**
     * 成功
     */
    200: Array<TagResponse>;
};

export type ListTagsResponse = ListTagsResponses[keyof ListTagsResponses];

export type CreateTagData = {
    body: TagCreateRequest;
    path?: never;
    query?: never;
    url: '/tags';
};

export type CreateTagErrors = {
    /**
     * 请求参数不合法
     */
    400: ApiResponse;
};

export type CreateTagError = CreateTagErrors[keyof CreateTagErrors];

export type CreateTagResponses = {
    /**
     * 创建成功
     */
    201: TagResponse;
};

export type CreateTagResponse = CreateTagResponses[keyof CreateTagResponses];

export type DeleteTagData = {
    body?: never;
    path: {
        id: number;
    };
    query?: never;
    url: '/tags/{id}';
};

export type DeleteTagErrors = {
    /**
     * 资源不存在
     */
    404: ApiResponse;
};

export type DeleteTagError = DeleteTagErrors[keyof DeleteTagErrors];

export type DeleteTagResponses = {
    /**
     * 删除成功
     */
    204: void;
};

export type DeleteTagResponse = DeleteTagResponses[keyof DeleteTagResponses];

export type UpdateTagData = {
    body: TagCreateRequest;
    path: {
        id: number;
    };
    query?: never;
    url: '/tags/{id}';
};

export type UpdateTagErrors = {
    /**
     * 资源不存在
     */
    404: ApiResponse;
};

export type UpdateTagError = UpdateTagErrors[keyof UpdateTagErrors];

export type UpdateTagResponses = {
    /**
     * 更新成功
     */
    200: TagResponse;
};

export type UpdateTagResponse = UpdateTagResponses[keyof UpdateTagResponses];

export type SubscribeNotificationsData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/sse/notifications';
};

export type SubscribeNotificationsResponses = {
    /**
     * SSE 事件流；reminder 事件的 data 字段结构见 `ReminderEvent`。
     */
    200: string;
};

export type SubscribeNotificationsResponse = SubscribeNotificationsResponses[keyof SubscribeNotificationsResponses];
