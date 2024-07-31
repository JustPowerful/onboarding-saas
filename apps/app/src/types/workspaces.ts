import type { User } from './users'

export type Client = {
  id: string
  name: string
  email: string
  phone: string
  assignments: ClientAssignment[]
  create_at: Date
  updated_at: Date
}

export type Workspace = {
  id: string
  title: string
  clients: Client[]
  owner_id: string
  created_at: Date
  updated_at: Date
}

export type ClientAssignment = {
  id: string
  pipeline_id: string
  pipline: Pipeline
  client_id: string
  client: Client
  // TODO: add tasks later
}

export type Checklist = {
  id: string
  title: string
  default: boolean
  ownerId: string
  workspace_id: string
  pos: number
  client_assignments: ClientAssignment[]
  // TODO: add allowed users
}

export type Pipeline = {
  id: string
  title: string
}

export type Member = {
  id: string
  user: User
  permission: 'EDIT' | 'VIEW'
}
