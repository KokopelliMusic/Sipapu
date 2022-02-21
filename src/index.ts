import { createClient, SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js'
import Playlist from './services/playlist'
import Profile from './services/profile'
import Session from './services/session'
import Song from './services/song'
import Spotify from './services/spotify'

/**
 * A Sipapu client.
 * This client is anonymous as long as signIn() or singUp() is not called
 */
export class Sipapu {
  client: SupabaseClient
  Session: Session
  Playlist: Playlist
  Song: Song
  Spotify: Spotify
  Profile: Profile
  clientType: string
  tawaUrl: string

  /**
   * Constructor for the Sipapu client
   */
  constructor(clientType: string, supabaseUrl: string, supabaseKey: string, tawaUrl: string) {

    const options: SupabaseClientOptions = {
      headers: {},
      autoRefreshToken: true,
      persistSession: true
    }

    this.clientType = clientType
    this.client = createClient(supabaseUrl, supabaseKey, options)
    this.Session = new Session(this.client, this)
    this.Playlist = new Playlist(this.client, this)
    this.Song = new Song(this.client, this)
    this.Spotify = new Spotify(this.client, this)
    this.Profile = new Profile(this.client, this)
    this.tawaUrl = tawaUrl
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

    // Now the user exists, we can create a new profile
    this.Profile.create({ username, id: user.id, profilePicture: undefined })

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

  /**
   * Sign in with a Session object instead of email/password
   * This is used for the webplayer
   * @param refreshToken the refreshtoken, taken from a valid session
   */
  async signInWithSession(refreshToken: string): Promise<void> {
    const { session, error } = await this.client.auth.setSession(refreshToken)

    if (error !== null) {
      throw error
    }

    if (session === null) {
      throw new Error('This Refresh Token is not valid')
    }

    this.client.auth.setAuth(session.access_token)
    localStorage.setItem('sipapu:access_token', session.access_token)
  }

  static getTokenFromLocalStorage(): string | null {
    return localStorage.getItem('sipapu:access_token')
  }

  /**
   * Returns the UID for the current user
   * @returns string | undefined The UID for the current user. Is undefined if not logged in
   */
  getUID(): string | undefined {
    return this.client.auth.user()?.id
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