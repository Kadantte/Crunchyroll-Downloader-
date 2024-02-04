import {ipcRenderer, clipboard} from "electron"
import {shell} from "@electron/remote"
import {WebsiteContext} from "../renderer"
import React, {useState, useEffect, useRef, useContext} from "react"
import {Dropdown, DropdownButton} from "react-bootstrap"
import folderButtonCR from "../assets/crunchyroll/folderButton.png"
import folderButtonHoverCR from "../assets/crunchyroll/folderButton-hover.png"
import searchButtonCR from "../assets/crunchyroll/searchButton.png"
import searchButtonHoverCR from "../assets/crunchyroll/searchButton-hover.png"
import folderButtonHI from "../assets/hidive/folderButton.png"
import folderButtonHoverHI from "../assets/hidive/folderButton-hover.png"
import searchButtonHI from "../assets/hidive/searchButton.png"
import searchButtonHoverHI from "../assets/hidive/searchButton-hover.png"
import ErrorMessage from "./ErrorMessage"
import "../styles/searchbar.less"
import {vtt, editAss} from "../structures/vtt2ass"
import functions from "../structures/functions"
import HIDIVE from "../structures/hidive"
import {getKeys} from "../structures/widevine"
import {TypeContext, QualityContext, CodecContext, FormatContext, LanguageContext, TemplateContext, 
VideoQualityContext, EnglishDialectContext, SpanishDialectContext, PortugeuseDialectContext, FontColorContext,
TrimIntroContext, FontSizeContext, FontYPositionContext, CheckboxModeContext, ThemeContext} from "../renderer"

const SearchBar: React.FunctionComponent = (props) => {
    const {website, setWebsite} = useContext(WebsiteContext)
    const {template} = useContext(TemplateContext)
    const {videoQuality} = useContext(VideoQualityContext)
    const {type, setType} = useContext(TypeContext)
    const {language, setLanguage} = useContext(LanguageContext)
    const {format, setFormat} = useContext(FormatContext)
    const {quality, setQuality} = useContext(QualityContext)
    const {englishDialect} = useContext(EnglishDialectContext)
    const {spanishDialect} = useContext(SpanishDialectContext)
    const {portugeuseDialect} = useContext(PortugeuseDialectContext)
    const {codec} = useContext(CodecContext)
    const {fontSize, setFontSize} = useContext(FontSizeContext)
    const {fontColor, setFontColor} = useContext(FontColorContext)
    const {fontYPosition, setFontYPosition} = useContext(FontYPositionContext)
    const {trimIntro, setTrimIntro} = useContext(TrimIntroContext)
    const {checkboxMode, setCheckboxMode} = useContext(CheckboxModeContext)
    const {theme, setTheme} = useContext(ThemeContext)
    const [id, setID] = useState(1)
    const [directory, setDirectory] = useState("")
    const [folderHover, setFolderHover] = useState(false)
    const [searchHover, setSearchHover] = useState(false)
    const searchBoxRef = useRef(null) as React.RefObject<HTMLInputElement>
    const host = "www.crunchyroll.com"
    
    useEffect(() => {
        ipcRenderer.invoke("get-downloads-folder").then((f) => setDirectory(f))
        initSettings()
        const triggerPaste = () => {
            const text = clipboard.readText()
            searchBoxRef.current!.value += text
        }
        ipcRenderer.on("trigger-paste", triggerPaste)
        return () => {
            ipcRenderer.removeListener("trigger-paste", triggerPaste)
        }
    }, [])

    useEffect(() => {
        const downloadURL = (event: any, url: string, html: string) => {
            if (!url) return
            if (website === "crunchyroll") {
                downloadCrunchyroll(url, html)
            } else if (website === "hidive") {
                downloadHIDIVE(url, html)
            }
        }
        ipcRenderer.on("download-url", downloadURL)
        ipcRenderer.invoke("store-settings", {type, language, quality, format})
        return () => {
            ipcRenderer.removeListener("download-url", downloadURL)
        }
    })

    const initSettings = async () => {
        const settings = await ipcRenderer.invoke("init-settings")
        if (settings.type) setType(settings.type)
        if (settings.language) setLanguage(settings.language)
        if (settings.quality) setQuality(settings.quality)
        if (settings.format) setFormat(settings.format)
    }

    const changeDirectory = async () => {
        const dir = await ipcRenderer.invoke("select-directory")
        if (dir) setDirectory(dir)
    }

    const parseEpisode = async (url: string) => {
        const cookie = await ipcRenderer.invoke("get-cookie")
        const token = await ipcRenderer.invoke("get-token")
        if (/series/.test(url)) return null
        const id = url.match(/(?<=watch\/)(.*?)(?=\/)/)?.[0] ?? ""
        let dialect = functions.getDialect(language, englishDialect, spanishDialect, portugeuseDialect)
        let json = await fetch(`https://www.crunchyroll.com/content/v2/cms/objects/${id}?locale=${functions.dashLocale(dialect)}`, {headers: {cookie, host, Authorization: `Bearer ${token}`}}).then((r) => r.json())
        const meta = json.data[0]
        const episodeMeta = meta.episode_metadata
        const streamsUrl = `https://www.crunchyroll.com${meta.streams_link}`
        const streamsJSON = await fetch(streamsUrl, {headers: {cookie, host, Authorization: `Bearer ${token}`}}).then((r) => r.json())
        const episode = { 
            episode_number: episodeMeta.episode_number, duration: episodeMeta.duration_ms/1000, url, description: meta.description,
            name: meta.title, series_name: episodeMeta.series_title, collection_name: episodeMeta.season_title, screenshot_image: {large_url: meta.images.thumbnail[0][meta.images.thumbnail[0].length - 1].source}, bif_url: streamsJSON.meta.bifs[0],
            streams: streamsJSON}
        return episode
    }

    const parseEpisodes = async (url: string, html?: string) => {
        const cookie = await ipcRenderer.invoke("get-cookie")
        const token = await ipcRenderer.invoke("get-token")
        if (!html) html = await fetch(url, {headers: {cookie, Authorization: `Bearer ${token}`}}).then((r) => r.text())
        let urls = html?.match(/(?<=href="\/)watch\/(.*?)(?=")/gm) as string[]
        urls = functions.removeDuplicates(urls?.map((u: any) => `https://www.crunchyroll.com/${u}`))
        if (!urls?.length) {
            const episodesLink = await ipcRenderer.invoke("get-episodes-link")
            const episodesJSON = await fetch(episodesLink, {headers: {cookie, Authorization: `Bearer ${token}`}}).then((r) => r.json())
            const region = episodesLink.match(/(?<=\/v2\/)(.*?)(?=\/)/)?.[0]?.toLowerCase()
            urls = [] as string[]
            for (let i = 0; i < episodesJSON.items.length; i++) {
                const episode = episodesJSON.items[i]
                urls.push(`https://www.crunchyroll.com/${region !== "us" ? `${region}/` : ""}watch/${episode.id}/${episode.slug_title}`)
            }
            if (!urls?.length) return ipcRenderer.invoke("download-error", "search")
        }
        let episodes = await Promise.all(urls.map((u: any) => parseEpisode(u)))
        return episodes.filter((e) => e?.episode_number !== null)
               .sort((a: any, b: any) => Number(a?.episode_number) > Number(b?.episode_number) ? 1 : -1)
    }

    const parsePlaylist = async (episode: any, noSub?: boolean) => {
        const streams = episode.streams.data[0]
        let audioLang = type === "sub" ? "ja-JP" : functions.dashLocale(language)
        if (audioLang === "all") audioLang = "ja-JP"
        if (episode.streams.meta.audio_locale !== audioLang) {
            if (type === "sub") audioLang = "zh-CN"
            if (episode.streams.meta.audio_locale !== audioLang) return null
        }
        let dialect = functions.getDialect(language, englishDialect, spanishDialect, portugeuseDialect)
        let subLang = type === "dub" || noSub ? "" : functions.dashLocale(dialect)
        let stream = streams.drm_adaptive_dash[subLang].url
        if (!stream && language === "esLA") stream = streams.drm_adaptive_dash["es-ES"].url
        if (!stream && language === "ptBR") stream = streams.drm_adaptive_dash["pt-PT"].url
        if (!stream) stream = streams.drm_trailer_dash[subLang].url
        if (!stream) return null
        return stream
    }

    const parseSubtitles = async (info: {id: number, episode: any, dest: string, kind: string}, error?: boolean, noDL?: boolean, mp4Fix?: boolean) => {
        const meta = info.episode.streams.meta
        let subLang = functions.dashLocale(language)
        let subtitles = [] as string[]
        let subtitleNames = [] as string[]
        for (const [key, value] of Object.entries(meta.subtitles)) {
            if (subLang === "all") {
                subtitleNames.push(functions.dashLocale(key))
                const assStr = await fetch((value as any).url).then((r) => r.text())
                const edited = editAss(assStr, fontSize, fontColor, fontYPosition)
                const file = await ipcRenderer.invoke("download-ass", info, edited, ` ${functions.dashLocale(key)}`)
                subtitles.push(file)
            } else if (key === subLang) {
                subtitleNames.push(functions.dashLocale(key))
                const assStr = await fetch((value as any).url).then((r) => r.text())
                const edited = editAss(assStr, fontSize, fontColor, fontYPosition, mp4Fix)
                const file = await ipcRenderer.invoke("download-ass", info, edited)
                subtitles.push(file)
            }
        }
        if (!subtitles?.[0]) return error ? ipcRenderer.invoke("download-error", "search") : {subtitles, subtitleNames}
        if (!noDL) ipcRenderer.invoke("download-subtitles", {url: subtitles[0], noSkip: true, dest: info.dest, id: info.id, episode: info.episode, kind: info.kind, template, language})
        return {subtitles, subtitleNames}
    }

    const getDecryptionKey = async (stream: string) => {
        const mpd = await fetch(stream).then((r) => r.text())
        const pssh = mpd.match(/(?<=pssh>)(.*)(?=<\/)/)?.[0]!

        const assetID = stream.match(/(?<=assets\/p\/)(.*?)(?=_)/)?.[0]!
        const sessionID = new Date().getUTCMilliseconds().toString().padStart(3, "0") + process.hrtime.bigint().toString().slice(0, 13)
        const userID = await ipcRenderer.invoke("get-account-id")

        const auth = await fetch("https://pl.crunchyroll.com/drm/v1/auth", {method: "POST", body: JSON.stringify({"accounting_id": "crunchyroll", "asset_id": assetID, "session_id": sessionID, "user_id": userID})}).then((r) => r.json()) as any

        const keys = await getKeys(pssh, "https://lic.drmtoday.com/license-proxy-widevine/cenc/", {"dt-custom-data": auth.custom_data, "x-dt-auth-token": auth.token})
        return keys.length ? `${keys[1].key}` : ""
    }

    const getKind = () => {
        return `${functions.parseLocale(language)} ${type === "dub" ? "Dub" : "Sub"}`
    }

    const search = () => {
        let searchText = searchBoxRef.current?.value.trim() ?? ""
        searchBoxRef.current!.value = ""
        if (website === "crunchyroll") {
            return downloadCrunchyroll(searchText)
        } else if (website === "hidive") {
            return downloadHIDIVE(searchText)
        }
    }

    const searchCrunchyrollEpisodes = async (query: string, html?: string) => {
        let episodes = null as any
        let start = null as any
        let end = null as any
        if (/\d *- *\d/.test(query)) {
            let part = query.match(/(?<= )\d(.*?)(?=$)/)?.[0] ?? ""
            start = Number(part.split("-")[0]) - 1
            end = Number(part.split("-")[1])
            query = query.replace(part, "").trim()
        } else if (/ \d+/.test(query)) {
            start = Number(query.match(/ \d+/)?.[0]) - 1
            query = query.replace(String(start + 1), "").trim()
        }
        if (/crunchyroll.com/.test(query)) {
            episodes = await parseEpisodes(query, html)
        } else {
            const cookie = await ipcRenderer.invoke("get-cookie")
            const token = await ipcRenderer.invoke("get-token")
            const results = await fetch(`https://www.crunchyroll.com/content/v2/discover/search?q=${query}`, {headers: {cookie, Authorization: `Bearer ${token}`}}).then((r) => r.json())
            const show = results.data?.[0].items?.[0]
            if (show) {
                const url = `https://www.crunchyroll.com/series/${show.id}/${show.slug_title}`
                await ipcRenderer.invoke("capture-html", url)
                await functions.timeout(1500)
                const html = await ipcRenderer.invoke("get-html")
                episodes = await parseEpisodes(url, html)
            }
        }
        if (start !== null && end !== null) {
            episodes = episodes.slice(start, end)
        } else if (start !== null) {
            episodes = [episodes[start]]
        }
        return episodes
    }
      
    const downloadCrunchyroll = async (searchText: string, html?: string) => {
        if (!searchText) return
        let opts = {resolution: Number(quality), quality: videoQuality, language, template, codec} as any
        if (type === "sub") opts.preferSub = true
        if (type === "dub") {
            opts.preferSub = false
            opts.preferDub = true
        }
        if (format === "mp3") opts.audioOnly = true
        if (format === "m3u8") opts.skipConversion = true
        if (format === "png") opts.thumbnails = true
        if (format === "ass") opts.subtitles = true
        if (format === "mkv") opts.softSubs = true
        opts.kind = getKind()
        let episode = null as any
        if (/crunchyroll/.test(searchText)) episode = await parseEpisode(searchText)
        if (!episode) {
            let episodes = await searchCrunchyrollEpisodes(searchText, html) as any
            if (!episodes) return ipcRenderer.invoke("download-error", "search")
            let current = id
            let downloaded = false
            for (let i = 0; i < episodes.length; i++) {
                await functions.timeout(100)
                if (opts.subtitles) {
                    const subtitles = await parseSubtitles({id: current, episode: episodes[i], dest: directory.replace(/\\+/g, "/"), kind: opts.kind})
                    if (subtitles) downloaded = true
                } else if (opts.softSubs) {
                    const {subtitles, subtitleNames} = await parseSubtitles({id: current, episode: episodes[i], dest: directory.replace(/\\+/g, "/"), kind: opts.kind}, false, true)
                    const playlist = await parsePlaylist(episodes[i], true)
                    if (!playlist) continue
                    const decryptionKey = await getDecryptionKey(playlist)
                    downloaded = true
                    ipcRenderer.invoke("download", {id: current, episode: episodes[i], dest: directory.replace(/\\+/g, "/"), playlist, subtitles, subtitleNames, decryptionKey, ...opts})
                } else {
                    let {subtitles, subtitleNames} = await parseSubtitles({id: current, episode: episodes[i], dest: directory.replace(/\\+/g, "/"), kind: opts.kind}, false, true, true)
                    if (type === "dub" && language === "jaJP") {
                        subtitles = null
                        subtitleNames = null
                    }
                    const playlist = await parsePlaylist(episodes[i], true)
                    if (!playlist) continue
                    const decryptionKey = await getDecryptionKey(playlist)
                    downloaded = true
                    ipcRenderer.invoke("download", {id: current, episode: episodes[i], dest: directory.replace(/\\+/g, "/"), playlist, subtitles, subtitleNames, decryptionKey, ...opts})
                    }
                current += 1
                setID(prev => prev + 1)
            }
            if (!downloaded) return ipcRenderer.invoke("download-error", "search")
        } else {
            if (!episode.url) episode = await parseEpisode(episode)
            if (opts.subtitles) {
                setID((prev) => {
                    parseSubtitles({id: prev, episode, dest: directory.replace(/\\+/g, "/"), kind: opts.kind}, true)
                    return prev + 1
                })
            } else if (opts.softSubs) {
                    const {subtitles, subtitleNames} = await parseSubtitles({id: 0, episode, dest: directory.replace(/\\+/g, "/"), kind: opts.kind}, false, true)
                    const playlist = await parsePlaylist(episode, true)
                    if (!playlist) return ipcRenderer.invoke("download-error", "search")
                    const decryptionKey = await getDecryptionKey(playlist)
                    setID((prev) => {
                        ipcRenderer.invoke("download", {id: prev, episode, dest: directory.replace(/\\+/g, "/"), playlist, subtitles, subtitleNames, decryptionKey, ...opts})
                        return prev + 1
                    })
            } else {
                let {subtitles, subtitleNames} = await parseSubtitles({id: 0, episode: episode, dest: directory.replace(/\\+/g, "/"), kind: opts.kind}, false, true, true)
                if (type === "dub" && language === "jaJP") {
                    subtitles = null
                    subtitleNames = null
                }
                const playlist = await parsePlaylist(episode, true)
                if (!playlist) return ipcRenderer.invoke("download-error", "search")
                const decryptionKey = await getDecryptionKey(playlist)
                setID((prev) => {
                    ipcRenderer.invoke("download", {id: prev, episode, dest: directory.replace(/\\+/g, "/"), playlist, subtitles, subtitleNames, decryptionKey, ...opts})
                    return prev + 1
                })
            }
        }
    }
    
    const parseHIDIVEEpisode = async (url: string) => {
        const cookie = await ipcRenderer.invoke("get-hidive-cookie")
        const email = await ipcRenderer.invoke("get-hidive-email")
        const password = await ipcRenderer.invoke("get-hidive-password")
        if (!/stream/.test(url)) return null
        const html = await fetch(url, {headers: {cookie}}).then((r) => r.text())
        const id = html.match(/(?<=titleID": )(.*?)(?=,)/)?.[0]
        let episodeNumber = Number(html.match(/(?<=episodeNumber":")(.*?)(?=\.)/)?.[0])
        if (Number.isNaN(episodeNumber)) episodeNumber = 1
        const hidive = new HIDIVE()
        await hidive.init()
        await hidive.login(email, password)
        const response = await hidive.post("GetTitle", {Id: id})
        const title = response.Data.Title
        const ep = title.Episodes[episodeNumber - 1]
        const response2 = await hidive.post("GetVideos", {TitleId: id, VideoKey: ep.VideoKey})
        const vidInfo = response2.Data
        const episode = { 
            episode_number: episodeNumber, url, description: ep.Summary,
            name: ep.Name, series_name: title.Name, collection_name: `${title.Name} ${title.SeasonName}`, screenshot_image: {large_url: `https:${ep.ScreenShotSmallUrl}`}, bif_url: null,
            videos: vidInfo.VideoUrls, captions: vidInfo.CaptionVttUrls, fontColor: vidInfo.FontColorCode, fontSize: vidInfo.FontSize, css: vidInfo.CaptionCssUrl
        }
        return episode
    }
    
    const parseHIDIVEEpisodes = async (url: string, html?: string) => {
        const cookie = await ipcRenderer.invoke("get-hidive-cookie")
        if (!html) html = await fetch(url, {headers: {cookie}}).then((r) => r.text())
        let id = html?.match(/(?<=titleID&quot;: )(.*?)(?=,)/)?.[0]
        if (!id) id = html?.match(/(?<=titleID": )(.*?)(?=,)/)?.[0]
        const hidive = new HIDIVE()
        await hidive.init()
        const response = await hidive.post("GetTitle", {Id: id})
        const title = response.Data.Title
        const eps = title.Episodes
        let urls = [] as string[]
        for (let i = 0; i < eps.length; i++) {
            const url = `https://www.hidive.com/stream/${title.Name.toLowerCase().replace(/ +/g, "-").replace(/[^a-z0-9-]/gi, "")}/${eps[i].VideoKey}`
            urls.push(url)
        }
        let episodes = await Promise.all(urls.map((u: any) => parseHIDIVEEpisode(u)))
        return episodes.sort((a: any, b: any) => Number(a?.episode_number) > Number(b?.episode_number) ? 1 : -1)
    }
    
    const parseHIDIVEPlaylist = async (episode: any, noSub?: boolean) => {
        let audioLang = type === "sub" ? "Japanese" : functions.parseLocale(language)
        if (audioLang === "all") audioLang = "Japanese"
        let subLang = type === "dub" || noSub ? "" : functions.parseLocale(language)
        let stream = null as any
        for (const [key, value] of Object.entries(episode.videos)) {
            if (key.toLowerCase().includes(audioLang.toLowerCase())) {
                stream = (value as any).hls[0]
                break
            }
        }
        return stream
    }

    const parseHIDIVESubtitles = async (info: {id: number, episode: any, dest: string, kind: string}, error?: boolean, noDL?: boolean, ass?: boolean) => {
        let dialect = functions.getDialect(language, englishDialect, spanishDialect, portugeuseDialect)
        let subLang = functions.parseLocale(dialect, true)
        let subtitles = [] as string[]
        let subtitleNames = [] as string[]
        for (const [key, value] of Object.entries(info.episode.captions)) {
            if (language === "all") {
                subtitleNames.push(key.replace(" Subs", ""))
                if (ass) {
                    const vttStr = await fetch(value as any).then((r) => r.text())
                    const cssStr = info.episode.css ? await fetch(info.episode.css).then((r) => r.text()) : ""
                    const assStr = vtt(key.replace(" Subs", ""), fontSize, vttStr, cssStr, trimIntro ? 5 : 0, "Helvetica", fontColor, fontYPosition)
                    const file = await ipcRenderer.invoke("download-ass", info, assStr, ` ${key.replace(" Subs", "")}`)
                    subtitles.push(file)
                } else {
                    subtitles.push(value as any)
                }
            } else if (key.toLowerCase().includes(subLang.toLowerCase())) {
                subtitleNames.push(key.replace(" Subs", ""))
                if (ass) {
                    const vttStr = await fetch(value as any).then((r) => r.text())
                    const cssStr = info.episode.css ? await fetch(info.episode.css).then((r) => r.text()) : ""
                    const assStr = vtt(key.replace(" Subs", ""), fontSize, vttStr, cssStr, trimIntro ? 5 : 0, "Helvetica", fontColor, fontYPosition)
                    const file = await ipcRenderer.invoke("download-ass", info, assStr)
                    subtitles.push(file)
                } else {
                    subtitles.push(value as any)
                }
            }
        }
        if (!subtitles?.[0]) return error ? ipcRenderer.invoke("download-error", "search") : {subtitles, subtitleNames}
        if (!noDL) ipcRenderer.invoke("download-subtitles", {url: subtitles[0], vtt: format === "vtt", noSkip: ass, dest: info.dest, id: info.id, episode: info.episode, kind: info.kind, template, language})
        return {subtitles, subtitleNames}
    }

    const searchHIDIVEEpisodes = async (query: string, html?: string) => {
        let episodes = null as any
        let start = null as any
        let end = null as any
        if (/\d *- *\d/.test(query)) {
            let part = query.match(/(?<= )\d(.*?)(?=$)/)?.[0] ?? ""
            start = Number(part.split("-")[0]) - 1
            end = Number(part.split("-")[1])
            query = query.replace(part, "").trim()
        } else if (/ \d+/.test(query)) {
            start = Number(query.match(/ \d+/)?.[0]) - 1
            query = query.replace(String(start + 1), "").trim()
        }
        if (/hidive.com/.test(query)) {
            episodes = await parseHIDIVEEpisodes(query, html)
        } else {
            const hidive = new HIDIVE()
            await hidive.init()
            const response = await hidive.post("Search", {Query: query})
            const results = response.Data.TitleResults
            if (results.length) {
                const anime = `https://www.hidive.com/tv/${results[0].Name.toLowerCase().replace(/ +/g, "-").replace(/\W/g, "")}`
                episodes = await parseHIDIVEEpisodes(anime)
            }
        }
        if (start !== null && end !== null) {
            episodes = episodes.slice(start, end)
        } else if (start !== null) {
            episodes = [episodes[start]]
        }
        return episodes
    }

    const downloadHIDIVE = async (searchText: string, html?: string) => {
        if (!searchText) return
        const headers = ["Referer: https://www.hidive.com/"]
        let opts = {resolution: Number(quality), quality: videoQuality, language, template, codec, headers} as any
        if (trimIntro) opts.seek = 5
        if (type === "sub") opts.preferSub = true
        if (type === "dub") {
            opts.preferSub = false
            opts.preferDub = true
        }
        if (format === "mp3") opts.audioOnly = true
        if (format === "m3u8") opts.skipConversion = true
        if (format === "png") opts.thumbnails = true
        if (format === "ass") opts.subtitles = true
        if (format === "vtt") opts.subtitles = true
        if (format === "mkv") opts.softSubs = true
        opts.kind = getKind()
        let episode = null as any
        if (/hidive/.test(searchText)) episode = await parseHIDIVEEpisode(searchText)
        if (!episode) {
            let episodes = await searchHIDIVEEpisodes(searchText, html) as any
            if (!episodes) return ipcRenderer.invoke("download-error", "search")
            let current = id
            let downloaded = false
            for (let i = 0; i < episodes.length; i++) {
                await functions.timeout(100)
                if (opts.subtitles) {
                    const subtitles = await parseHIDIVESubtitles({id: current, episode: episodes[i], dest: directory.replace(/\\+/g, "/"), kind: opts.kind}, true, false, format === "ass")
                    if (subtitles) downloaded = true
                } else if (opts.softSubs) {
                    const {subtitles, subtitleNames} = await parseHIDIVESubtitles({id: current, episode: episodes[i], dest: directory.replace(/\\+/g, "/"), kind: opts.kind}, false, true, true)
                    const playlist = await parseHIDIVEPlaylist(episodes[i], true)
                    if (!playlist) continue
                    downloaded = true
                    ipcRenderer.invoke("download", {id: current, episode: episodes[i], dest: directory.replace(/\\+/g, "/"), playlist, subtitles, subtitleNames, ...opts})
                } else {
                    let {subtitles, subtitleNames} = await parseHIDIVESubtitles({id: current, episode: episodes[i], dest: directory.replace(/\\+/g, "/"), kind: opts.kind}, false, true, true)
                    if (type === "dub" && language === "jaJP") {
                        subtitles = null
                        subtitleNames = null
                    }
                    const playlist = await parseHIDIVEPlaylist(episodes[i])
                    if (!playlist) continue
                    downloaded = true
                    ipcRenderer.invoke("download", {id: current, episode: episodes[i], dest: directory.replace(/\\+/g, "/"), playlist, subtitles, subtitleNames, ...opts})
                    }
                current += 1
                setID(prev => prev + 1)
            }
            if (!downloaded) return ipcRenderer.invoke("download-error", "search")
        } else {
            if (!episode.url) episode = await parseHIDIVEEpisode(episode)
            if (opts.subtitles) {
                setID((prev) => {
                    parseHIDIVESubtitles({id: prev, episode, dest: directory.replace(/\\+/g, "/"), kind: opts.kind}, true, false, format === "ass")
                    return prev + 1
                })
            } else if (opts.softSubs) {
                    const {subtitles, subtitleNames} = await parseHIDIVESubtitles({id: 0, episode, dest: directory.replace(/\\+/g, "/"), kind: opts.kind}, false, true, true)
                    const playlist = await parseHIDIVEPlaylist(episode, true)
                    if (!playlist) return ipcRenderer.invoke("download-error", "search")
                    setID((prev) => {
                        ipcRenderer.invoke("download", {id: prev, episode, dest: directory.replace(/\\+/g, "/"), playlist, subtitles, subtitleNames, ...opts})
                        return prev + 1
                    })
            } else {
                let {subtitles, subtitleNames} = await parseHIDIVESubtitles({id: 0, episode, dest: directory.replace(/\\+/g, "/"), kind: opts.kind}, false, true, true)
                if (type === "dub" && language === "jaJP") {
                    subtitles = null
                    subtitleNames = null
                }
                const playlist = await parseHIDIVEPlaylist(episode)
                if (!playlist) return ipcRenderer.invoke("download-error", "search")
                setID((prev) => {
                    ipcRenderer.invoke("download", {id: prev, episode, dest: directory.replace(/\\+/g, "/"), playlist, subtitles, subtitleNames, ...opts})
                    return prev + 1
                })
            }
        }
    }

    const enterSearch = (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter") search()
    }

    useEffect(() => {
        if (language === "all") {
            if (format !== "mkv") setLanguage("enUS")
        }
        if (website === "crunchyroll") {
            if (format === "vtt") setFormat("ass")
        }
        if (website === "hidive") {
            if (format === "png") setFormat("mp4")
        }
        if (checkboxMode) {
            if (quality === "360" || quality === "240") setQuality("480")
        }
    }, [type, language, format, website, checkboxMode, quality])

    const getSearchPlaceholder = () => {
        if (website === "crunchyroll") {
            return "Crunchyroll link or anime name..."
        } else if (website === "hidive") {
            return "HIDIVE link or anime name..."
        }
    }

    const getSearchButton = () => {
        if (website === "crunchyroll") {
            return searchHover ? searchButtonHoverCR : searchButtonCR
        } else if (website === "hidive") {
            return searchHover ? searchButtonHoverHI : searchButtonHI
        }
    }

    const getFolderButton = () => {
        if (website === "crunchyroll") {
            return folderHover ? folderButtonHoverCR : folderButtonCR
        } else if (website === "hidive") {
            return folderHover ? folderButtonHoverHI : folderButtonHI
        }
    }

    const checkboxClass = () => {
        if (website === "crunchyroll") {
            return theme === "light" ? "dropdown-checkbox" : "dropdown-checkbox-dark"
        } else if (website === "hidive") {
            return theme === "light" ? "dropdown-checkbox-blue" : "dropdown-checkbox-dark-blue"
        }
    }

    const processCheckbox = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value 
        if (value === "sub") setType("sub")
        if (value === "dub") setType("dub")
        if (value === "mp4") setFormat("mp4")
        if (value === "mp3") setFormat("mp3")
        if (value === "m3u8") setFormat("m3u8")
        if (value === "png") setFormat("png")
        if (value === "ass") setFormat("ass")
        if (value === "vtt") setFormat("vtt")
        if (value === "1080") setQuality("1080")
        if (value === "720") setQuality("720")
        if (value === "480") setQuality("480")
    }

    return (
        <section className="search-container">
            <div className="search-location">
                <div className="search-bar">
                    <input className="search-box" type="search" ref={searchBoxRef} spellCheck="false" placeholder={getSearchPlaceholder()} onKeyDown={enterSearch}/>
                    <button className="search-button" type="submit" id="submit" onClick={search}>
                        <img className="search-button-img" src={getSearchButton()} onMouseEnter={() => setSearchHover(true)} onMouseLeave={() => setSearchHover(false)}/>
                    </button>
                </div>
            </div>
            <ErrorMessage/>
            <div className="download-location" onKeyDown={enterSearch}>
                <img className="download-location-img" width="25" height="25" src={getFolderButton()} onMouseEnter={() => setFolderHover(true)} onMouseLeave={() => setFolderHover(false)} onClick={changeDirectory}/>
                <p><span className="download-location-text" onDoubleClick={() => shell.openPath(directory)}>{directory}</span></p>
            </div>
            {checkboxMode ?
            <div className="dropdown-options">
                <div className="dropdown-checkbox-container">
                    <input className={checkboxClass()} type="checkbox" checked={type === "sub"} value="sub" onChange={processCheckbox}/>
                    <label className="dropdown-label" onClick={() => setType("sub")}>sub</label>
                </div>
                <div className="dropdown-checkbox-container">
                    <input className={checkboxClass()} type="checkbox" checked={type === "dub"} value="dub" onChange={processCheckbox}/>
                    <label className="dropdown-label" onClick={() => setType("dub")}>dub</label>
                </div>
                <div className="dropdown-checkbox-container">
                    <input className={checkboxClass()} type="checkbox" checked={format === "mp4"} value="mp4" onChange={processCheckbox}/>
                    <label className="dropdown-label" onClick={() => setFormat("mp4")}>mp4</label>
                </div>
                <div className="dropdown-checkbox-container">
                    <input className={checkboxClass()} type="checkbox" checked={format === "mp3"} value="mp3" onChange={processCheckbox}/>
                    <label className="dropdown-label" onClick={() => setFormat("mp3")}>mp3</label>
                </div>
                <div className="dropdown-checkbox-container">
                    <input className={checkboxClass()} type="checkbox" checked={format === "m3u8"} value="m3u8" onChange={processCheckbox}/>
                    <label className="dropdown-label" onClick={() => setFormat("m3u8")}>m3u8</label>
                </div>
                <div className="dropdown-checkbox-container">
                    <input className={checkboxClass()} type="checkbox" checked={format === "ass"} value="ass" onChange={processCheckbox}/>
                    <label className="dropdown-label" onClick={() => setFormat("ass")}>ass</label>
                </div>
                {website === "crunchyroll" ?
                <div className="dropdown-checkbox-container">
                    <input className={checkboxClass()} type="checkbox" checked={format === "png"} value="png" onChange={processCheckbox}/>
                    <label className="dropdown-label" onClick={() => setFormat("png")}>png</label>
                </div> : null}
                {website === "hidive" ?
                <div className="dropdown-checkbox-container">
                    <input className={checkboxClass()} type="checkbox" checked={format === "vtt"} value="vtt" onChange={processCheckbox}/>
                    <label className="dropdown-label" onClick={() => setFormat("vtt")}>vtt</label>
                </div> : null}
                <div className="dropdown-checkbox-container">
                    <input className={checkboxClass()} type="checkbox" checked={quality === "1080"} value="1080" onChange={processCheckbox}/>
                    <label className="dropdown-label" onClick={() => setQuality("1080")}>1080p</label>
                </div>
                <div className="dropdown-checkbox-container">
                    <input className={checkboxClass()} type="checkbox" checked={quality === "720"} value="720" onChange={processCheckbox}/>
                    <label className="dropdown-label" onClick={() => setQuality("720")}>720p</label>
                </div>
                <div className="dropdown-checkbox-container">
                    <input className={checkboxClass()} type="checkbox" checked={quality === "480"} value="480" onChange={processCheckbox}/>
                    <label className="dropdown-label" onClick={() => setQuality("480")}>480p</label>
                </div>
            </div> :
            <div className="dropdown-options">
                <div className="dropdown-container">
                    <p className="dropdown-label">Type: </p>
                    <DropdownButton title={type} drop="down">
                        <Dropdown.Item active={type === "sub"} onClick={() => {setType("sub"); if (language === "jaJP") setLanguage("enUS")}}>sub</Dropdown.Item>
                        <Dropdown.Item active={type === "dub"} onClick={() => {setType("dub"); if (format === "ass") setFormat("mp4"); if (language === "all") setLanguage("enUS")}}>dub</Dropdown.Item>
                    </DropdownButton>
                </div>
                <div className="dropdown-container">
                    <p className="dropdown-label">Language: </p>
                    <DropdownButton title={functions.parseLocale(language)} drop="down">
                        {type === "sub" && format === "mkv" ? <Dropdown.Item active={language === "all"} onClick={() => setLanguage("all")}>All</Dropdown.Item> : null}
                        {type === "dub" ? <Dropdown.Item active={language === "jaJP"} onClick={() => setLanguage("jaJP")}>Japanese</Dropdown.Item> : null}
                        <Dropdown.Item active={language === "enUS"} onClick={() => setLanguage("enUS")}>English</Dropdown.Item>
                        <Dropdown.Item active={language === "esLA"} onClick={() => setLanguage("esLA")}>Spanish</Dropdown.Item>
                        <Dropdown.Item active={language === "frFR"} onClick={() => setLanguage("frFR")}>French</Dropdown.Item>
                        <Dropdown.Item active={language === "itIT"} onClick={() => setLanguage("itIT")}>Italian</Dropdown.Item>
                        <Dropdown.Item active={language === "deDE"} onClick={() => setLanguage("deDE")}>German</Dropdown.Item>
                        <Dropdown.Item active={language === "ruRU"} onClick={() => setLanguage("ruRU")}>Russian</Dropdown.Item>
                        <Dropdown.Item active={language === "ptBR"} onClick={() => setLanguage("ptBR")}>Portuguese</Dropdown.Item>
                        <Dropdown.Item active={language === "arME"} onClick={() => setLanguage("arME")}>Arabic</Dropdown.Item>
                    </DropdownButton>
                </div>
                <div className="dropdown-container">
                    <p className="dropdown-label">Format: </p>
                    <DropdownButton title={format} drop="down">
                        <Dropdown.Item active={format === "mp4"} onClick={() => setFormat("mp4")}>mp4</Dropdown.Item>
                        <Dropdown.Item active={format === "mkv"} onClick={() => setFormat("mkv")}>mkv</Dropdown.Item>
                        <Dropdown.Item active={format === "mp3"} onClick={() => setFormat("mp3")}>mp3</Dropdown.Item>
                        <Dropdown.Item active={format === "m3u8"} onClick={() => setFormat("m3u8")}>m3u8</Dropdown.Item>
                        {type === "sub" ? <Dropdown.Item active={format === "ass"} onClick={() => setFormat("ass")}>ass</Dropdown.Item> : null}
                        {type === "sub" && website === "hidive" ? <Dropdown.Item active={format === "vtt"} onClick={() => setFormat("vtt")}>vtt</Dropdown.Item> : null}
                        {website === "crunchyroll" ? <Dropdown.Item active={format === "png"} onClick={() => setFormat("png")}>png</Dropdown.Item> : null}
                    </DropdownButton>
                </div>
                <div className="dropdown-container">
                    <p className="dropdown-label">Quality: </p>
                    <DropdownButton title={`${quality}p`} drop="down">
                        <Dropdown.Item active={quality === "1080"} onClick={() => setQuality("1080")}>1080p</Dropdown.Item>
                        <Dropdown.Item active={quality === "720"} onClick={() => setQuality("720")}>720p</Dropdown.Item>
                        <Dropdown.Item active={quality === "480"} onClick={() => setQuality("480")}>480p</Dropdown.Item>
                        <Dropdown.Item active={quality === "360"} onClick={() => setQuality("360")}>360p</Dropdown.Item>
                        <Dropdown.Item active={quality === "240"} onClick={() => setQuality("240")}>240p</Dropdown.Item>
                    </DropdownButton>
                </div>
            </div>}
        </section>
    )
}

export default SearchBar