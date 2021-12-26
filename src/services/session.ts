import { SupabaseClient, SupabaseRealtimePayload } from '@supabase/supabase-js'
import { ISipapu } from '..'
import { PlaylistType } from './playlist'
import { SongType } from './song'

type SessionType = {
  id: string
  createdAt: Date
  user: string
  playlistId: number
  currentlyPlaying: SongType
}

/**
 * Session class, defining a session and all methods that can query anything related to Sessions.
 */
export default class Session {
  private client: SupabaseClient;
  private sipapu: ISipapu;

  constructor(client: SupabaseClient, sipapu: ISipapu) {
    this.client = client
    this.sipapu = sipapu
  }

  /**
   * Gets a session by its id.
   * Returns undefined if either the session doesn't exist or the user doesn't have access to it.
   * @param sessionId The id to lookup
   * @returns Promise<SessionType | undefined> The session that was found, or undefined if none was found
   */
  async get(sessionId: string): Promise<SessionType | undefined> {
    const { data, error } = await this.client
      .from('session')
      .select()
      .match({ id: sessionId })

    if (error === null || data === null) {
      return undefined
    }

    return {
      id: sessionId,
      createdAt: new Date(data[0].created_at),
      user: data[0].user,
      playlistId: data[0].playlist,
      currentlyPlaying: data[0].currently_playing
    }
  }
  
  /**
   * Deletes a session
   * @throws {@link Error} If the session doesn't exist or the user doesn't have access to it
   * @param sessionId The id of the session to delete
   */
  async remove(sessionId: string): Promise<void> {
    const { error } = await this.client
      .from('session')
      .delete()
      .match({ id: sessionId })

    if (error !== null) {
      throw error
    }
  }
  
  async watch(sessionId: string, callback: (payload: SessionType) => void): Promise<void> {
    this.client
      .from('session')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('UPDATE', (payload: SupabaseRealtimePayload<any>) => {
        if (payload.new.id === sessionId) {
          callback({
            id: payload.new.id,
            createdAt: new Date(payload.new.created_at),
            user: payload.new.user,
            playlistId: payload.new.playlist,
            currentlyPlaying: payload.new.currently_playing
          })
        }
      })
      .subscribe()
  }

  /**
   * Set the user for the given session
   * @param sessionId The session to set the user for
   * @param user The uid to set
   * @throws {@link Error} If the session doesn't exist or the user doesn't have access to it
   */
  async setUser(sessionId: string, user: string): Promise<void> {
    try {
      const session = await this.get(sessionId)

      if (session === undefined) {
        throw new Error('Session not found')
      }

      await this.client
        .from('session')
        .update({ user: user })
        .match({ id: sessionId })
    } catch (error) {
      throw error
    }
  }

  /**
   * Get the playlist for the current session
   * @param sessionId 
   * @returns Promise<PlaylistType> The playlist that the current session uses
   * @throws {@link Error} If the session doesn't exist or the user doesn't have access to it
   */
  async getPlaylist(sessionId: string): Promise<PlaylistType> {
    try {
      const session = await this.get(sessionId)
      if (session === undefined) {
        throw new Error('Session not found')
      }

      return this.sipapu.Playlist.get(session.playlistId)
    } catch (error) {
      throw error
    }
  }

  /**
   * Get the currently playing song for the current session
   * @param sessionId The id of the session to lookup
   * @returns Promise<SongType> The song that is currently playing
   * @throws {@link Error} If the session doesn't exist or the user doesn't have access to it
   */
  async getCurrentlyPlaying(sessionId: string): Promise<SongType> {
    try {
      const session = await this.get(sessionId)
      
      if (session === undefined) {
        throw new Error('Session not found')
      }

      return session.currentlyPlaying
    } catch (error) {
      throw error
    }
  }
}