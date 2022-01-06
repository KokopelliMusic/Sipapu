import { createClient, SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js'
import Playlist from './services/playlist'
import Session from './services/session'
import Song from './services/song'
import { settings } from './settings'

/**
 * A Sipapu client.
 * This client is anonymous as long as signIn() or singUp() is not called
 */
export class Sipapu {
  client: SupabaseClient
  Session: Session
  Playlist: Playlist
  Song: Song
  clientType: string

  /**
   * Constructor for the Sipapu client
   */
  constructor(clientType: string) {

    const options: SupabaseClientOptions = {
      headers: {},
      autoRefreshToken: true,
      persistSession: true
    }

    this.clientType = clientType
    this.client = createClient(settings.supabaseUrl, settings.supabaseKey, options)
    this.Session = new Session(this.client, this)
    this.Playlist = new Playlist(this.client, this)
    this.Song = new Song(this.client, this)
  }

  isLoggedIn(): boolean {
    return this.client.auth.session() !== null
  }

  /**
   * Sign up an user for Kokopelli and sets the api token to the new one
   * @param email string The email of the user 
   * @param password string The password of the user 
   * @param username string The username of the user
   * @throws {@link Error} if the email or password are incorrect
   * @throws {@link ApiError} in the case Supabase screws up
   */
   async signUp(email: string, password: string, username: string): Promise<void> {
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

    this.client.auth.setAuth(session.access_token)
    localStorage.setItem('sipapu:access_token', session.access_token)
  }

  /**
   * The method for signing in an user for Kokopelli, this method replaces the current access token with the new one
   * @param email string The email of the user
   * @param password string The password of the user
   * @throws {@link Error} if the email or password are incorrect
   * @throws {@link ApiError} in the case Supabase screws up
   */
  async signIn(email: string, password: string): Promise<void> {
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

    this.client.auth.setAuth(session.access_token)
    localStorage.setItem('sipapu:access_token', session.access_token)
  }

  static getTokenFromLocalStorage(): string | null {
    return localStorage.getItem('sipapu:access_token')
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
    localStorage.removeItem('sipapu:access_token')
    this.client.auth.setSession('')
  }
}