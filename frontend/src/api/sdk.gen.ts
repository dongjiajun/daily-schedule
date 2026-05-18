import { client } from './client.gen'
import type {
  ListEventsData,
  CreateEventData,
  GetEventByIdData,
  UpdateEventData,
  DeleteEventData,
  CreateCategoryData,
  UpdateCategoryData,
  DeleteCategoryData,
  CreateTagData,
  UpdateTagData,
  DeleteTagData,
} from './types.gen'

export const listEvents = (options: { query: ListEventsData['query'] }) =>
  client.get({ url: '/events', query: options.query })

export const createEvent = (options: { body: CreateEventData['body'] }) =>
  client.post({ url: '/events', body: options.body, headers: { 'Content-Type': 'application/json' } })

export const getEventById = (options: { path: GetEventByIdData['path'] }) =>
  client.get({ url: '/events/{id}', path: options.path })

export const updateEvent = (options: { path: UpdateEventData['path']; body: UpdateEventData['body'] }) =>
  client.put({ url: '/events/{id}', path: options.path, body: options.body, headers: { 'Content-Type': 'application/json' } })

export const deleteEvent = (options: { path: DeleteEventData['path'] }) =>
  client.delete({ url: '/events/{id}', path: options.path })

export const listCategories = () =>
  client.get({ url: '/categories' })

export const createCategory = (options: { body: CreateCategoryData['body'] }) =>
  client.post({ url: '/categories', body: options.body, headers: { 'Content-Type': 'application/json' } })

export const updateCategory = (options: { path: UpdateCategoryData['path']; body: UpdateCategoryData['body'] }) =>
  client.put({ url: '/categories/{id}', path: options.path, body: options.body, headers: { 'Content-Type': 'application/json' } })

export const deleteCategory = (options: { path: DeleteCategoryData['path'] }) =>
  client.delete({ url: '/categories/{id}', path: options.path })

export const listTags = () =>
  client.get({ url: '/tags' })

export const createTag = (options: { body: CreateTagData['body'] }) =>
  client.post({ url: '/tags', body: options.body, headers: { 'Content-Type': 'application/json' } })

export const updateTag = (options: { path: UpdateTagData['path']; body: UpdateTagData['body'] }) =>
  client.put({ url: '/tags/{id}', path: options.path, body: options.body, headers: { 'Content-Type': 'application/json' } })

export const deleteTag = (options: { path: DeleteTagData['path'] }) =>
  client.delete({ url: '/tags/{id}', path: options.path })
