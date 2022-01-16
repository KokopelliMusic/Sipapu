import { SupabaseClient } from '@supabase/supabase-js'
import { Sipapu } from '..'

export type ProfileType = {
  id: string
  createdAt: Date

  username: string

  profilePicture: string | undefined
}

type ProfileCreateType = {
  id: string
  username: string
  profilePicture: string | undefined
}

export default class Profile {
  private client: SupabaseClient
  private sipapu: Sipapu
    
  constructor(client: SupabaseClient, sipapu: Sipapu) {
    this.client = client
    this.sipapu = sipapu
  }

  /**
   * Get the profile for a given user id
   * @throws {@link Error} If the profile doesn't exist or the user doesn't have access to it
   * @returns The ProfileType of the asked user
   */
  async get(id: string): Promise<ProfileType> {
    const { data, error } = await this.client
      .from('profile')
      .select()
      .match({ id })

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      throw new Error('Profile not found')
    }

    return data[0]
  }

  /**
   * Create a new profile for the current user
   * @param profile 
   */
  async create(profile: ProfileCreateType): Promise<void> {
    const { error } = await this.client
      .from('profile')
      .insert({
        profile_picture: profile.profilePicture,
        username: profile.username,
        id: profile.id
      }, { returning: 'minimal' })

    if (error) {
      throw error
    }
  }

  /**
   * Get the ProfileType of the current user
   * @throws {@link Error} If there is no one logged in
   */
  async getCurrent(): Promise<ProfileType> {
    const id = this.client.auth.user()?.id

    if (!id) {
      throw new Error('You are not logged in!')
    }

    const { data, error } = await this.client
      .from('profile')
      .select()
      .match({ id })

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      throw new Error('Profile not found')
    }

    return data[0]
  }

  /**
   * Sets the profile_picture for the current user
   * @param profilePicture An url string that points to the profile picture
   * @throws {@link Error} If there is no one logged in
   */
  async setProfilePicture(profilePicture: string): Promise<void> {
    const id = this.client.auth.user()?.id

    if (!id) {
      throw new Error('You are not logged in!')
    }

    const { error } = await this.client
      .from('profile')
      .update({ profilePicture })
      .match({ id })

    if (error) {
      throw error
    }
  }

  /**
   * Update the username for the current user
   * @param username The username to set
   * @throws {@link Error} If there is no one logged in
   */
  async updateUsername(username: string): Promise<void> {
    const id = this.client.auth.user()?.id

    if (!id) {
      throw new Error('You are not logged in!')
    }

    const { error } = await this.client
      .from('profile')
      .update({ username })
      .match({ id })

    if (error) {
      throw error
    }
  }
}