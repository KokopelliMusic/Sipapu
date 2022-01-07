import { SupabaseClient } from '@supabase/supabase-js'
import { Sipapu } from '..'
import { settings } from '../settings'
import { PlaylistType } from './playlist'
import { SongType } from './song'
import { EventTypes, Event, parseEvent, EventData } from '../events'

type SessionType = {
  id: string
  createdAt: Date
  user: string
  playlistId: number
  currentlyPlaying: SongType
}

export const EMPTY_EVENT_DATA: EventData = { error: false }

/**
 * Session class, defining a session and all methods that can query anything related to Sessions.
 */
export default class Session {
  private client: SupabaseClient;
  private sipapu: Sipapu;
  sessionId: string | undefined

  constructor(client: SupabaseClient, sipapu: Sipapu) {
    this.client = client
    this.sipapu = sipapu
  }

  /**
   * Sets the current session id, this value is always used in methods, even if you pass a session id to the method
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId
  }

  /**
   * Notifes the server of an event, this is then sent to all clients in the session
   * @param sessionId The id of the session to notify
   * @param eventType The type of event to notify
   * @param data The data to send with the event
   */
  async notifyEvent(sessionId: string, eventType: EventTypes, eventData: EventData | unknown): Promise<void> {
    return await fetch(`${settings.tawaUrl}/input/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session: sessionId,
        clientType: this.sipapu.clientType,
        eventType,
        data: eventData
      })
    })
    .then(res => res.json())
    .catch(error => { throw error })
  }

  /**
   * Create a new session in the database, and return the id of the session
   * NOTE: this is not a valid session yet! This still needs to be claimed by an app user using Session.claim(id)
   * @returns The id of the new session
   */
  async new(): Promise<string> {
    const { data, error } = await this.client
      .rpc('new_session')

    if (error !== null) {
      throw error
    }

    if (data === null || data.length === 0) {
      throw new Error('Something went wrong: Session not created')
    }

    await this.notifyEvent(data[0].id, EventTypes.SESSION_CREATED, EMPTY_EVENT_DATA)

    return data[0]
  }

  /**
   * Claim a session, this activates it and triggers Session.watch()
   * @param sessionId The id of the session to claim
   * @param playlistId The id of the playlist to use
   * @throws {@link Error} If the new session doesn't exist
   */
  async claim(playlistId: string, sessionId: string): Promise<void> {
    const { error } = await this.client
      .rpc('claim_session', { session_id: sessionId, user_id: this.client.auth.user()?.id, playlist_id: playlistId })

    if (error !== null) {
      throw error
    }
    
    this.sessionId = sessionId
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

    if (error === null || data === null || data.length === 0) {
      return undefined
    }

    return {
      id: sessionId,
      createdAt: new Date(data[0].created_at),
      user: data[0].user_id,
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

    await this.notifyEvent(sessionId, EventTypes.SESSION_REMOVED, EMPTY_EVENT_DATA)
  }

  /**
   * Watch the event stream for changes to the current session
   * These events can be any type of event, all from the EventTypes enum
   * All types are specified in {@link events.ts}
   * If this.sessionId is set, then this function uses that value
   * @param sessionId The id of the session to watch, if the
   * @param callback The function to call when an event is received, it passes the event in the correct type
   * 
   */
  async watch(sessionId: string, callback: (event: Event) => unknown): Promise<void> {

    if (this.sessionId !== undefined) {
      sessionId = this.sessionId
    }

    const url = `${settings.tawaUrl}/stream/session/${sessionId}`
    const stream = new EventSource(url)
    stream.addEventListener('message', msg => {
      console.log('[SIPAPU] New event:', msg)
      const parsedEventData = parseEvent(msg.data.eventType, msg.data.data)
      const cbevent: Event = Object.assign({}, msg.data, { data: parsedEventData })
      callback(cbevent)
    })
  }

  /**
   * Set the user for the given session
   * If this.sessionId is set, then this function uses that value
   * @param sessionId The session to set the user for
   * @param user The uid to set
   * @throws {@link Error} If the session doesn't exist or the user doesn't have access to it
   */
  async setUser(user: string, sessionId: string): Promise<void> {
    if (this.sessionId !== undefined) {
      sessionId = this.sessionId
    }

    try {
      const session = await this.get(sessionId)

      if (session === undefined) {
        throw new Error('Session not found')
      }

      await this.client
        .from('session')
        .update({ user_id: user })
        .match({ id: sessionId })
    } catch (error) {
      throw error
    }
  }

  /**
   * Get the playlist for the current session
   * If this.sessionId is set, then this function uses that value
   * @param sessionId 
   * @returns Promise<PlaylistType> The playlist that the current session uses
   * @throws {@link Error} If the session doesn't exist or the user doesn't have access to it
   */
  async getPlaylist(sessionId: string): Promise<PlaylistType> {
    if (this.sessionId !== undefined) {
      sessionId = this.sessionId
    }

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
   * If this.sessionId is set, then this function uses that value
   * @param sessionId The id of the session to lookup
   * @returns Promise<SongType> The song that is currently playing
   * @throws {@link Error} If the session doesn't exist or the user doesn't have access to it
   */
  async getCurrentlyPlaying(sessionId: string): Promise<SongType> {
    if (this.sessionId !== undefined) {
      sessionId = this.sessionId
    }

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

