import {ipcRenderer, clipboard} from "electron"
import {shell} from "@electron/remote"
import React, {useState, useEffect, useRef, useContext} from "react"
import {Dropdown, DropdownButton} from "react-bootstrap"
import folderButton from "../assets/folderButton.png"
import searchButton from "../assets/searchButton.png"
import ErrorMessage from "./ErrorMessage"
import folderButtonHover from "../assets/folderButton-hover.png"
import searchButtonHover from "../assets/searchButton-hover.png"
import "../styles/searchbar.less"
import {CrunchyrollEpisode} from "crunchyroll.ts"
import functions from "../structures/functions"
import {TypeContext, QualityContext, CodecContext, FormatContext, LanguageContext, TemplateContext, VideoQualityContext, EnglishDialectContext, SpanishDialectContext, PortugeuseDialectContext} from "../renderer"

const SearchBar: React.FunctionComponent = (props) => {
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
            if (url) download(url, html)
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
        if (url.endsWith("/")) url = url.slice(0, -1)
        const html = await fetch(functions.skipWall(url), {headers: {cookie}}).then((r) => r.text())
        let vilos = null
        try {
            vilos = JSON.parse(html.match(/(?<=vilos.config.media = )(.*)}(?=;)/)?.[0]!)
        } catch {
            return parseEpisodeBeta(url)
        }
        let seasonTitle = functions.epRegex(html)
        const seriesTitle = html.match(/(?<=type="application\/rss\+xml" title=")(.*?)(?= Episodes)/)?.[0]
        if (!seasonTitle) seasonTitle = seriesTitle
        const episode = {...vilos.metadata, url, name: vilos.metadata.title, series_name: seriesTitle, collection_name: seasonTitle, screenshot_image: {large_url: vilos.thumbnail.url}, bif_url: vilos.preview.src}
        return episode
    }

    const parseEpisodeBeta = async (url: string) => {
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
        if (url.includes("episode")) {
            let episode = await parseEpisode(url)
            return [episode]
        }
        const cookie = await ipcRenderer.invoke("get-cookie")
        if (url.endsWith("/")) url = url.slice(0, -1)
        if (!html) html = await fetch(functions.skipWall(url), {headers: {cookie}}).then((r) => r.text())
        let urls = html?.match(/(episode)(.*?)(?=" title)/gm) as any
        if (!urls) return ipcRenderer.invoke("download-error", "search")
        urls = urls.map((u: any) => `${url}/${u}`)
        for (let i = 0; i < urls.length; i++) {
            let response = await fetch(urls[i], {headers: {cookie}})
            if (!response.ok) {
                let bit = urls[i]?.match(/(episode)(.*?)(?=\/)/gm)?.[0]
                urls[i] = `${url}/${bit}`
            }
        }
        let episodes = await Promise.all(urls.map((u: any) => parseEpisode(u)))
        return episodes.sort((a: any, b: any) => Number(a?.episode_number) > Number(b?.episode_number) ? 1 : -1)
    }

    const parseEpisodesBeta = async (url: string, html?: string) => {
        const cookie = await ipcRenderer.invoke("get-cookie")
        if (!html) html = await fetch(url, {headers: {cookie}}).then((r) => r.text())
        let urls = html?.match(/(?<=href="\/)watch\/(.*?)(?=")/gm) as string[]
        urls = functions.removeDuplicates(urls?.map((u: any) => `https://crunchyroll.com/${u}`))
        if (!urls?.length) {
            const episodesLink = await ipcRenderer.invoke("get-episodes-link")
            const episodesJSON = await fetch(episodesLink, {headers: {cookie}}).then((r) => r.json())
            const region = episodesLink.match(/(?<=\/v2\/)(.*?)(?=\/)/)?.[0]?.toLowerCase()
            urls = [] as string[]
            for (let i = 0; i < episodesJSON.items.length; i++) {
                const episode = episodesJSON.items[i]
                urls.push(`https://crunchyroll.com/${region !== "us" ? `${region}/` : ""}watch/${episode.id}/${episode.slug_title}`)
            }
            if (!urls?.length) return ipcRenderer.invoke("download-error", "search")
        }
        let episodes = await Promise.all(urls.map((u: any) => parseEpisodeBeta(u)))
        return episodes.sort((a: any, b: any) => Number(a?.episode_number) > Number(b?.episode_number) ? 1 : -1)
    }

    const parsePlaylist = async (url: string, noSub?: boolean) => {
        const cookie = await ipcRenderer.invoke("get-cookie")
        if (url.endsWith("/")) url = url.slice(0, -1)
        const html = await fetch(functions.skipWall(url), {headers: {cookie}}).then((r) => r.text())
        let vilos = null
        try {
            vilos = JSON.parse(html.match(/(?<=vilos.config.media = )(.*)}(?=;)/)?.[0] ?? "")
        } catch {
            return parsePlaylistBeta(url, noSub)
        }
        const hls = vilos?.streams.filter((s: any) => s.format === "adaptive_hls" || s.format === "trailer_hls")
        let audioLang = type === "sub" ? "jaJP" : language
        if (audioLang === "all") audioLang = "jaJP"
        let dialect = functions.getDialect(language, englishDialect, spanishDialect, portugeuseDialect)
        let subLang = type === "dub" || noSub ? null : dialect
        let stream = hls?.find((s: any) => s.audio_lang === audioLang && s.hardsub_lang === subLang)
        if (!stream && language === "esLA") stream = hls?.find((s: any) => s.audio_lang === "esES" && s.hardsub_lang === subLang)
        if (!stream && language === "ptBR") stream = hls?.find((s: any) => s.audio_lang === "ptPT" && s.hardsub_lang === subLang)
        if (!stream) return null
        return stream.url
    }

    const parsePlaylistBeta = async (episode: any, noSub?: boolean) => {
        const streams = episode.streams.data[0]
        let audioLang = type === "sub" ? "ja-JP" : functions.dashLocale(language)
        if (audioLang === "all") audioLang = "ja-JP"
        if (episode.streams.meta.audio_locale !== audioLang) {
            if (type === "sub") audioLang = "zh-CN"
            if (episode.streams.meta.audio_locale !== audioLang) return null
        }
        let dialect = functions.getDialect(language, englishDialect, spanishDialect, portugeuseDialect)
        let subLang = type === "dub" || noSub ? "" : functions.dashLocale(dialect)
        let stream = streams.drm_adaptive_hls[subLang].url
        if (!stream && language === "esLA") stream = streams.drm_adaptive_hls["es-ES"].url
        if (!stream && language === "ptBR") stream = streams.drm_adaptive_hls["pt-PT"].url
        if (!stream) stream = streams.drm_trailer_hls[subLang].url
        if (!stream) return null
        return stream
    }

    const parseSubtitles = async (info: {id: number, episode: CrunchyrollEpisode, dest: string, kind: string}, error?: boolean, noDL?: boolean) => {
        const cookie = await ipcRenderer.invoke("get-cookie")
        const html = await fetch(info.episode.url, {headers: {cookie}}).then((r) => r.text())
        let vilos = null
        try {
            vilos = JSON.parse(html.match(/(?<=vilos.config.media = )(.*)}(?=;)/)?.[0] ?? "")
        } catch {
            return parseSubtitlesBeta(info, error, noDL)
        }
        let dialect = functions.getDialect(language, englishDialect, spanishDialect, portugeuseDialect)
        let subtitles = language === "all" ? vilos?.subtitles : vilos?.subtitles.filter((s: any) => s.language === dialect)
        if (!subtitles && language === "esLA") subtitles = vilos?.subtitles.filter((s: any) => s.language === "esES")
        if (!subtitles && language === "ptBR") subtitles = vilos?.subtitles.filter((s: any) => s.language === "ptPT")
        if (!subtitles?.[0]) return error ? ipcRenderer.invoke("download-error", "search") : null
        if (!noDL) ipcRenderer.invoke("download-subtitles", {url: subtitles[0].url, dest: info.dest, id: info.id, episode: info.episode, kind: info.kind, template, language})
        return language === "all" ? {subtitles: subtitles?.map((s: any) => s.url), subtitleNames: subtitles?.map((s: any) => functions.parseLocale(s.language))} : {subtitles: [subtitles?.[0].url], subtitleNames: [functions.parseLocale(subtitles?.[0].language)]}
    }

    const parseSubtitlesBeta = async (info: {id: number, episode: any, dest: string, kind: string}, error?: boolean, noDL?: boolean) => {
        const meta = info.episode.streams.meta
        let subLang = functions.dashLocale(language)
        let subtitles = [] as string[]
        let subtitleNames = [] as string[]
        for (const [key, value] of Object.entries(meta.subtitles)) {
            if (subLang === "all") {
                subtitleNames.push(functions.dashLocale(key))
                subtitles.push((value as any).url)
            } else if (key === subLang) {
                subtitleNames.push(functions.dashLocale(key))
                subtitles.push((value as any).url)
            }
        }
        if (!subtitles?.[0]) return error ? ipcRenderer.invoke("download-error", "search") : {subtitles, subtitleNames}
        if (!noDL) ipcRenderer.invoke("download-subtitles", {url: subtitles[0], dest: info.dest, id: info.id, episode: info.episode, kind: info.kind, template, language})
        return {subtitles, subtitleNames}
    }

    const getKind = () => {
        return `${functions.parseLocale(language)} ${type === "dub" ? "Dub" : "Sub"}`
    }

    const search = () => {
        let searchText = searchBoxRef.current?.value.trim() ?? ""
        searchBoxRef.current!.value = ""
        return download(searchText)
    }
      
    const download = async (searchText: string, html?: string) => {
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
        let episode = await ipcRenderer.invoke("get-episode", searchText, opts)
        if (/crunchyroll/.test(searchText)) episode = await parseEpisodeBeta(searchText)
        if (!episode) {
            let episodes = await ipcRenderer.invoke("get-episodes", searchText, opts)
            if (!episodes) {
                if (/crunchyroll.com/.test(searchText)) {
                    let start = null as any
                    let end = null as any
                    if (/\d *- *\d/.test(searchText)) {
                        let part = searchText.match(/(?<= )\d(.*?)(?=$)/)?.[0] ?? ""
                        start = Number(part.split("-")[0]) - 1
                        end = Number(part.split("-")[1])
                        searchText = searchText.replace(part, "").trim()
                    } else if (/ \d+/.test(searchText)) {
                        start = Number(searchText.match(/ \d+/)?.[0]) - 1
                        searchText = searchText.replace(String(start + 1), "").trim()
                    }
                    episodes = await parseEpisodesBeta(searchText, html)
                    if (start !== null && end !== null) {
                        episodes = episodes.slice(start, end)
                    } else if (start !== null) {
                        episodes = [episodes[start]]
                    }
                } else {
                    return ipcRenderer.invoke("download-error", "search")
                }
            }
            let current = id
            let downloaded = false
            for (let i = 0; i < episodes.length; i++) {
                await functions.timeout(100)
                if (opts.subtitles) {
                    const subtitles = await parseSubtitlesBeta({id: current, episode: episodes[i], dest: directory.replace(/\\+/g, "/"), kind: opts.kind})
                    if (subtitles) downloaded = true
                } else if (opts.softSubs) {
                    const {subtitles, subtitleNames} = await parseSubtitlesBeta({id: current, episode: episodes[i], dest: directory.replace(/\\+/g, "/"), kind: opts.kind}, false, true)
                    const playlist = await parsePlaylistBeta(episodes[i], true)
                    if (!playlist || !subtitles) continue
                    downloaded = true
                    ipcRenderer.invoke("download", {id: current, episode: episodes[i], dest: directory.replace(/\\+/g, "/"), playlist, subtitles, subtitleNames, ...opts})
                } else {
                    const playlist = await parsePlaylistBeta(episodes[i])
                    if (!playlist) continue
                    downloaded = true
                    ipcRenderer.invoke("download", {id: current, episode: episodes[i], dest: directory.replace(/\\+/g, "/"), playlist, ...opts})
                    }
                current += 1
                setID(prev => prev + 1)
            }
            if (!downloaded) return ipcRenderer.invoke("download-error", "search")
        } else {
            if (!episode.url) episode = await parseEpisodeBeta(episode)
            if (opts.subtitles) {
                setID((prev) => {
                    parseSubtitlesBeta({id: prev, episode, dest: directory.replace(/\\+/g, "/"), kind: opts.kind}, true)
                    return prev + 1
                })
            } else if (opts.softSubs) {
                    const {subtitles, subtitleNames} = await parseSubtitlesBeta({id: 0, episode, dest: directory.replace(/\\+/g, "/"), kind: opts.kind}, false, true)
                    const playlist = await parsePlaylistBeta(episode, true)
                    if (!playlist) return ipcRenderer.invoke("download-error", "search")
                    setID((prev) => {
                        ipcRenderer.invoke("download", {id: prev, episode, dest: directory.replace(/\\+/g, "/"), playlist, subtitles, subtitleNames, ...opts})
                        return prev + 1
                    })
            } else {
                const playlist = await parsePlaylistBeta(episode)
                if (!playlist) return ipcRenderer.invoke("download-error", "search")
                setID((prev) => {
                    ipcRenderer.invoke("download", {id: prev, episode, dest: directory.replace(/\\+/g, "/"), playlist, ...opts})
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
    }, [type, language, format])

    return (
        <section className="search-container">
            <div className="search-location">
                <div className="search-bar">
                    <input className="search-box" type="search" ref={searchBoxRef} spellCheck="false" placeholder="Crunchyroll link or anime name..." onKeyDown={enterSearch}/>
                    <button className="search-button" type="submit" id="submit" onClick={search}>
                        <img className="search-button-img" src={searchHover ? searchButtonHover : searchButton} onMouseEnter={() => setSearchHover(true)} onMouseLeave={() => setSearchHover(false)}/>
                    </button>
                </div>
            </div>
            <ErrorMessage/>
            <div className="download-location" onKeyDown={enterSearch}>
                <img className="download-location-img" width="25" height="25" src={folderHover ? folderButtonHover : folderButton} onMouseEnter={() => setFolderHover(true)} onMouseLeave={() => setFolderHover(false)} onClick={changeDirectory}/>
                <p><span className="download-location-text" onDoubleClick={() => shell.openPath(directory)}>{directory}</span></p>
            </div>
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
                        <Dropdown.Item active={format === "png"} onClick={() => setFormat("png")}>png</Dropdown.Item>
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
            </div>
        </section>
    )
}

export default SearchBar