import { SongType, SpotifySongCreateType, YoutubeSongCreateType } from './services/song'


export enum EventTypes {
  GENERIC = 'generic',

  SESSION_CREATED = 'session_created',
  SESSION_REMOVED = 'session_removed',

  SKIP_SONG = 'skip_song',
  PLAY_SONG = 'play_song',
  PREVIOUS_SONG = 'previous_song',
  RESUME_PLAYBACK = 'resume_playback',
  PAUSE_PLAYBACK = 'pause_playback',

  YOUTUBE_SONG_ADDED = 'youtube_song_added',
  SPOTIFY_SONG_ADDED = 'spotify_song_added',
  SONG_REMOVED = 'song_removed',
  NEW_USER = 'new_user',

  SONG_FINISHED = 'song_finished',
  NEXT_SONG = 'next_song',
  PLAYLIST_FINISHED = 'playlist_finished',

  SPOTIFY_ERROR = 'spotify_error',
  YOUTUBE_ERROR = 'youtube_error',
  PLAYLIST_TOO_SMALL_ERROR = 'playlist_too_small_error',
  SESSION_SETTINGS_CHANGED = 'SESSION_SETTINGS_CHANGED'
}
 
// eslint-disable-next-line @typescript-eslint/ban-types
export type EventData = {
  error: false
}

export type GenericEventData = EventData & unknown

// eslint-disable-next-line @typescript-eslint/ban-types
export type SessionCreatedEventData = EventData & {}

// eslint-disable-next-line @typescript-eslint/ban-types
export type SessionRemovedEventData = EventData & {}

// eslint-disable-next-line @typescript-eslint/ban-types
export type SkipSongEventData = EventData & {}

export type PlaySongEventData = EventData & { song: SongType }

// eslint-disable-next-line @typescript-eslint/ban-types
export type PreviousSongEventData = EventData & {}

// eslint-disable-next-line @typescript-eslint/ban-types
export type ResumePlaybackEventData = EventData & {}

// eslint-disable-next-line @typescript-eslint/ban-types
export type PausePlaybackEventData = EventData & {}

export type YoutubeSongAddedEventData = EventData & { song: YoutubeSongCreateType }

export type SpotifySongAddedEventData = EventData & { song: SpotifySongCreateType }

export type SongDeletedEventData = EventData & { songId: number }

export type NewUserEventData = EventData & { user: string }

// eslint-disable-next-line @typescript-eslint/ban-types
export type SongFinishedEventData = EventData & {}

export type NextSongEventData = EventData & { song: SongType }

// eslint-disable-next-line @typescript-eslint/ban-types
export type PlaylistFinishedEventData = EventData & {}

export type SpotifyErrorEventData = EventData & { error: true, message: unknown }

export type YoutubeErrorEventData = EventData & { error: true, message: unknown }

export type PlaylistTooSmallError = EventData & { error: true, message: string }

export type Event = {
  session: string
  clientType: string
  eventType: string
  date: number
  data: EventData
}

export const parseEvent = (eventType: EventTypes, data: unknown): EventData => {
  // Wees niet bang, GitHub copilot heeft dit geschreven lol
  switch (eventType) {
    case EventTypes.GENERIC:
      return data as GenericEventData
    case EventTypes.SESSION_CREATED:
      return data as SessionCreatedEventData
    case EventTypes.SESSION_REMOVED:
      return data as SessionRemovedEventData
    case EventTypes.SKIP_SONG:
      return data as SkipSongEventData
    case EventTypes.PLAY_SONG:
      return data as PlaySongEventData
    case EventTypes.PREVIOUS_SONG:
      return data as PreviousSongEventData
    case EventTypes.RESUME_PLAYBACK:
      return data as ResumePlaybackEventData
    case EventTypes.PAUSE_PLAYBACK:
      return data as PausePlaybackEventData
    case EventTypes.YOUTUBE_SONG_ADDED:
      return data as YoutubeSongAddedEventData
    case EventTypes.SPOTIFY_SONG_ADDED:
      return data as SpotifySongAddedEventData
    case EventTypes.SONG_REMOVED:
      return data as SongDeletedEventData
    case EventTypes.NEW_USER:
      return data as NewUserEventData
    case EventTypes.SONG_FINISHED:
      return data as SongFinishedEventData
    case EventTypes.NEXT_SONG:
      return data as NextSongEventData
    case EventTypes.PLAYLIST_FINISHED:
      return data as PlaylistFinishedEventData
    case EventTypes.SPOTIFY_ERROR:
      return data as SpotifyErrorEventData
    case EventTypes.YOUTUBE_ERROR:
      return data as YoutubeErrorEventData
    case EventTypes.PLAYLIST_TOO_SMALL_ERROR:
      return data as PlaylistTooSmallError
    case EventTypes.SESSION_SETTINGS_CHANGED:
      return data as SessionCreatedEventData
  } 
}