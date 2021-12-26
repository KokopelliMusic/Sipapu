import { SupabaseClient } from "@supabase/supabase-js";

export type PlaylistType = {
  id: number
  createdAt: Date
  name: string
  user: string
}

export default class Playlist {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async get(playlistId: string): Promise<PlaylistType> {
    const { data, error } = await this.client
      .from('playlist')
      .select()
      .match({ id: playlistId })

    if (error !== null) {
      throw error
    }

    if (data === null) {
      throw new Error('Playlist not found')
    }

    return {
      id: data[0].id,
      createdAt: new Date(data[0].created_at),
      name: data[0].name,
      user: data[0].user,
    }
  }

  async getAllFromUser(): Promise<PlaylistType[]> {
    const uid = this.client.auth.user()?.id

    if (!uid) {
      throw new Error('User not found')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error }: { data: any[] | null, error: any } = await this.client
      .from('playlist')
      .select()
      .match({ user: uid })

    if (error !== null) {
      throw error
    }

    if (data === null) {
      throw new Error('Found no playlists, query is null')
    }

    if (data.length === 0) {
      return []
    }

    const playlists: PlaylistType[] = []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.forEach((playlist: any) => {
      playlists.push({
        id: playlist.id,
        createdAt: new Date(playlist.created_at),
        name: playlist.name,
        user: playlist.user,
      })
    })

    return playlists
    
  }
}