export type Language = "jaJP" | "enUS" | "enGB" | "esLA" | "esES" | "ptBR" | "ptPT" | "frFR" | "deDE" | "itIT" | "ruRU"

export interface CrunchyrollAnime {
    class: "series"
    series_id: string
    url: string
    name: string
    media_type: string
    landscape_image: ImageSet
    portrait_image: ImageSet
    description: string
    in_queue: boolean
    rating: number
    media_count: number
    collection_count: number
    publisher_name: string
    year: string | null
    genres: string[]
}

export interface CrunchyrollSeason {
    class: "collection"
    collection_id: string
    etp_guid: string
    series_id: string
    series_etp_guid: string
    name: string
    description: string
    media_type: string
    season: string
    complete: boolean
    landscape_image?: ImageSet
    portrait_image?: ImageSet
    availability_notes: string
    created: string
}

export interface CrunchyrollEpisode {
    class: "media"
    media_id: string
    collection_id: string
    series_id: string
    media_type: string
    episode_number: string
    name: string
    description: string
    screenshot_image: ImageSet,
    bif_url: string
    url: string
    clip: boolean
    available: boolean
    premium_available: boolean
    free_available: boolean
    available_time: string
    unavailable_time: string
    premium_available_time: string
    premium_unavailable_time: string
    free_available_time: string
    free_unavailable_time: string
    availability_notes: string
    created: string
    duration: number
    series_name: string
    collection_name: string
    premium_only: boolean
    stream_data: {
      hardsub_lang: Language
      audio_lang: Language
      format: string
      streams: Array<{
          quality: string
          expires: string
          url: string
      }>
    },
    playhead: number
}

export interface ImageSet {
  thumb_url: string
  small_url: string
  medium_url: string
  large_url: string
  full_url: string
  wide_url: string
  widestar_url: string
  fwide_url: string
  fwidestar_url: string
  width: string
  height: string
}

export interface DownloadOptions {
  resolution?: number
  quality?: number
  skipConversion?: boolean
  audioOnly?: boolean
  preferSub?: boolean
  preferDub?: boolean
  ffmpegPath?: string
  softSubs?: boolean
  playlist?: string
  subtitles?: string[]
  subtitleNames?: string[]
  language?: Language
  template?: string
  codec?: string
  decryptionKey?: string
  headers?: string[]
  seek?: number
  intro?: {startTime: number; endTime: number}
}

export interface FFmpegProgress {
    bitrate: number
    bytes: number
    fps: number
    frames: number
    framesDropped: number
    framesDuped: number
    speed: number
    time: number
    percent: number
    resolution: number
    duration: number
}

export interface Locale {
  class: string
  locale_id: Language
  label: string
}

export interface Auth {
  user: {
    class: "user"
    user_id: string
    etp_guid: string
    username: string
    email: string
    first_name: string
    last_name: string
    premium: string
    is_publisher: boolean
    access_type: string | null
    created: string
  },
  auth: string
  expires: string
}

export interface QueueEntry {
  queue_entry_id: string
  ordering: string
  series: CrunchyrollAnime
  playhead: string
  last_watched_media: CrunchyrollEpisode | null
  last_watched_media_playhead: number | null
  most_likely_media: CrunchyrollEpisode | null
  most_likely_media_playhead: number | null
}

export interface RecentlyWatchedEntry {
  playhead: string
  timestamp: string
  media: CrunchyrollEpisode
  collection: CrunchyrollSeason
  series: CrunchyrollAnime
}

export interface Categories {
  genre: Array<{
    tag: string
    label: string
  }>
  season: Array<{
    tag: string
    label: string
  }>
}
