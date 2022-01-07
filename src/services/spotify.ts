import { SupabaseClient } from '@supabase/supabase-js'
import { Sipapu } from '..'

export type SpotifyType = {
  id: number,
  createdAt: Date,
  userId: string,
  sessionId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date,
}

export type SpotifyCreateType = {
  sessionId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date,
}

export default class Spotify {
  private client: SupabaseClient
  private sipapu: Sipapu

  constructor(client: SupabaseClient, sipapu: Sipapu) {
    this.client = client
    this.sipapu = sipapu
  }

  /**
   * Insert the spotify access token into the database.
   * This is only accessable by the user who inserted this information.
   * If there is no one logged in this will fail
   * @param spotify The spotify session, containing the access token and refresh token.
   * @throws Error if the user is not logged in or something else fails
   */
  async create(spotify: SpotifyCreateType): Promise<void> {
    const uid = this.client.auth.user()?.id

    if (!uid) {
      throw new Error('You are not logged in!')
    }

    const { error } = await this.client
      .from('spotify')
      .insert({
        user_id: uid,
        session_id: spotify.sessionId,
        access_token: spotify.accessToken,
        refresh_token: spotify.refreshToken,
        expires_at: spotify.expiresAt,
      })

    if (error !== null) {
      throw error
    }
  }

  /**
   * Get the spotify access token from the database for the current user.
   * @returns The spotify session, containing the access token and refresh token. 
   */
  async get(): Promise<SpotifyType> {
    const uid = this.client.auth.user()?.id

    if (!uid) {
      throw new Error('You are not logged in!')
    }
    
    const { data, error } = await this.client
      .from('spotify')
      .select()
      .match({ user_id: uid })

    if (error !== null) {
      throw error
    }

    if (data === null || data.length === 0) {
      throw new Error('No spotify information found, did your spotify login fail?')
    }

    return {
      id: data[0].id,
      createdAt: new Date(data[0].created_at),
      userId: data[0].user_id,
      sessionId: data[0].session_id,
      accessToken: data[0].access_token,
      refreshToken: data[0].refresh_token,
      expiresAt: new Date(data[0].expires_at),
    }
  }

  /**
   * Delete the spotify session in the database
   * @throws Error if the user is not logged in or something else fails
   */
  async delete(): Promise<void> {
    const uid = this.client.auth.user()?.id

    if (!uid) {
      throw new Error('You are not logged in!')
    }

    const { error } = await this.client
      .from('spotify')
      .delete()
      .match({ user_id: uid })

    if (error !== null) {
      throw error
    }
  }

  /**
   * Updates the spotify token in the database
   * @param newToken The new access token
   * @param newExpiration The new expiration date for the token
   * @throws Error if the user is not logged in or something else fails
   */
  async updateToken(newToken: string, newExpiration: Date): Promise<void> {
    const uid = this.client.auth.user()?.id

    if (!uid) {
      throw new Error('You are not logged in!')
    }

    const { error } = await this.client
      .from('spotify')
      .update({
        access_token: newToken,
        expires_at: newExpiration.toISOString(),
      })
      .match({ user_id: uid })

    if (error !== null) {
      throw error
    }
  }

}