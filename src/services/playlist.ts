import { SupabaseClient } from "@supabase/supabase-js";
import { ISipapu } from "..";
import { SongType } from "./song";

export type PlaylistType = {
  id: number
  createdAt: Date
  name: string
  user: string
}

export type PlaylistWithSongsType = PlaylistType & {
  songs: SongType[]
}

export default class Playlist {
  private client: SupabaseClient;
  private sipapu: ISipapu;

  constructor(client: SupabaseClient, sipapu: ISipapu) {
    this.client = client
    this.sipapu = sipapu
  }

  /**
   * Get a playlist by its id.
   * @param playlistId 
   * @returns 
   */
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

  /**
   * Get a playlist with all songs that are in this playlist
   * @param playlistId The playlist id to query
   * @returns {@link PlaylistWithSongsType} The playlist with all songs
   * @throws {@link Error} If the playlist doesn't exist or the user doesn't have access to it
   */
  async getWithSongs(playlistId: string): Promise<PlaylistWithSongsType> {
    try {
      const playlist = await this.get(playlistId)
      const songs = await this.sipapu.Song.getAllFromPlaylist(playlistId)
      return {
        ...playlist,
        songs,
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all playlists from the current authenticated user.
   * NOTE: this only works when the class is not anonymous.
   * @returns {@link PlaylistType[]} The playlists that the user has access to
   */
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