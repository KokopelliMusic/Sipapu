import { createClient, SupabaseClient, SupabaseClientOptions, User } from '@supabase/supabase-js'
import Playlist from './services/playlist'
import Session from './services/session'
import Song from './services/song'
import { settings } from './settings'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISipapu {
  Session: Session
  Playlist: Playlist
  Song: Song
}

/**
 * A Sipapu client.
 * This is the authenticated version, it requires a valid access token to instanciate
 * The usual workflow to use this client is:
 *  - Create an {@link AnonymousSipapu} client
 *  - Authenticate the client
 *  - Use the client to query data
 */
export class Sipapu implements ISipapu {
  private client: SupabaseClient
  Session: Session
  Playlist: Playlist
  Song: Song

  constructor(apiKey: string) {
    const options: SupabaseClientOptions = {
      headers: {
        apiKey
      }
    }

    this.client = createClient(settings.supabaseUrl, settings.supabaseKey, options)
    this.Session = new Session(this.client, this)
    this.Playlist = new Playlist(this.client, this)
    this.Song = new Song(this.client, this)
  }

  /**
   * Changes the username for the current user
   * @param username The username to change into
   * @throws {@link Error} If supabase screws up
   */
  async changeUsername(username: string): Promise<void> {
    const { error } = await this.client.auth.update({ data: { username } })

    if (error) {
      throw error
    }
  }

  /**
   * Fetches the current user's username
   * @throws {@link Error} If the user is not authenticated or found of smth else went wrong
   * @returns {Promise<string>} The current user's username
   */
  async getUsername(): Promise<string> {
    const user = await this.client.auth.user()

    if (user === null) {
      throw new Error('User not found')
    }

    return user.user_metadata.username 
  }

  /**
   * Signs out the current user
   */
  async signOut(): Promise<void> {
    await this.client.auth.signOut()
  }

}

/**
 * The Anonymous Sipapu client.
 * This is the unauthenticated version, it doesn't require an access token to instanciate
 * Usually this is used only for authentication, but can be usefull for the webplayer before a session is set.
 * The query capabilities are limited to the public data.
 * All authentication methods return a {@link Sipapu} client.
 * Then this client is not usefull anymore
 */
export class AnonymousSipapu implements ISipapu {
  private client: SupabaseClient
  Session: Session
  Playlist: Playlist
  Song: Song


  constructor() {
    this.client = createClient(settings.supabaseUrl, settings.supabaseKey)
    this.Session = new Session(this.client, this)
    this.Playlist = new Playlist(this.client, this)
    this.Song = new Song(this.client, this)
  }

  /**
   * Sign up an user for Kokopelli, and returns a Sipapu instance.
   * @param email string The email of the user 
   * @param password string The password of the user 
   * @param username string The username of the user
   * @returns A {@link Sipapu} instance
   * @throws {@link Error} if the email or password are incorrect
   * @throws {@link ApiError} in the case Supabase screws up
   */
  async signUp(email: string, password: string, username: string): Promise<Sipapu> {
    const { user, session, error } = await this.client.auth.signUp(
      {
        email,
        password,
      },
      {
        data: {
          username
        }
      }
    )

    if (error !== null) {
      throw error
    }

    if (session === null) {
      throw new Error('Email confirmation is still turned on in the supabase settings, pls fix')
    }

    if (user === null) {
      throw new Error('According to the documentation this should never happen, but in the case it does: User obj is null in the supabase.auth.signUp() method')
    }

    return new Sipapu(session.access_token)
  }

  /**
   * The method for signing in an user for Kokopelli, and returns a Sipapu instance.
   * @param email string The email of the user
   * @param password string The password of the user
   * @returns A valid {@link Sipapu} instance
   * @throws {@link Error} if the email or password are incorrect
   * @throws {@link ApiError} in the case Supabase screws up
   */
  async signIn(email: string, password: string): Promise<Sipapu> {
    const { session, error } = await this.client.auth.signIn(
      {
        email,
        password,
      }
    )

    if (error !== null) {
      throw error
    }

    if (session === null) {
      throw new Error('Email confirmation is still turned on in the supabase settings, pls fix')
    }

    return new Sipapu(session.access_token)
  }
}