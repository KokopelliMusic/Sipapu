import { SessionSettings } from './services/session'
import { SongType, SpotifySongCreateType, YoutubeSongCreateType } from './services/song'


export enum EventTypes {
  GENERIC = 'generic',

  SESSION_CREATED = 'session_created',
  SESSION_REMOVED = 'session_removed',

  SKIP_SONG = 'skip_song',
  PLAY_SONG = 'play_song',
  PREVIOUS_SONG = 'previous_song',
  PLAY_PAUSE = 'play_pause',

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
  SESSION_SETTINGS_CHANGED = 'session_settings_changed'
}
 
// eslint-disable-next-line @typescript-eslint/ban-types
export type EventData = {
  error: false
}

export type GenericEventData = EventData & unknown

// eslint-disable-next-line @typescript-eslint/ban-types
export type SessionCreatedEventData = EventData & {
  settings: SessionSettings,
  refreshToken: string
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type SessionRemovedEventData = EventData & {}

// eslint-disable-next-line @typescript-eslint/ban-types
export type SkipSongEventData = EventData & {}

export type PlaySongEventData = EventData & { song: SongType }

// eslint-disable-next-line @typescript-eslint/ban-types
export type PreviousSongEventData = EventData & {}

// eslint-disable-next-line @typescript-eslint/ban-types
export type PlayPauseEventData = EventData & {}

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
