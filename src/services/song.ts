import { SupabaseClient } from "@supabase/supabase-js"
import { ISipapu } from ".."

export enum SongEnum {
  SPOTIFY = 'spotify',
  YOUTUBE = 'youtube'
}

export type SongType = {
  id: number,
  createdAt: Date,
  playCount: number,
  addedBy: string,
  songType: SongEnum,
  platformId: string,
  playlistId: number,
  title: string,
  artist?: string,
  cover?: string,
  length?: number,
  album?: string
}

export default class Song {
  private client: SupabaseClient
  private sipapu: ISipapu
  
  constructor(client: SupabaseClient, sipapu: ISipapu) {
    this.client = client
    this.sipapu = sipapu
  }

  /**
   * Get all songs from a given playlist
   * @param playlistId 
   * @returns 
   */
  async getAllFromPlaylist(playlistId: string): Promise<SongType[]> {
    const { data, error } = await this.client
      .from('song')
      .select()
      .match({ playlist: playlistId })

    if (error !== null) {
      throw error
    }

    if (data === null) {
      throw new Error('Playlist not found')
    }

    if (data.length === 0) {
      return []
    }

    const songs: SongType[] = []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.forEach((song: any) => {
      songs.push({
        id: song.id,
        createdAt: new Date(song.created_at),
        playCount: song.play_count,
        addedBy: song.added_by,
        songType: song.song_type,
        platformId: song.platform_id,
        playlistId: song.playlist,
        title: song.title,
        artist: song.artist,
        cover: song.cover,
        length: song.length,
        album: song.album
      })
    })

    return songs
  }
}