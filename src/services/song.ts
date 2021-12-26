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

export type SongCreateType = {
  title: string,
  platformId: string,
  addedBy: string,
  playlistId: number,  
}

export type YoutubeSongCreateType = SongCreateType & {
  songType: SongEnum.YOUTUBE
}

export type SpotifySongCreateType = SongCreateType & {
  songType: SongEnum.SPOTIFY,
  artist: string,
  cover: string,
  length: number,
  album: string
}

export default class Song {
  private client: SupabaseClient
  private sipapu: ISipapu
  
  constructor(client: SupabaseClient, sipapu: ISipapu) {
    this.client = client
    this.sipapu = sipapu
  }

  /**
   * Get a song by its id
   * @param songId The song id to query
   * @returns {@link SongType} The song
   * @throws {@link Error} If the song doesn't exist or the user doesn't have access to it
   */
  async get(songId: string): Promise<SongType> {
    const { data, error } = await this.client
      .from('song')
      .select()
      .match({ id: songId })

    if (error !== null) {
      throw error
    }

    if (data === null) {
      throw new Error('Song not found')
    }

    return {
      id: data[0].id,
      createdAt: new Date(data[0].created_at),
      playCount: data[0].play_count,
      addedBy: data[0].added_by,
      songType: data[0].song_type,
      platformId: data[0].platform_id,
      playlistId: data[0].playlist,
      title: data[0].title,
      artist: data[0].artist,
      cover: data[0].cover,
      length: data[0].length,
      album: data[0].album
    }
  }

  /**
   * Create a youtube song in the database
   * @param song {@link YoutubeSongCreateType} The youtube song to create
   * @throws {@link PostgrestError} If the song already exists
   */
  async createYoutube(song: YoutubeSongCreateType): Promise<void> {
    const { error } = await this.client
      .from('song')
      .insert({
        play_count: 0,
        added_by: song.addedBy,
        song_type: SongEnum.YOUTUBE,
        platform_id: song.platformId,
        playlist: song.playlistId,
        title: song.title,
      })

      if (error !== null) {
        throw error
      }
  }

  /**
   * Deletes a given song
   * @param songId The song to delete
   * @throws {@link Error} If the song doesn't exist or the user doesn't have access to it
   */
  async delete(songId: string): Promise<void> {
    const { error } = await this.client
      .from('song')
      .delete()
      .match({ id: songId })

    if (error !== null) {
      throw error
    }
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