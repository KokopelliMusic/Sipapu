import { SupabaseClient } from '@supabase/supabase-js'
import { Sipapu } from '..'
import { EventTypes } from '../events'
import { EMPTY_EVENT_DATA } from './session'
import { SongType } from './song'

export type PlaylistType = {
  id: number
  createdAt: Date
  name: string
  user: string
  users: string[]
}

export type PlaylistWithSongsType = PlaylistType & {
  songs: SongType[]
}

export const MAX_PLAYS = 3

export default class Playlist {
  private client: SupabaseClient
  private sipapu: Sipapu

  constructor(client: SupabaseClient, sipapu: Sipapu) {
    this.client = client
    this.sipapu = sipapu
  }

  /**
   * Creates a playlist for the currently authenticated user with the given name
   * Initialized the users array with the current user
   * @param name The name of the playlist
   * @returns {@link Promise<PlaylistType>} The created playlist
   * @throws {@link Error} If the user doesn't exist or the user doesn't have access to it
   */
  async create(name: string): Promise<void> {
    const uid = this.client.auth.user()?.id

    if (!uid) {
      throw new Error('You are not logged in!')
    }

    const username = this.client.auth.user()?.user_metadata.username

    const { error } = await this.client
      .from('playlist')
      .insert({
        name,
        user_id: uid,
        users: [username]
      })

    if (error !== null) {
      throw error
    }
  }

  /**
   * Get a playlist by its id.
   * @param playlistId 
   * @returns 
   */
  async get(playlistId: number): Promise<PlaylistType> {
    const { data, error } = await this.client
      .from('playlist')
      .select()
      .match({ id: playlistId })

    if (error !== null) {
      throw error
    }

    if (data === null || data.length === 0) {
      throw new Error('Playlist not found')
    }

    return {
      id: data[0].id,
      createdAt: new Date(data[0].created_at),
      name: data[0].name,
      user: data[0].user_id,
      users: data[0].users,
    }
  }

  /**
   * Delete a playlist
   * @param playlistId The playlist to delete 
   * @throws {@link Error} If the playlist doesn't exist or the user doesn't have access to it
   */
  async delete(playlistId: number): Promise<void> {
    const { error } = await this.client
      .from('playlist')
      .delete()
      .match({ id: playlistId })

    if (error !== null) {
      throw error
    }
  }

  /**
   * Get a playlist with all songs that are in this playlist
   * @param playlistId The playlist id to query
   * @returns {@link PlaylistWithSongsType} The playlist with all songs
   * @throws {@link Error} If the playlist doesn't exist or the user doesn't have access to it
   */
  async getWithSongs(playlistId: number): Promise<PlaylistWithSongsType> {
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
      .match({ user_id: uid })

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
        user: playlist.user_id,
        users: playlist.users,
      })
    })

    return playlists
    
  }

  /**
   * Resets an entire playlists play count to 0. This also generates a PLAYLIST_FINISHED event, since this method is always called when a playlist is finished.
   * @param playlistId The playlist to reset
   * @throws {@link Error} If the playlist doesn't exist or the user doesn't have access to it
   */
  async resetPlaylist(playlistId: number): Promise<void> {
    const { error } = await this.client
      .from('song')
      .update({
        play_count: 0
      })
      .match({ playlist: playlistId })

    if (error !== null) {
      throw error
    }

    if (!this.sipapu.Session.sessionId) {
      throw new Error('SessionID not set in sipapu.Session.sessionId')
    }
    await this.sipapu.Session.notifyEvent(this.sipapu.Session.sessionId, EventTypes.SESSION_REMOVED, EMPTY_EVENT_DATA)
  }

  /**
   * Adds an username to the list of people who added to this playlist
   * @param playlistId The playlist to add the user to
   * @param userId The user to add to the playlist
   * @throws {@link Error} If the playlist doesn't exist or the user doesn't have access to it
   */
  async addUser(playlistId: number, userId: string): Promise<void> {
    const { error } = await this.client
      .rpc('add_user_to_playlist', {
        playlist_id: playlistId,
        uid: userId
      })

    if (error !== null) {
      throw error
    }

    if (!this.sipapu.Session.sessionId) {
      throw new Error('SessionID not set in sipapu.Session.sessionId')
    }
    await this.sipapu.Session.notifyEvent(this.sipapu.Session.sessionId, EventTypes.SESSION_REMOVED, { error: false, user: userId })
  }

  /**
   * Checks if the username already is in the list of users
   * @param playlistId The playlist to check
   * @param username The username to check
   * @returns boolean If the user is in the list of users
   * @throws {@link Error} If the playlist doesn't exist or the user doesn't have access to it
   */
  async hasUsername(playlistId: number, username: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('playlist')
      .select()
      .match({ id: playlistId })

    if (error !== null) {
      throw error
    }

    if (data === null || data.length === 0) {
      throw new Error('Playlist not found')
    }

    return data[0].users.includes(username)
  }

  /**
   * Gets an array of usernames that added to this playlist
   * @param playlistId The playlist to get the users from
   * @returns {@type Promise<string[]>} The array of usernames
   * @throws {@type Error} If the playlist doesn't exist or the user doesn't have access to it
   */
  async getUsers(playlistId: number): Promise<string[]> {
    const { data, error } = await this.client
      .from('playlist')
      .select()
      .match({ id: playlistId })

    if (error !== null) {
      throw error
    }

    if (data === null || data.length === 0) {
      throw new Error('Playlist not found')
    }

    return data[0].users
  }

  /**
   * Get the number of users from the given playlist.
   * @param playlistId The playlist to get the number of users from
   * @returns {@link Promise<number>} The number of users in the playlist
   * @throws {@link Error} If the playlist doesn't exist or the user doesn't have access to it
   */
  async getNumberOfUsers(playlistId: number): Promise<number> {
    try {
      const users = await this.getUsers(playlistId)
      return users.length
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all songs that are played less than {@link MAX_PLAYS} times
   * @param playlistId The playlist to query
   * @returns {@link Promise<SongType[]>} The songs that are played less than {@link MAX_PLAYS} times
   * @throws {@link Error} If the playlist doesn't exist or the user doesn't have access to it
   */
  async getSongsNotPlayedEnough(playlistId: number): Promise<SongType[]> {
    try {
      const songs = await this.sipapu.Song.getAllFromPlaylist(playlistId)
      const songsNotPlayed = songs.filter(song => song.playCount < MAX_PLAYS)
      return songsNotPlayed
    } catch (error) {
      throw error
    }
  }

  /**
   * Gets the number of songs that are in the given playlist
   * @param playlistId The playlist to get the number of songs from
   * @returns {@link Promise<number>} The number of songs in the playlist
   * @throws {@link Error} If the playlist doesn't exist or the user doesn't have access to it
   */
  async getNumberOfSongs(playlistId: number): Promise<number> {
    try {
      const songs = await this.sipapu.Song.getAllFromPlaylist(playlistId)
      return songs.length
    } catch (error) {
      throw error
    }
  }

}