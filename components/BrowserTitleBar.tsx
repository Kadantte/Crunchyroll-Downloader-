import React, {useState, useEffect, useContext} from "react"
import {WebsiteContext} from "../browser"
import {ipcRenderer} from "electron"
import {getCurrentWindow, shell} from "@electron/remote"
import minimizeButton from "../assets/crunchyroll/browserMinimize.png"
import maximizeButton from "../assets/crunchyroll/browserMaximize.png"
import closeButton from "../assets/crunchyroll/browserClose.png"
import backButton from "../assets/crunchyroll/backButton.png"
import forwardButton from "../assets/crunchyroll/forwardButton.png"
import homeButton from "../assets/crunchyroll/homeButton.png"
import downloadButton from "../assets/crunchyroll/downloadButton.png"
import externalButton from "../assets/crunchyroll/externalButton.png"
import refreshButton from "../assets/crunchyroll/refreshButton.png"
import minimizeButtonHoverCR from "../assets/crunchyroll/minimizeButton-hover.png"
import maximizeButtonHoverCR from "../assets/crunchyroll/maximizeButton-hover.png"
import closeButtonHoverCR from "../assets/crunchyroll/closeButton-hover.png"
import backButtonHoverCR from "../assets/crunchyroll/backButton-hover.png"
import forwardButtonHoverCR from "../assets/crunchyroll/forwardButton-hover.png"
import homeButtonHoverCR from "../assets/crunchyroll/homeButton-hover.png"
import downloadButtonHoverCR from "../assets/crunchyroll/downloadButton-hover.png"
import externalButtonHoverCR from "../assets/crunchyroll/externalButton-hover.png"
import refreshButtonHoverCR from "../assets/crunchyroll/refreshButton-hover.png"
import minimizeButtonHoverHI from "../assets/hidive/minimizeButton-hover.png"
import maximizeButtonHoverHI from "../assets/hidive/maximizeButton-hover.png"
import closeButtonHoverHI from "../assets/hidive/closeButton-hover.png"
import backButtonHoverHI from "../assets/hidive/backButton-hover.png"
import forwardButtonHoverHI from "../assets/hidive/forwardButton-hover.png"
import homeButtonHoverHI from "../assets/hidive/homeButton-hover.png"
import downloadButtonHoverHI from "../assets/hidive/downloadButton-hover.png"
import externalButtonHoverHI from "../assets/hidive/externalButton-hover.png"
import refreshButtonHoverHI from "../assets/hidive/refreshButton-hover.png"
import "../styles/browsertitlebar.less"

const BrowserTitleBar: React.FunctionComponent = (props) => {
    const {website, setWebsite} = useContext(WebsiteContext)
    let [hoverClose, setHoverClose] = useState(false)
    let [hoverMin, setHoverMin] = useState(false)
    let [hoverMax, setHoverMax] = useState(false)
    let [hoverHome, setHoverHome] = useState(false)
    let [hoverBack, setHoverBack] = useState(false)
    let [hoverForward, setHoverForward] = useState(false)
    let [hoverDownload, setHoverDownload] = useState(false)
    let [hoverExternal, setHoverExternal] = useState(false)
    let [hoverRefresh, setHoverRefresh] = useState(false)

    useEffect(() => {
        const openURL = (event: any, url: string) => {
            const web = document.getElementById("webview") as any
            web.loadURL(url)
        }
        ipcRenderer.on("open-url", openURL)
        return () => {
            ipcRenderer.removeListener("open-url", openURL)
        }
    })

    const minimize = () => {
        getCurrentWindow().minimize()
    }

    const maximize = () => {
        const window = getCurrentWindow()
        if (window.isMaximized()) {
            window.unmaximize()
        } else {
            window.maximize()
        }
    }
    
    const close = () => {
        getCurrentWindow().close()
    }

    const home = () => {
        const web = document.getElementById("webview") as any
        if (website === "crunchyroll") {
            web.loadURL("https://www.crunchyroll.com/")
        } else {
            web.loadURL("https://www.hidive.com/")
        }
    }

    const back = () => {
        const web = document.getElementById("webview") as any
        if (web.canGoBack()) {
            web.goBack()
        }
    }

    const forward = () => {
        const web = document.getElementById("webview") as any
        if (web.canGoForward()) {
            web.goForward()
        }
    }

    const download = async () => {
        const web = document.getElementById("webview") as any
        const html = await web.executeJavaScript("document.documentElement.outerHTML")
        ipcRenderer.invoke("download-url", web.getURL(), html)
    }

    const external = () => {
        const web = document.getElementById("webview") as any
        shell.openExternal(web.getURL())
    }

    const refresh = () => {
        const web = document.getElementById("webview") as any
        web.reload()
    }

    const getHomeButton = () => {
        if (website === "crunchyroll") {
            return hoverHome ? homeButtonHoverCR : homeButton
        } else if (website === "hidive") {
            return hoverHome ? homeButtonHoverHI : homeButton
        }
    }

    const getBackButton = () => {
        if (website === "crunchyroll") {
            return hoverBack ? backButtonHoverCR : backButton
        } else if (website === "hidive") {
            return hoverBack ? backButtonHoverHI : backButton
        }
    }

    const getForwardButton = () => {
        if (website === "crunchyroll") {
            return hoverForward ? forwardButtonHoverCR : forwardButton
        } else if (website === "hidive") {
            return hoverForward ? forwardButtonHoverHI : forwardButton
        }
    }

    const getRefreshButton = () => {
        if (website === "crunchyroll") {
            return hoverRefresh ? refreshButtonHoverCR : refreshButton
        } else if (website === "hidive") {
            return hoverRefresh ? refreshButtonHoverHI : refreshButton
        }
    }

    const getExternalButton = () => {
        if (website === "crunchyroll") {
            return hoverExternal ? externalButtonHoverCR : externalButton
        } else if (website === "hidive") {
            return hoverExternal ? externalButtonHoverHI : externalButton
        }
    }

    const getDownloadButton = () => {
        if (website === "crunchyroll") {
            return hoverDownload ? downloadButtonHoverCR : downloadButton
        } else if (website === "hidive") {
            return hoverDownload ? downloadButtonHoverHI : downloadButton
        }
    }

    const getMinimizeButton = () => {
        if (website === "crunchyroll") {
            return hoverMin ? minimizeButtonHoverCR : minimizeButton
        } else if (website === "hidive") {
            return hoverMin ? minimizeButtonHoverHI : minimizeButton
        }
    }

    const getMaximizeButton = () => {
        if (website === "crunchyroll") {
            return hoverMax ? maximizeButtonHoverCR : maximizeButton
        } else if (website === "hidive") {
            return hoverMax ? maximizeButtonHoverHI : maximizeButton
        }
    }

    const getCloseButton = () => {
        if (website === "crunchyroll") {
            return hoverClose ? closeButtonHoverCR : closeButton
        } else if (website === "hidive") {
            return hoverClose ? closeButtonHoverHI : closeButton
        }
    }

    return (
        <section className="title-bar">
                <div className="title-bar-drag-area">
                    <div className="title-container">
                        <img height="20" width="20" src={getHomeButton()} className="title-bar-button" onClick={home} onMouseEnter={() => setHoverHome(true)} onMouseLeave={() => setHoverHome(false)}/>
                        <img height="20" width="20" src={getBackButton()} className="title-bar-button" onClick={back} onMouseEnter={() => setHoverBack(true)} onMouseLeave={() => setHoverBack(false)}/>
                        <img height="20" width="20" src={getForwardButton()} className="title-bar-button" onClick={forward} onMouseEnter={() => setHoverForward(true)} onMouseLeave={() => setHoverForward(false)}/>
                        <img height="20" width="20" src={getRefreshButton()} className="title-bar-button" onClick={refresh} onMouseEnter={() => setHoverRefresh(true)} onMouseLeave={() => setHoverRefresh(false)}/>
                    </div>
                    <div className="title-bar-buttons">
                        <img src={getExternalButton()} height="20" width="20" className="title-bar-button" onClick={external} onMouseEnter={() => setHoverExternal(true)} onMouseLeave={() => setHoverExternal(false)}/>
                        <img src={getDownloadButton()} height="20" width="20" className="title-bar-button" onClick={download} onMouseEnter={() => setHoverDownload(true)} onMouseLeave={() => setHoverDownload(false)}/>
                        <img src={getMinimizeButton()} height="20" width="20" className="title-bar-button" onClick={minimize} onMouseEnter={() => setHoverMin(true)} onMouseLeave={() => setHoverMin(false)}/>
                        <img src={getMaximizeButton()} height="20" width="20" className="title-bar-button" onClick={maximize} onMouseEnter={() => setHoverMax(true)} onMouseLeave={() => setHoverMax(false)}/>
                        <img src={getCloseButton()} height="20" width="20" className="title-bar-button" onClick={close} onMouseEnter={() => setHoverClose(true)} onMouseLeave={() => setHoverClose(false)}/>
                    </div>
                </div>
        </section>
    )
}

export default BrowserTitleBar