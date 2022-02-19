import { SupabaseClient } from '@supabase/supabase-js'
import { Sipapu } from '..'
import { PlaylistType } from './playlist'
import { SongType } from './song'
import { EventTypes, Event, EventData } from '../events'

/**
 * All queueing algorithms the user can choose from
 * <pre></pre>
 * 'classic' is the default and classic Kokopelli experience, weighted random on user
 * First the algorithm chooses an random user, then it uses weighted-song to select from the user's queue
 * <pre></pre>
 * 'modern' assigns weights to each user (based on how many times they have played), and then uses weighted-song to select from the user's queue
 * basically the classic algo but better
 * <pre></pre>
 * 'random' is pure random (garbage)
 * <pre></pre>
 * 'weighted-song' assignes weights to each song in the queue (based on how many times it has been played), and selects a song with the lowest weight (random if multiple with same weight)
 */
export type QueueAlgorithms = 'classic' | 'modern' | 'random' | 'weighted-song'

/**
 * All the random events that can happen in the player
 * <pre></pre>
 * 'adtrad is the wheel of fortune, enabled by default
 * <pre></pre>
 * 'opus' plays the song Opus, disabled by default
 * <pre></pre>
 * 'random-word' selects a random word from the wordList, disabled by default
 * 
 */
export type PlayerEvents = 'adtrad' | 'opus' | 'random-word'

/**
 * All settings that a session can have
 * @param allowSpotify If true, the session will allow Spotify songs to be added
 * @param allowYoutube If true, the session will allow Youtube songs to be added
 * @param youtubeOnlyAudio player hides the youtube video (ignored if allowYouTube is false)
 * @param allowEvents allow events to happen in the player
 * @param eventFrequency Every x songs the player will (maybe) do an event (ignored if allowEvents is false)
 * @param allowedEvents All events in this list the player can choose to do  (ignored if allowEvents is false)
 * @param randomWordList A list of words that the player can choose from when a random-word event happens
 * @param anyoneCanUsePlayerControls if false then only host can control playback (pause, play, etc)
 * @param anyoneCanAddToQueue if false then only host can add songs to the queue, ignoring the algorithm
 * @param anyoneCanSeeHistory if false then only host can see the history of events (eg when a song is played or skipped or a song is added)
 * @param anyoneCanSeeQueue if false then only host can see the queue of songs
 * @param anyoneCanSeePlaylist if false then only host can see the playlist
 * @param algorithmUsed The Algorithm that this session will use to select songs from the queue
 */
export type SessionSettings = {
  allowSpotify: boolean,     
  allowYouTube: boolean,     
  youtubeOnlyAudio: boolean, 
  // other sources added later
  
  allowEvents: boolean,               
  eventFrequency: number,             
  allowedEvents: Array<PlayerEvents>,
  randomWordList: string[],

  anyoneCanUsePlayerControls: boolean,
  anyoneCanAddToQueue: boolean,       
  
  anyoneCanSeeHistory: boolean,
  anyoneCanSeeQueue: boolean,
  anyoneCanSeePlaylist: boolean,

  algorithmUsed: QueueAlgorithms,
}

export type SessionType = {
  id: string
  createdAt: Date
  user: string
  playlistId: number
  currentlyPlaying: SongType
  settings: SessionSettings
}

export const EMPTY_EVENT_DATA: EventData = { error: false }

export const DEFAULT_SETTINGS: SessionSettings = {
  allowSpotify: true,
  allowYouTube: true,
  youtubeOnlyAudio: false,
  
  allowEvents: true,
  eventFrequency: 10,
  allowedEvents: ['adtrad'],
  randomWordList: [],
  
  anyoneCanUsePlayerControls: true,
  anyoneCanAddToQueue: true,
  
  anyoneCanSeeHistory: true,
  anyoneCanSeeQueue: true,
  anyoneCanSeePlaylist: true,

  algorithmUsed: 'modern',
}

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
    return await fetch(`${this.sipapu.tawaUrl}/input/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session: sessionId,
        clientType: this.sipapu.clientType,
        eventType,
        data: JSON.stringify(eventData)
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

    // haha typescript
    return data as unknown as string
  }

  /**
   * Claim a session, this activates it and triggers Session.watch()
   * @param sessionId The id of the session to claim
   * @param playlistId The id of the playlist to use
   * @throws {@link Error} If the new session doesn't exist
   */
  async claim(playlistId: number, sessionId: string, settings: SessionSettings): Promise<void> {
    const { error } = await this.client
      .rpc('claim_session', { 
        session_id: sessionId, 
        user_id: this.client.auth.user()?.id, 
        playlist_id: playlistId,
        settings
      })

    if (error !== null) {
      throw error
    }

    this.sessionId = sessionId

    this.notifyEvent(sessionId, EventTypes.SESSION_CREATED, { settings })
  }

  /**
   * Join a session. This will add the current authenticated users to the users array of the current playlist.
   * @param sessionId The id of the session to join
   * @throws {@link Error} If the session doesn't exist or the user doesn't have access to it
   * @throws {@link Error} If the current user does not exist or some other authentication error
   */
  async join(sessionId: string): Promise<void> {
    const user = this.client.auth.user()?.id

    if (!user) {
      throw new Error('User not authenticated')
    }

    const session = await this.get(sessionId)
      .catch(error => { throw error })

    if (!session) {
      throw new Error('Session not found')
    }

    // We can disable the non null assesion here since that method throws an error if it is null so this code is never reached
    const { error } = await this.client
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .rpc('add_user_to_playlist', { playlist_id: session!.playlistId, uid: user })

    if (error !== null) {
      throw error
    }

    await this.notifyEvent(sessionId, EventTypes.NEW_USER, { ...EMPTY_EVENT_DATA, user })
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

    if (error !== null) {
      throw error
    }

    if (data === null || data.length === 0) {
      return undefined
    }

    return {
      id: sessionId,
      createdAt: new Date(data[0].created_at),
      user: data[0].user_id,
      playlistId: data[0].playlist,
      currentlyPlaying: data[0].currently_playing,
      settings: data[0].settings,
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

  async updateSettings(sessionId: string, settings: SessionSettings): Promise<void> {
    const { error } = await this.client
      .from('session')
      .update({ settings })
      .match({ id: sessionId })

    if (error !== null) {
      throw error
    }

    await this.notifyEvent(sessionId, EventTypes.SESSION_SETTINGS_CHANGED, settings)
  }

  /**
   * Watch the event stream for changes to the current session
   * These events can be any type of event, all from the EventTypes enum
   * All types are specified in {@link events.ts}
   * If this.sessionId is set, then this function uses that value
   * @param sessionId The id of the session to watch, if the
   * @param callback The function to call when an event is received, it passes the event in the correct type
   * @returns A function that closes the stream
   */
  async watch(sessionId: string, callback: (event: Event) => unknown): Promise<() => void> {

    if (this.sessionId !== undefined) {
      sessionId = this.sessionId
    }

    const url = `${this.sipapu.tawaUrl}/stream/session/${sessionId}`
    const stream = new EventSource(url)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream.addEventListener('message', (msg: MessageEvent<any>): void => {
      const data = JSON.parse(msg.data)
      console.log('[SIPAPU] New event:', data)
      callback(data)
    })

    return () => stream.close()
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

  /**
   * Set the currently playing song for the current session
   * If this.sessionId is set, then this function uses that value
   * @param sessionId The id of the session to lookup
   * @param song The song to set as currently playing
   */
  async setCurrentlyPlaying(sessionId: string, song: SongType): Promise<void> {
    if (this.sessionId !== undefined) {
      sessionId = this.sessionId
    }
    
    const { error } = await this.client
      .from('session')
      .update({ currently_playing: song })
      .match({ id: sessionId })

    if (error) 
      throw error
  }
}

