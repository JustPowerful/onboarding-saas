export type Client = {
  id: string
  name: string
  email: string
  phone: string
}

export type Workspace = {
  id: string
  title: string
  clients: Client[]
  owner_id: string
  created_at: Date
  updated_at: Date
}
