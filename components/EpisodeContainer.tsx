import {CrunchyrollEpisode, FFmpegProgress} from "../structures/types"
import {ipcRenderer} from "electron"
import {WebsiteContext} from "../renderer"
import {shell} from "@electron/remote"
import functions from "../structures/functions"
import React, {useState, useEffect, useRef, useReducer, useContext} from "react"
import {ProgressBar} from "react-bootstrap"
import mp4Label from "../assets/crunchyroll/mp4Label.png"
import mp3Label from "../assets/crunchyroll/mp3Label.png"
import m3u8Label from "../assets/crunchyroll/m3u8Label.png"
import pngLabel from "../assets/crunchyroll/pngLabel.png"
import assLabel from "../assets/crunchyroll/assLabel.png"
import vttLabel from "../assets/hidive/vttLabel.png"
import mkvLabel from "../assets/crunchyroll/mkvLabel.png"
import webmLabel from "../assets/crunchyroll/webmLabel.png"
import closeContainerCR from "../assets/crunchyroll/closeContainer.png"
import closeContainerHoverCR from "../assets/crunchyroll/closeContainer-hover.png"
import pauseButtonCR from "../assets/crunchyroll/pauseButton.png"
import pauseButtonHoverCR from "../assets/crunchyroll/pauseButton-hover.png"
import playButtonCR from "../assets/crunchyroll/playButton.png"
import playButtonHoverCR from "../assets/crunchyroll/playButton-hover.png"
import stopButtonCR from "../assets/crunchyroll/stopButton.png"
import stopButtonHoverCR from "../assets/crunchyroll/stopButton-hover.png"
import locationButtonCR from "../assets/crunchyroll/locationButton.png"
import locationButtonHoverCR from "../assets/crunchyroll/locationButton-hover.png"
import trashButtonCR from "../assets/crunchyroll/trashButton.png"
import trashButtonHoverCR from "../assets/crunchyroll/trashButton-hover.png"
import playVideoCR from "../assets/crunchyroll/playVideo.png"
import playVideoHoverCR from "../assets/crunchyroll/playVideo-hover.png"
import closeContainerHI from "../assets/hidive/closeContainer.png"
import closeContainerHoverHI from "../assets/hidive/closeContainer-hover.png"
import pauseButtonHI from "../assets/hidive/pauseButton.png"
import pauseButtonHoverHI from "../assets/hidive/pauseButton-hover.png"
import playButtonHI from "../assets/hidive/playButton.png"
import playButtonHoverHI from "../assets/hidive/playButton-hover.png"
import stopButtonHI from "../assets/hidive/stopButton.png"
import stopButtonHoverHI from "../assets/hidive/stopButton-hover.png"
import locationButtonHI from "../assets/hidive/locationButton.png"
import locationButtonHoverHI from "../assets/hidive/locationButton-hover.png"
import trashButtonHI from "../assets/hidive/trashButton.png"
import trashButtonHoverHI from "../assets/hidive/trashButton-hover.png"
import playVideoHI from "../assets/hidive/playVideo.png"
import playVideoHoverHI from "../assets/hidive/playVideo-hover.png"
import pSBC from "shade-blend-color"
import "../styles/episodecontainer.less"

export interface EpisodeContainerProps {
    id: number
    episode: CrunchyrollEpisode
    format: string
    progress: FFmpegProgress
    remove: (id: number) => void
    kind: string
}

const EpisodeContainer: React.FunctionComponent<EpisodeContainerProps> = (props: EpisodeContainerProps) => {
    const {website, setWebsite} = useContext(WebsiteContext)
    const [resolution, setResolution] = useState(0)
    const [paused, setPaused] = useState(false)
    const [deleted, setDeleted] = useState(false)
    const [stopped, setStopped] = useState(false)
    const [progress, setProgress] = useState(props.progress.percent) 
    const [time, setTime] = useState("")
    const [output, setOutput] = useState("")
    const [hover, setHover] = useState(false)
    const [hoverClose, setHoverClose] = useState(false)
    const [hoverPause, setHoverPause] = useState(false)
    const [hoverPlay, setHoverPlay] = useState(false)
    const [hoverStop, setHoverStop] = useState(false)
    const [hoverLocation, setHoverLocation] = useState(false)
    const [hoverTrash, setHoverTrash] = useState(false)
    const [hoverVideo, setHoverVideo] = useState(false)
    const [progressColor, setProgressColor] = useState("")
    const [backgroundColorCR, setBackgroundColorCR] = useState("")
    const [backgroundColorHI, setBackgroundColorHI] = useState("")
    const [clearSignal, setClearSignal] = useState(false)
    const [stopSignal, setStopSignal] = useState(false)
    const [deleteSignal, setDeleteSignal] = useState(false)
    const [skipped, setSkipped] = useState(false)
    const [started, setStarted] = useState(false) 
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const progressBarRef = useRef(null) as React.RefObject<HTMLDivElement>
    const episodeContainerRef = useRef(null) as React.RefObject<HTMLElement>
    
    useEffect(() => {
        const downloadProgress = (event: any, info: {id: number, progress: FFmpegProgress}) => {
            if (info.id === props.id) {
                if (resolution !== info.progress.resolution) setResolution(info.progress.resolution)
                setProgress(info.progress.percent)
                setTime(`${functions.formatMS(info.progress.time)} / ${functions.formatMS(info.progress.duration)}`)
            }
        }
        const downloadStarted = (event: any, info: {id: number, kind: string, episode: CrunchyrollEpisode, format: string}) => {
            if (info.id === props.id) {
                setStarted(true)
            }
        }
        const downloadEnded = (event: any, info: {id: number, output: string, skipped?: boolean}) => {
            if (info.id === props.id) {
                setOutput(info.output)
                if (info.skipped) setSkipped(true)
            }
        }
        const clearAll = () => {
            setClearSignal(true)
        }
        const stopAll = () => {
            setStopSignal(true)
        }
        const deleteAll = () => {
            setDeleteSignal(true)
        }
        ipcRenderer.on("download-progress", downloadProgress)
        ipcRenderer.on("download-started", downloadStarted)
        ipcRenderer.on("download-ended", downloadEnded)
        ipcRenderer.on("clear-all", clearAll)
        ipcRenderer.on("stop-all", stopAll)
        ipcRenderer.on("delete-all", deleteAll)
        ipcRenderer.on("update-color", forceUpdate)
        return () => {
            ipcRenderer.removeListener("download-progress", downloadProgress)
            ipcRenderer.removeListener("download-started", downloadStarted)
            ipcRenderer.removeListener("download-ended", downloadEnded)
            ipcRenderer.removeListener("clear-all", clearAll)
            ipcRenderer.removeListener("stop-all", stopAll)
            ipcRenderer.removeListener("delete-all", deleteAll)
            ipcRenderer.removeListener("update-color", forceUpdate)
        }
    }, [])

    useEffect(() => {
        updateProgressColor()
        updateBackgroundColor()
        if (clearSignal) {
            if (output || skipped) closeDownload()
            setClearSignal(false)
        }
        if (stopSignal) stopDownload()
        if (deleteSignal) deleteDownload()
    })

    const deleteDownload = async () => {
        if (deleted) return
        setDeleteSignal(false)
        ipcRenderer.invoke("move-queue")
        const success = await ipcRenderer.invoke("delete-download", props.id)
        if (success) setDeleted(true)
    }

    const closeDownload = async () => {
        ipcRenderer.invoke("move-queue", props.id)
        if (!output) ipcRenderer.invoke("delete-download", props.id)
        props.remove(props.id)
    }
    
    const stopDownload = async () => {
        if (stopped) return
        setStopSignal(false)
        ipcRenderer.invoke("move-queue")
        if (progress < 0 || progress >= 99) return
        const success = await ipcRenderer.invoke("stop-download", props.id)
        if (success) setStopped(true)
    }

    const handlePause = async () => {
        if (paused) {
            ipcRenderer.invoke("resume-download", props.id)
            setPaused(false)
        } else {
            ipcRenderer.invoke("pause-download", props.id)
            setPaused(true)
        }
    }

    const openLocation = async () => {
        ipcRenderer.invoke("open-location", output)
    }

    const prettyProgress = () => {
        let str = ""
        if (progress < 0 || progress > 100) {
            str = `${parseInt(String(progress))}%`
        }
        str = `${progress.toFixed(2)}%`
        return paused ? `${str} (Paused)` : str
    }

    const updateBackgroundColor = async () => {
        let colorsCR = ["#f6642c", "#f6432c", "#f62c55", "#2c79f6", "#f62c98", "#f62c4a", "#2c69f6"]
        let colorsHI = ["#2c48f6", "#322cf6", "#2c32f6", "#5310fe", "#1f93ff", "#1f64ff", "#2040ff"]
        const container = episodeContainerRef.current?.querySelector(".episode-container") as HTMLElement
        if (!container) return
        if (!backgroundColorCR) {
            const colorCR = colorsCR[Math.floor(Math.random() * colorsCR.length)]
            setBackgroundColorCR(colorCR)
        }
        if (!backgroundColorHI) {
            const colorHI = colorsHI[Math.floor(Math.random() * colorsHI.length)]
            setBackgroundColorHI(colorHI)
        }
        const theme = await ipcRenderer.invoke("get-theme")
        if (theme === "light") {
            const text = episodeContainerRef.current?.querySelectorAll(".ep-text, .ep-text-alt") as NodeListOf<HTMLElement>
            text.forEach((t) => {
                t.style.color = "black"
            })
            if (website === "crunchyroll") {
                container.style.backgroundColor = backgroundColorCR
                container.style.border = `2px solid ${pSBC(0.4, backgroundColorCR)}`
            } else if (website === "hidive") {
                container.style.backgroundColor = backgroundColorHI
                container.style.border = `2px solid ${pSBC(0.4, backgroundColorHI)}`
            }
        } else {
            const text = episodeContainerRef.current?.querySelectorAll(".ep-text, .ep-text-alt") as NodeListOf<HTMLElement>
            if (website === "crunchyroll") {
                text.forEach((t) => {
                    t.style.color = backgroundColorCR
                })
            } else if (website === "hidive") {
                text.forEach((t) => {
                    t.style.color = backgroundColorHI
                })
            }
            container.style.backgroundColor = "#090409"
            container.style.border = `2px solid #090409`
        }
    }

    const updateProgressColor = () => {
        let colors = ["#214dff", "#ff2ba7", "#ff2942", "#ff2994", "#c229ff", "#5b29ff", "#29b1ff", "#ff8d29"]
        if (website === "hidive") colors = ["#25aaff", "#4425ff", "#4425ff", "#0d7fff", "#282dff", "#30ccff", "#3136ff"]
        const progressBar = progressBarRef.current?.querySelector(".progress-bar") as HTMLElement
        if (progress < 0 && !output) {
             setProgressColor("#573dff")
        } else {
            if (progressColor === "#573dff") setProgressColor(colors[Math.floor(Math.random() * colors.length)])
            if (output) setProgressColor("#2bff64")
            if (skipped) setProgressColor("#ff40d9")
            if (stopped) setProgressColor("#ff2441")
            if (deleted) setProgressColor("#8c21ff")
        }
        progressBar.style.backgroundColor = progressColor
    }

    const generateProgressBar = () => {
        let jsx = <p className="ep-text-progress">{prettyProgress()}</p>
        let progressJSX = <ProgressBar ref={progressBarRef} animated now={progress}/>
        if (progress < 0 && !output) {
            jsx = <p className="ep-text-progress black">Waiting...</p>
            progressJSX = <ProgressBar ref={progressBarRef} animated now={100}/>
        } else {
            if (output) {
                jsx = <p className="ep-text-progress black">Finished</p>
                progressJSX = <ProgressBar ref={progressBarRef} animated now={100}/>
            }
            if (skipped) {
                jsx = <p className="ep-text-progress black">Skipped</p>
                progressJSX = <ProgressBar ref={progressBarRef} animated now={100}/>
            }
            if (stopped) {
                jsx = <p className="ep-text-progress black">Stopped</p>
                progressJSX = <ProgressBar ref={progressBarRef} animated now={100}/>
            }
            if (deleted) {
                jsx = <p className="ep-text-progress black">Deleted</p>
                progressJSX = <ProgressBar ref={progressBarRef} animated now={100}/>
            }
        }
        return (
            <>
            <div className="ep-text-progress-container">{jsx}</div>
            {progressJSX}
            </>
        )
    }

    const resolutionInfo = () => {
        return resolution ? `${props.kind} ${resolution}p` : props.kind
    }

    const mouseEnter = () => {
        if (website === "crunchyroll") {
            document.documentElement.style.setProperty("--selection-color", pSBC(0.5, backgroundColorCR))
        } else if (website === "hidive") {
            document.documentElement.style.setProperty("--selection-color", pSBC(0.5, backgroundColorHI))
        }
    }

    const mouseLeave = () => {
        setHover(false)
        document.documentElement.style.setProperty("--selection-color", "#ff9270")
    }

    const getLabel = () => {
        if (props.format === "mp4") return mp4Label
        if (props.format === "mkv") return mkvLabel
        if (props.format === "webm") return webmLabel
        if (props.format === "mp3") return mp3Label
        if (props.format === "m3u8") return m3u8Label
        if (props.format === "ass") return assLabel
        if (props.format === "vtt") return vttLabel
        if (props.format === "png") return pngLabel
    }

    const videoButton = () => {
        if (output) shell.openPath(output)
    }

    const openAnime = async (url: string) => {
        let anime = ""
        if (website === "crunchyroll") {
            const html = await fetch(url).then((r) => r.text())
            const id = html.match(/(?<="series_id":")(.*)(?=","series_title":)/gm)?.[0]
            anime = `https://crunchyroll.com/series/${id}`
        } else if (website === "hidive") {
            anime = `https://www.hidive.com/tv/${props.episode.series_name.toLowerCase().replace(/ +/g, "-").replace(/[^a-z0-9-]/gi, "")}`
        }
        ipcRenderer.invoke("open-url", anime)
    }

    const getPlayVideoIcon = () => {
        if (website === "crunchyroll") {
            return hoverVideo ? playVideoHoverCR : playVideoCR
        } else if (website === "hidive") {
            return hoverVideo ? playVideoHoverHI : playVideoHI
        }
    }

    const getCloseContainerIcon = () => {
        if (website === "crunchyroll") {
            return hoverClose ? closeContainerHoverCR : closeContainerCR
        } else if (website === "hidive") {
            return hoverClose ? closeContainerHoverHI : closeContainerHI
        }
    }

    const getPlayButton = () => {
        if (website === "crunchyroll") {
            return hoverPlay ? playButtonHoverCR : playButtonCR
        } else if (website === "hidive") {
            return hoverPlay ? playButtonHoverHI : playButtonHI
        }
    }

    const getPauseButton = () => {
        if (website === "crunchyroll") {
            return hoverPause ? pauseButtonHoverCR : pauseButtonCR
        } else if (website === "hidive") {
            return hoverPause ? pauseButtonHoverHI : pauseButtonHI
        }
    }

    const getStopButton = () => {
        if (website === "crunchyroll") {
            return hoverStop ? stopButtonHoverCR : stopButtonCR
        } else if (website === "hidive") {
            return hoverStop ? stopButtonHoverHI : stopButtonHI
        }
    }

    const getLocationButton = () => {
        if (website === "crunchyroll") {
            return hoverLocation ? locationButtonHoverCR : locationButtonCR
        } else if (website === "hidive") {
            return hoverLocation ? locationButtonHoverHI : locationButtonHI
        }
    }

    const getTrashButton = () => {
        if (website === "crunchyroll") {
            return hoverTrash ? trashButtonHoverCR : trashButtonCR
        } else if (website === "hidive") {
            return hoverTrash ? trashButtonHoverHI : trashButtonHI
        }
    }

    return (
        <section ref={episodeContainerRef} className="episode-wrap-container" onMouseOver={() => setHover(true)} onMouseEnter={mouseEnter} onMouseLeave={mouseLeave}>
            <div className="episode-container" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className="ep-img">
                <img src={props.episode.screenshot_image.large_url}/>
            </div>
            <div className="ep-middle">
                <div className="ep-name">
                    <p className="ep-text hover" onMouseDown={(event) => event.stopPropagation()}><span onClick={() => ipcRenderer.invoke("open-url", props.episode.url)}>{props.episode.name}</span></p>
                    <img className="ep-label" src={getLabel()}/>
                    {output ? <img className="ep-video" width="30" height="30" src={getPlayVideoIcon()} onClick={videoButton} onMouseEnter={() => setHoverVideo(true)} onMouseLeave={() => setHoverVideo(false)} onMouseDown={(event) => event.stopPropagation()}/> : null}
                </div>
                <div className="ep-info">
                    <div className="ep-info-col">
                        <p className="ep-text hover" onMouseDown={(event) => event.stopPropagation()}><span onClick={() => openAnime(props.episode.url)}>Anime: {props.episode.collection_name?.replace(/-/g, " ")}</span></p>
                        <p className="ep-text" onMouseDown={(event) => event.stopPropagation()}>Episode: {props.episode.episode_number}</p>
                    </div>
                    <div className="ep-info-col">
                        <p className="ep-text-alt" onMouseDown={(event) => event.stopPropagation()}>{resolutionInfo()}</p>
                        <p className="ep-text-alt" onMouseDown={(event) => event.stopPropagation()}>{time}</p>
                    </div>
                </div>
                <div className="ep-progress">
                    {generateProgressBar()}
                </div>
            </div>
            <div className="ep-buttons">
                {hover ? <img className="ep-button close-container" width="28" height="28" onMouseDown={(event) => event.stopPropagation()} src={getCloseContainerIcon()} onClick={closeDownload} onMouseEnter={() => setHoverClose(true)} onMouseLeave={() => setHoverClose(false)}/> : null}
                <div className="ep-button-row">
                    <img className="ep-button" width="50" height="50" onMouseDown={(event) => event.stopPropagation()} src={paused ? (getPlayButton()) : (getPauseButton())} onClick={handlePause} onMouseEnter={() => {setHoverPlay(true); setHoverPause(true)}} onMouseLeave={() => {setHoverPlay(false); setHoverPause(false)}}/>
                    <img className="ep-button" width="50" height="50" onMouseDown={(event) => event.stopPropagation()} src={getStopButton()} onClick={stopDownload} onMouseEnter={() => setHoverStop(true)} onMouseLeave={() => setHoverStop(false)}/>
                </div>
                <div className="ep-button-row">
                    {output ? <img className="ep-button" width="50" height="50" onMouseDown={(event) => event.stopPropagation()} src={getLocationButton()} onClick={openLocation} onMouseEnter={() => setHoverLocation(true)} onMouseLeave={() => setHoverLocation(false)}/> : null}
                    {output ? <img className="ep-button" width="50" height="50" onMouseDown={(event) => event.stopPropagation()} src={getTrashButton()} onClick={deleteDownload} onMouseEnter={() => setHoverTrash(true)} onMouseLeave={() => setHoverTrash(false)}/> : null}    
                </div>
            </div>
            </div>
        </section>
    )
}

export default EpisodeContainer