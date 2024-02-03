import {ipcRenderer} from "electron"
import React, {useContext, useEffect, useState} from "react"
import {Dropdown, DropdownButton} from "react-bootstrap"
import {WebsiteContext} from "../renderer"
import {TemplateContext, VideoQualityContext, TypeContext, LanguageContext, QualityContext, CodecContext,
FormatContext, QueueContext, EnglishDialectContext, SpanishDialectContext, PortugeuseDialectContext} from "../renderer"
import "../styles/advancedsettings.less"

const AdvancedSettings: React.FunctionComponent = (props) => {
    const {website, setWebsite} = useContext(WebsiteContext)
    const {template, setTemplate} = useContext(TemplateContext)
    const {videoQuality, setVideoQuality} = useContext(VideoQualityContext)
    const [visible, setVisible] = useState(false)
    const {type, setType} = useContext(TypeContext)
    const {language, setLanguage} = useContext(LanguageContext)
    const {format, setFormat} = useContext(FormatContext)
    const {quality, setQuality} = useContext(QualityContext)
    const {codec, setCodec} = useContext(CodecContext)
    const {queue, setQueue} = useContext(QueueContext)
    const {englishDialect, setEnglishDialect} = useContext(EnglishDialectContext)
    const {spanishDialect, setSpanishDialect} = useContext(SpanishDialectContext)
    const {portugeuseDialect, setPortugeuseDialect} = useContext(PortugeuseDialectContext)
    const [cookieDeleted, setCookieDeleted] = useState(false)

    useEffect(() => {
        const showSettingsDialog = (event: any, update: any) => {
            setVisible((prev) => !prev)
        }
        const closeAllDialogs = (event: any, ignore: any) => {
            if (ignore !== "settings") setVisible(false)
        }
        ipcRenderer.on("show-settings-dialog", showSettingsDialog)
        ipcRenderer.on("close-all-dialogs", closeAllDialogs)
        initSettings()
        return () => {
            ipcRenderer.removeListener("show-settings-dialog", showSettingsDialog)
            ipcRenderer.removeListener("close-all-dialogs", closeAllDialogs)
        }
    }, [])

    const initSettings = async () => {
        const settings = await ipcRenderer.invoke("init-settings")
        if (settings.videoQuality) setVideoQuality(settings.videoQuality)
        if (settings.template) setTemplate(settings.template)
        if (settings.queue) setQueue(settings.queue)
        if (settings.englishDialect) setEnglishDialect(settings.englishDialect)
        if (settings.spanishDialect) setSpanishDialect(settings.spanishDialect)
        if (settings.portugeuseDialect) setPortugeuseDialect(settings.portugeuseDialect)
        if (settings.codec) setCodec(settings.codec)
    }

    useEffect(() => {
        ipcRenderer.invoke("store-settings", {template, videoQuality, codec, queue, englishDialect, spanishDialect, portugeuseDialect})
    })

    const ok = () => {
        setVisible(false)
    }

    const revert = () => {
        setVideoQuality(23)
        setCodec("copy")
        setTemplate("{seasonTitle} {episodeNumber}")
        setType("sub")
        setLanguage("enUS")
        setFormat("mp4")
        setQuality("1080")
        setQueue(12)
        setEnglishDialect("US")
        setSpanishDialect("LA")
        setPortugeuseDialect("BR")
    }

    const changeTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value
        setTemplate(value)
    }

    const changeVideoQuality = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value
        if (value.includes(".")) return
        if (value.length > 2) return
        if (Number.isNaN(Number(value))) return
        if (Number(value) > 51) value = "51"
        setVideoQuality(value)
    }

    const changeVideoQualityKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowUp") {
            setVideoQuality((prev: any) => {
                if (Number(prev) + 1 > 51) return Number(prev)
                return Number(prev) + 1
            })
        } else if (event.key === "ArrowDown") {
            setVideoQuality((prev: any) => {
                if (Number(prev) - 1 < 0) return Number(prev)
                return Number(prev) - 1
            })
        }
    }

    const changeQueue = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value
        if (value.includes(".")) return
        if (value.length > 3) return
        if (Number.isNaN(Number(value))) return
        setQueue(value)
        ipcRenderer.invoke("update-concurrency", Number(value))
    }

    const changeQueueKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        let value = queue
        if (event.key === "ArrowUp") {
            setQueue((prev: any) => {
                if (Number(prev) + 1 > 999) return Number(prev)
                value = Number(prev) + 1
                return value
            })
        } else if (event.key === "ArrowDown") {
            setQueue((prev: any) => {
                if (Number(prev) - 1 < 1) return Number(prev)
                value = Number(prev) - 1
                return value
            })
        }
        ipcRenderer.invoke("update-concurrency", Number(value))
    }

    const deleteCookie = () => {
        ipcRenderer.invoke("delete-cookies")
        setCookieDeleted(true)
        setTimeout(() => {setCookieDeleted(false)}, 2000)
    }

    const getCodec = () => {
        if (codec === "copy") return "No Re-Encoding"
        return String(codec).toUpperCase()
    }

    if (visible) {
        return (
            <section className="settings-dialog">
                <div className="settings-dialog-box">
                    <div className="settings-container">
                        <div className="settings-title-container">
                            <p className="settings-title">Advanced Settings</p>
                        </div>
                        <div className="settings-row-container">
                            <div className="settings-row">
                                <p className="settings-text">Output: </p>
                                <input className="settings-input wide" type="text" spellCheck="false" value={template} onChange={changeTemplate}/>
                            </div>
                            <div className="settings-row">
                                <p className="settings-text">Concurrent Downloads: </p>
                                <input className="settings-input" type="text" spellCheck="false" value={queue} onChange={changeQueue} onKeyDown={changeQueueKey}/>
                            </div>
                            <div className="settings-row">
                                <p className="settings-text">Video Quality: </p>
                                <input className="settings-input" type="text" spellCheck="false" value={videoQuality} onChange={changeVideoQuality} onKeyDown={changeVideoQualityKey}/>
                            </div>
                            <div className="settings-row">
                                <p className="settings-text">Video Codec: </p>
                                <DropdownButton className="small-drop" title={getCodec()} drop="down">
                                    <Dropdown.Item className="small-drop" active={codec === "copy"} onClick={() => setCodec("copy")}>No Re-Encoding</Dropdown.Item>
                                    <Dropdown.Item className="small-drop" active={codec === "h.264"} onClick={() => setCodec("h.264")}>H.264</Dropdown.Item>
                                    <Dropdown.Item className="small-drop" active={codec === "h.265"} onClick={() => setCodec("h.265")}>H.265</Dropdown.Item>
                                    <Dropdown.Item className="small-drop" active={codec === "vp8"} onClick={() => setCodec("vp8")}>VP8</Dropdown.Item>
                                    <Dropdown.Item className="small-drop" active={codec === "vp9"} onClick={() => setCodec("vp9")}>VP9</Dropdown.Item>
                                </DropdownButton>
                            </div>
                            {website === "crunchyroll" ? <>
                            <div className="settings-row">
                                <p className="settings-text">English Dialect: </p>
                                <DropdownButton className="small-drop" title={englishDialect} drop="down">
                                    <Dropdown.Item className="small-drop" active={englishDialect === "US"} onClick={() => setEnglishDialect("US")}>US</Dropdown.Item>
                                    <Dropdown.Item className="small-drop" active={englishDialect === "UK"} onClick={() => setEnglishDialect("UK")}>UK</Dropdown.Item>
                                </DropdownButton>
                            </div>
                            <div className="settings-row">
                                <p className="settings-text">Spanish Dialect: </p>
                                <DropdownButton className="small-drop" title={spanishDialect} drop="down">
                                    <Dropdown.Item className="small-drop" active={spanishDialect === "LA"} onClick={() => setSpanishDialect("LA")}>LA</Dropdown.Item>
                                    <Dropdown.Item className="small-drop" active={spanishDialect === "ES"} onClick={() => setSpanishDialect("ES")}>ES</Dropdown.Item>
                                </DropdownButton>
                            </div>
                            <div className="settings-row">
                                <p className="settings-text">Portugeuse Dialect: </p>
                                <DropdownButton className="small-drop" title={portugeuseDialect} drop="down">
                                    <Dropdown.Item className="small-drop" active={portugeuseDialect === "BR"} onClick={() => setPortugeuseDialect("BR")}>BR</Dropdown.Item>
                                    <Dropdown.Item className="small-drop" active={portugeuseDialect === "PT"} onClick={() => setPortugeuseDialect("PT")}>PT</Dropdown.Item>
                                </DropdownButton>
                            </div></> : null}
                            <div className="settings-row">
                                <button onClick={deleteCookie} className="cookie-button">Delete Cookies</button>
                                {cookieDeleted ? <p className="cookie-text">Deleted!</p> : null}
                            </div>
                        </div>
                        <div className="settings-button-container">
                         <button onClick={revert} className="revert-button">Revert</button>
                            <button onClick={ok} className="ok-button">Ok</button>
                        </div>
                    </div>
                </div>
            </section>
        )
    }
    return null
}

export default AdvancedSettings