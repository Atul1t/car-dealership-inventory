/** Shapes returned by / sent to the backend API. Mirrors app/schemas on the server. */

export type Role = 'user' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  role: Role
}

export interface TokenResponse {
  access_token: string
  token_type: 'bearer'
  user: User
}

export interface Vehicle {
  id: number
  make: string
  model: string
  category: string
  price: number
  quantity: number
}

export type VehicleInput = Omit<Vehicle, 'id'>

export interface VehicleSearchCriteria {
  make?: string
  model?: string
  category?: string
  min_price?: number
  max_price?: number
}
