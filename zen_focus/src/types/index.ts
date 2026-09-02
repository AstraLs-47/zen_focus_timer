export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      focus_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          planned_duration: number
          actual_duration: number | null
          break_duration: number
          started_at: string
          ended_at: string | null
          status: 'active' | 'paused' | 'completed' | 'ended_early'
          background: string
          paused_duration: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          planned_duration: number
          actual_duration?: number | null
          break_duration?: number
          started_at: string
          ended_at?: string | null
          status?: 'active' | 'paused' | 'completed' | 'ended_early'
          background?: string
          paused_duration?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          planned_duration?: number
          actual_duration?: number | null
          break_duration?: number
          started_at?: string
          ended_at?: string | null
          status?: 'active' | 'paused' | 'completed' | 'ended_early'
          background?: string
          paused_duration?: number
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type FocusSession = Database['public']['Tables']['focus_sessions']['Row']

export type SessionStatus = FocusSession['status']

export interface Background {
  id: string
  name: string
  mood: string
  file: string
  isColorTheme?: boolean
}

export const BACKGROUNDS: Background[] = [
  { id: 'forest', name: 'Forest Theme',    mood: 'Minimal Calm', file: '', isColorTheme: true },
  { id: 'bg10',   name: 'Enchanted Forest', mood: 'Mystic',       file: '/backgrounds/bg10.jpeg' },
  { id: 'bg1',    name: 'Night Park',       mood: 'Cozy',         file: '/backgrounds/bg1.jpeg' },
  { id: 'bg2',    name: 'Moonlit Lake',     mood: 'Dreamy',       file: '/backgrounds/bg2.jpeg' },
  { id: 'bg3',    name: 'Starry Mountains', mood: 'Epic',         file: '/backgrounds/bg3.jpeg' },
  { id: 'bg4',    name: 'Milky Way',        mood: 'Cosmic',       file: '/backgrounds/bg4.jpeg' },
  { id: 'bg5',    name: 'Lake Sunset',      mood: 'Warm',         file: '/backgrounds/bg5.jpeg' },
  { id: 'bg6',    name: 'Lone Tree',        mood: 'Serene',       file: '/backgrounds/bg6.jpeg' },
  { id: 'bg7',    name: 'Autumn Park',      mood: 'Golden',       file: '/backgrounds/bg7.jpeg' },
  { id: 'bg8',    name: 'Autumn Forest',    mood: 'Rich',         file: '/backgrounds/bg8.jpeg' },
  { id: 'bg9',    name: 'Green Park',       mood: 'Fresh',        file: '/backgrounds/bg9.jpeg' },
  { id: 'bg11',   name: 'Rainy Cabin',      mood: 'Stormy',       file: '/backgrounds/bg11.jpeg' },
  { id: 'bg12',   name: 'Cozy Rain Room',   mood: 'Intimate',     file: '/backgrounds/bg12.jpeg' },
  { id: 'bg13',   name: 'City Rain Night',  mood: 'Urban',        file: '/backgrounds/bg13.jpeg' },
  { id: 'bg14',   name: 'Forest Cabin',     mood: 'Rustic',       file: '/backgrounds/bg14.jpeg' },
  { id: 'bg15',   name: 'Golden Moon',      mood: 'Dusk',         file: '/backgrounds/bg15.jpeg' },
  { id: 'bg16',   name: 'Night Field',      mood: 'Open',         file: '/backgrounds/bg16.jpeg' },
  { id: 'bg17',   name: 'Azure Mist',       mood: 'Calm',         file: '/backgrounds/bg17.jpeg' },
  { id: 'bg18',   name: 'Sunlit Shadow',    mood: 'Warmth',       file: '/backgrounds/bg18.jpeg' },
  { id: 'bg19',   name: 'Dried Blossom',    mood: 'Gentle',       file: '/backgrounds/bg19.jpeg' },
  { id: 'bg20',   name: 'Sage Canvas',      mood: 'Minimal',      file: '/backgrounds/bg20.jpeg' },
  { id: 'bg21',   name: 'Warm Terracotta',  mood: 'Earthy',       file: '/backgrounds/bg21.jpeg' },
]

export function getBackground(id: string): Background {
  return BACKGROUNDS.find(b => b.id === id) ?? BACKGROUNDS[0]
}
