import { SupabaseClient } from '@supabase/supabase-js'
import { Sipapu } from '..'
import { EventTypes } from '../events'

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
  private sipapu: Sipapu
  
  constructor(client: SupabaseClient, sipapu: Sipapu) {
    this.client = client
    this.sipapu = sipapu
  }

  /**
   * Get a song by its id
   * @param songId The song id to query
   * @returns {@link SongType} The song
   * @throws {@link Error} If the song doesn't exist or the user doesn't have access to it
   */
  async get(songId: number): Promise<SongType> {
    const { data, error } = await this.client
      .from('song')
      .select()
      .match({ id: songId })

    if (error !== null) {
      throw error
    }

    if (data === null || data.length === 0) {
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
   * Check if a song exists in a playlist
   */
  async alreadyContains(platformId: string, playlistId: number): Promise<boolean> {
    const { data, error } = await this.client
      .from('song')
      .select()
      .match({ platform_id: platformId, playlist: playlistId })

    if (error) {
      return false
    }
    
    if (data === null) {
      return false
    }

    return data.length > 0
  }

  /**
   * Create a youtube song in the database
   * @param song {@link YoutubeSongCreateType} The youtube song to create
   * @param sessionId The current session of the user, this is used to notify other clients
   * @throws {@link PostgrestError} If some weird supabase error happens
   * @throws {@link Error} If the song already exists
   */
  async createYoutube(song: YoutubeSongCreateType, sessionId: string): Promise<void> {
    try {
      await this.sipapu.Playlist.addUser(song.playlistId, song.addedBy, sessionId)
    } catch (error) {
      throw error
    }

    const contains = await this.alreadyContains(song.platformId, song.playlistId)

    if (contains) throw new Error('Song already exists')

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

    await this.sipapu.Session.notifyEvent(sessionId, EventTypes.YOUTUBE_SONG_ADDED, { error: false, song })
  }

  /**
   * Create a spotify song in the database
   * @param song {@link SpotifySongCreateType} The spotify song to create
   * @throws {@link PostgrestError} If some weird supabase error happens
   * @throws {@link Error} If the song already exists
   */
  async createSpotify(song: SpotifySongCreateType, sessionId: string): Promise<void> {
    try {
      await this.sipapu.Playlist.addUser(song.playlistId, song.addedBy, sessionId)
    } catch (error) {
      throw error
    }

    if (await this.alreadyContains(song.platformId, song.playlistId)) {
      throw new Error('Song already exists')
    }

    const { error } = await this.client
      .from('song')
      .insert({
        play_count: 0,
        added_by: song.addedBy,
        song_type: SongEnum.SPOTIFY,
        platform_id: song.platformId,
        playlist: song.playlistId,
        title: song.title,
        artist: song.artist,
        cover: song.cover,
        length: song.length,
        album: song.album
      })

    if (error !== null) {
      throw error
    }

    await this.sipapu.Session.notifyEvent(sessionId, EventTypes.SPOTIFY_SONG_ADDED, { error: false, song })
  }


  /**
   * Deletes a given song
   * @param songId The song to delete
   * @throws {@link Error} If the song doesn't exist or the user doesn't have access to it
   */
  async delete(songId: number, sessionId: string): Promise<void> {
    const { error } = await this.client
      .from('song')
      .delete()
      .match({ id: songId })

    if (error !== null) {
      throw error
    }

    await this.sipapu.Session.notifyEvent(sessionId, EventTypes.SONG_REMOVED, { error: false, songId })
  }

  /**
   * Get all songs from a given playlist
   * @param playlistId 
   * @returns 
   */
  async getAllFromPlaylist(playlistId: number): Promise<SongType[]> {
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

  /**
   * Resets a song's play count to 0
   * @param songId The songid to update
   * @param playlistId The playlist id where the song is
   * @throws {@link Error} If the song doesn't exist or the user doesn't have access to it
   */
  async resetSong(songId: number, playlistId: number): Promise<void> {
    const { error } = await this.client
      .from('song')
      .update({
        play_count: 0
      })
      .match({ id: songId, playlist: playlistId })

    if (error !== null) {
      throw error
    }
  }
  
  /**
   * Get the current playCount for a song
   * @param songId The song to query
   * @returns number The playCount
   * @throws {@link Error} If the song doesn't exist or the user doesn't have access to it
   */
  async getPlays(songId: number): Promise<number> {
    const { data, error } = await this.client
      .from('song')
      .select()
      .match({ id: songId })

    if (error !== null) {
      throw error
    }

    if (data === null || data.length === 0) {
      throw new Error('Song not found')
    }

    return data[0].play_count
  }

  /**
   * Increment the playCount for a song
   *
   * @param songId The song to increment
   * @throws {@link Error} If the song doesn't exist or the user doesn't have access to it
   */
  async incrmentPlayCount(songId: number): Promise<void> {
    const { error } = await this.client
      .rpc('increment_play_count', { song_id: songId })

    if (error !== null) {
      throw error
    }
  }
}