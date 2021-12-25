import { SupabaseClient } from "@supabase/supabase-js";

export type PlaylistType = {
  id: number
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
    }
  }
}