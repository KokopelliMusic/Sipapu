import { SupabaseClient, SupabaseRealtimePayload } from '@supabase/supabase-js'
import { PlaylistType } from './playlist';

type SessionType = {
  id: string
  createdAt: Date
  user: string
  playlistId: number
}

/**
 * Session class, defining a session and all methods that can query anything related to Sessions.
 */
export default class Session {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client
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
        callback({
          id: payload.new.id,
          createdAt: new Date(payload.new.created_at),
          user: payload.new.user,
          playlistId: payload.new.playlist
        })
      })
      .subscribe()
  }

  /**
   * Get the playlist for the current session
   * @param sessionId 
   * @returns 
   */
  async getPlaylistId(sessionId: string): Promise<PlaylistType> {
    // return await this.get(sessionId).then(session => {
    // })
  }

}