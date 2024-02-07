import React, {useState, useEffect, useContext} from "react"
import {ipcRenderer} from "electron"
import {getCurrentWindow, shell} from "@electron/remote"
import {WebsiteContext, ThemeContext} from "../renderer"
import minimizeButtonCR from "../assets/crunchyroll/minimizeButton.png"
import minimizeButtonHoverCR from "../assets/crunchyroll/minimizeButton-hover.png"
import maximizeButtonCR from "../assets/crunchyroll/maximizeButton.png"
import maximizeButtonHoverCR from "../assets/crunchyroll/maximizeButton-hover.png"
import closeButtonCR from "../assets/crunchyroll/closeButton.png"
import closeButtonHoverCR from "../assets/crunchyroll/closeButton-hover.png"
import reloadButtonCR from "../assets/crunchyroll/reloadButton.png"
import reloadButtonHoverCR from "../assets/crunchyroll/reloadButton-hover.png"
import starButtonCR from "../assets/crunchyroll/starButton.png"
import starButtonHoverCR from "../assets/crunchyroll/starButton-hover.png"
import loginButtonCR from "../assets/crunchyroll/loginButton.png"
import loginButtonHoverCR from "../assets/crunchyroll/loginButton-hover.png"
import settingsButtonHoverCR from "../assets/crunchyroll/settingsButton-hover.png"
import settingsButtonCR from "../assets/crunchyroll/settingsButton.png"
import lightButtonCR from "../assets/crunchyroll/light.png"
import lightButtonHoverCR from "../assets/crunchyroll/light-hover.png"
import darkButtonCR from "../assets/crunchyroll/dark.png"
import darkButtonHoverCR from "../assets/crunchyroll/dark-hover.png"
import minimizeButtonHI from "../assets/hidive/minimizeButton.png"
import minimizeButtonHoverHI from "../assets/hidive/minimizeButton-hover.png"
import maximizeButtonHI from "../assets/hidive/maximizeButton.png"
import maximizeButtonHoverHI from "../assets/hidive/maximizeButton-hover.png"
import closeButtonHI from "../assets/hidive/closeButton.png"
import closeButtonHoverHI from "../assets/hidive/closeButton-hover.png"
import reloadButtonHI from "../assets/hidive/reloadButton.png"
import reloadButtonHoverHI from "../assets/hidive/reloadButton-hover.png"
import starButtonHI from "../assets/hidive/starButton.png"
import starButtonHoverHI from "../assets/hidive/starButton-hover.png"
import loginButtonHI from "../assets/hidive/loginButton.png"
import loginButtonHoverHI from "../assets/hidive/loginButton-hover.png"
import settingsButtonHoverHI from "../assets/hidive/settingsButton-hover.png"
import settingsButtonHI from "../assets/hidive/settingsButton.png"
import lightButtonHI from "../assets/hidive/light.png"
import lightButtonHoverHI from "../assets/hidive/light-hover.png"
import darkButtonHI from "../assets/hidive/dark.png"
import darkButtonHoverHI from "../assets/hidive/dark-hover.png"
import minimizeButtonFU from "../assets/funimation/minimizeButton.png"
import minimizeButtonHoverFU from "../assets/funimation/minimizeButton-hover.png"
import maximizeButtonFU from "../assets/funimation/maximizeButton.png"
import maximizeButtonHoverFU from "../assets/funimation/maximizeButton-hover.png"
import closeButtonFU from "../assets/funimation/closeButton.png"
import closeButtonHoverFU from "../assets/funimation/closeButton-hover.png"
import reloadButtonFU from "../assets/funimation/reloadButton.png"
import reloadButtonHoverFU from "../assets/funimation/reloadButton-hover.png"
import starButtonFU from "../assets/funimation/starButton.png"
import starButtonHoverFU from "../assets/funimation/starButton-hover.png"
import loginButtonFU from "../assets/funimation/loginButton.png"
import loginButtonHoverFU from "../assets/funimation/loginButton-hover.png"
import settingsButtonHoverFU from "../assets/funimation/settingsButton-hover.png"
import settingsButtonFU from "../assets/funimation/settingsButton.png"
import lightButtonFU from "../assets/funimation/light.png"
import lightButtonHoverFU from "../assets/funimation/light-hover.png"
import darkButtonFU from "../assets/funimation/dark.png"
import darkButtonHoverFU from "../assets/funimation/dark-hover.png"
import crIcon from "../assets/icon.png"
import hiIcon from "../assets/hidive/icon.png"
import fuIcon from "../assets/funimation/icon.png"
import cr from "../assets/crunchyroll/CR.png"
import crHover from "../assets/crunchyroll/CR-hover.png"
import hi from "../assets/hidive/HI.png"
import hiHover from "../assets/hidive/HI-hover.png"
import fu from "../assets/funimation/FU.png"
import fuHover from "../assets/funimation/FU-hover.png"
import pack from "../package.json"
import "../styles/titlebar.less"

const TitleBar: React.FunctionComponent = (props) => {
    const {website, setWebsite} = useContext(WebsiteContext)
    let [hoverClose, setHoverClose] = useState(false)
    let [hoverMin, setHoverMin] = useState(false)
    let [hoverMax, setHoverMax] = useState(false)
    let [hoverReload, setHoverReload] = useState(false)
    let [hoverStar, setHoverStar] = useState(false)
    let [hoverLogin, setHoverLogin] = useState(false)
    let [hoverWeb, setHoverWeb] = useState(false)
    let [hoverTheme, setHoverTheme] = useState(false)
    let [hoverSite, setHoverSite] = useState(false)
    let {theme, setTheme} = useContext(ThemeContext)
    let [hoverSettings, setHoverSettings] = useState(false)
    
    useEffect(() => {
        ipcRenderer.invoke("check-for-updates", true)
        const initTheme = async () => {
            const saved = await ipcRenderer.invoke("get-theme")
            const savedSite = await ipcRenderer.invoke("get-site")
            setWebsite(savedSite)
            changeTheme(saved, savedSite)
            ipcRenderer.invoke("change-site", savedSite)
        }
        initTheme()
    }, [])

    useEffect(() => {
        localStorage.setItem("website", website)
    }, [website])

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
    const star = () => {
        shell.openExternal(pack.repository.url)
    }
    const reload = () => {
        ipcRenderer.invoke("check-for-updates", false)
    }

    const login = () => {
        ipcRenderer.invoke("login-dialog")
    }

    const web = () => {
        ipcRenderer.invoke("open-website")
    }
    
    const settings = () => {
        ipcRenderer.invoke("advanced-settings")
    }

    const changeSite = () => {
        if (website === "crunchyroll") {
            setWebsite("hidive")
            changeTheme(theme, "hidive")
            ipcRenderer.invoke("change-site", "hidive")
        } else if (website === "hidive") {
            setWebsite("funimation")
            changeTheme(theme, "funimation")
            ipcRenderer.invoke("change-site", "funimation")
        } else if (website === "funimation") {
            setWebsite("crunchyroll")
            changeTheme(theme, "crunchyroll")
            ipcRenderer.invoke("change-site", "crunchyroll")
        }
    }

    const changeTheme = (value?: string, websiteValue?: string) => {
        let isDark = value !== undefined ? value === "dark" : theme === "light"
        let isCrunchyroll = websiteValue !== undefined ? websiteValue === "crunchyroll" : website === "crunchyroll"
        let isHiDive = websiteValue !== undefined ? websiteValue === "hidive" : website === "hidive"
        let isFunimation = websiteValue !== undefined ? websiteValue === "funimation" : website === "funimation"
        if (isDark) {
            if (isCrunchyroll) {
                document.documentElement.style.setProperty("--selection-color", "#ff9270")
                document.documentElement.style.setProperty("--bg-color", "#090409")
                document.documentElement.style.setProperty("--title-color", "#090409")
                document.documentElement.style.setProperty("--text-color", "#ff5b28")
                document.documentElement.style.setProperty("--search-color", "#090409")
                document.documentElement.style.setProperty("--search-text", "#ff5f25")
                document.documentElement.style.setProperty("--drop-color", "#090409")
                document.documentElement.style.setProperty("--drop-border", "#ff7211")
                document.documentElement.style.setProperty("--drop-hover", "#090409")
                document.documentElement.style.setProperty("--drop-text", "#ff7211")
                document.documentElement.style.setProperty("--drop-text-hover", "white")
                document.documentElement.style.setProperty("--settings-color", "#090409")
                document.documentElement.style.setProperty("--settings-text", "#fa5a3e")
                document.documentElement.style.setProperty("--version-color", "#090409")
                document.documentElement.style.setProperty("--version-text", "#ff3a3b")
                document.documentElement.style.setProperty("--settings-ok", "#090409")
                document.documentElement.style.setProperty("--settings-ok-text", "#ff9035")
                document.documentElement.style.setProperty("--settings-revert", "#090409")
                document.documentElement.style.setProperty("--settings-revert-text", "#f0413b")
                document.documentElement.style.setProperty("--version-accept", "#090409")
                document.documentElement.style.setProperty("--version-accept-text", "#5142ff")
                document.documentElement.style.setProperty("--version-reject", "#090409")
                document.documentElement.style.setProperty("--version-reject-text", "#ff4252")
                document.documentElement.style.setProperty("--cookie-button", "#ff334e")
            } else if (isHiDive) {
                document.documentElement.style.setProperty("--selection-color", "#708aff")
                document.documentElement.style.setProperty("--bg-color", "#090409")
                document.documentElement.style.setProperty("--title-color", "#090409")
                document.documentElement.style.setProperty("--text-color", "#2845ff")
                document.documentElement.style.setProperty("--search-color", "#090409")
                document.documentElement.style.setProperty("--search-text", "#255fff")
                document.documentElement.style.setProperty("--drop-color", "#090409")
                document.documentElement.style.setProperty("--drop-border", "#114dff")
                document.documentElement.style.setProperty("--drop-hover", "#090409")
                document.documentElement.style.setProperty("--drop-text", "#115cff")
                document.documentElement.style.setProperty("--drop-text-hover", "white")
                document.documentElement.style.setProperty("--settings-color", "#090409")
                document.documentElement.style.setProperty("--settings-text", "#3e5afa")
                document.documentElement.style.setProperty("--version-color", "#090409")
                document.documentElement.style.setProperty("--version-text", "#443aff")
                document.documentElement.style.setProperty("--settings-ok", "#090409")
                document.documentElement.style.setProperty("--settings-ok-text", "#3561ff")
                document.documentElement.style.setProperty("--settings-revert", "#090409")
                document.documentElement.style.setProperty("--settings-revert-text", "#3b3bf0")
                document.documentElement.style.setProperty("--version-accept", "#090409")
                document.documentElement.style.setProperty("--version-accept-text", "#7b42ff")
                document.documentElement.style.setProperty("--version-reject", "#090409")
                document.documentElement.style.setProperty("--version-reject-text", "#4842ff")
                document.documentElement.style.setProperty("--cookie-button", "#2631fe")
            } else if (isFunimation) {
                document.documentElement.style.setProperty("--selection-color", "#b070ff")
                document.documentElement.style.setProperty("--bg-color", "#090409")
                document.documentElement.style.setProperty("--title-color", "#090409")
                document.documentElement.style.setProperty("--text-color", "#6528ff")
                document.documentElement.style.setProperty("--search-color", "#090409")
                document.documentElement.style.setProperty("--search-text", "#5825ff")
                document.documentElement.style.setProperty("--drop-color", "#090409")
                document.documentElement.style.setProperty("--drop-border", "#4d11ff")
                document.documentElement.style.setProperty("--drop-hover", "#090409")
                document.documentElement.style.setProperty("--drop-text", "#5411ff")
                document.documentElement.style.setProperty("--drop-text-hover", "white")
                document.documentElement.style.setProperty("--settings-color", "#090409")
                document.documentElement.style.setProperty("--settings-text", "#6d3efa")
                document.documentElement.style.setProperty("--version-color", "#090409")
                document.documentElement.style.setProperty("--version-text", "#5b3aff")
                document.documentElement.style.setProperty("--settings-ok", "#090409")
                document.documentElement.style.setProperty("--settings-ok-text", "#4935ff")
                document.documentElement.style.setProperty("--settings-revert", "#090409")
                document.documentElement.style.setProperty("--settings-revert-text", "#623bf0")
                document.documentElement.style.setProperty("--version-accept", "#090409")
                document.documentElement.style.setProperty("--version-accept-text", "#5242ff")
                document.documentElement.style.setProperty("--version-reject", "#090409")
                document.documentElement.style.setProperty("--version-reject-text", "#9142ff")
                document.documentElement.style.setProperty("--cookie-button", "#6e26fe")
            }
            setTheme("dark")
            ipcRenderer.invoke("save-theme", "dark")
            ipcRenderer.invoke("update-color", "dark")
        } else {
            if (isCrunchyroll) {
                document.documentElement.style.setProperty("--selection-color", "#ff9270")
                document.documentElement.style.setProperty("--bg-color", "#f97540")
                document.documentElement.style.setProperty("--title-color", "#ff5b28")
                document.documentElement.style.setProperty("--text-color", "black")
                document.documentElement.style.setProperty("--search-color", "#ff5f25")
                document.documentElement.style.setProperty("--search-text", "black")
                document.documentElement.style.setProperty("--drop-color", "#ff7211")
                document.documentElement.style.setProperty("--drop-border", "#ffae3b")
                document.documentElement.style.setProperty("--drop-hover", "#ff8a3c")
                document.documentElement.style.setProperty("--drop-text", "white")
                document.documentElement.style.setProperty("--drop-text-hover", "black")
                document.documentElement.style.setProperty("--settings-color", "#fa5a3e")
                document.documentElement.style.setProperty("--settings-text", "black")
                document.documentElement.style.setProperty("--version-color", "#ff3a3b")
                document.documentElement.style.setProperty("--version-text", "black")
                document.documentElement.style.setProperty("--settings-ok", "#ff9035")
                document.documentElement.style.setProperty("--settings-ok-text", "black")
                document.documentElement.style.setProperty("--settings-revert", "#f0413b")
                document.documentElement.style.setProperty("--settings-revert-text", "black")
                document.documentElement.style.setProperty("--version-accept", "#5142ff")
                document.documentElement.style.setProperty("--version-accept-text", "black")
                document.documentElement.style.setProperty("--version-reject", "#ff4252")
                document.documentElement.style.setProperty("--version-reject-text", "black")
                document.documentElement.style.setProperty("--cookie-button", "#ff334e")
            } else if (isHiDive) {
                document.documentElement.style.setProperty("--selection-color", "#708aff")
                document.documentElement.style.setProperty("--bg-color", "#2550e0")
                document.documentElement.style.setProperty("--title-color", "#243de0")
                document.documentElement.style.setProperty("--text-color", "black")
                document.documentElement.style.setProperty("--search-color", "#2566ff")
                document.documentElement.style.setProperty("--search-text", "black")
                document.documentElement.style.setProperty("--drop-color", "#2e69ff")
                document.documentElement.style.setProperty("--drop-border", "#3b72ff")
                document.documentElement.style.setProperty("--drop-hover", "#3c69ff")
                document.documentElement.style.setProperty("--drop-text", "white")
                document.documentElement.style.setProperty("--drop-text-hover", "black")
                document.documentElement.style.setProperty("--settings-color", "#3e6dfa")
                document.documentElement.style.setProperty("--settings-text", "black")
                document.documentElement.style.setProperty("--version-color", "#3a65ff")
                document.documentElement.style.setProperty("--version-text", "black")
                document.documentElement.style.setProperty("--settings-ok", "#3575ff")
                document.documentElement.style.setProperty("--settings-ok-text", "black")
                document.documentElement.style.setProperty("--settings-revert", "#413bf0")
                document.documentElement.style.setProperty("--settings-revert-text", "black")
                document.documentElement.style.setProperty("--version-accept", "#5542ff")
                document.documentElement.style.setProperty("--version-accept-text", "black")
                document.documentElement.style.setProperty("--version-reject", "#8a42ff")
                document.documentElement.style.setProperty("--version-reject-text", "black")
                document.documentElement.style.setProperty("--cookie-button", "#2631fe")
            } else if (isFunimation) {
                document.documentElement.style.setProperty("--selection-color", "#b070ff")
                document.documentElement.style.setProperty("--bg-color", "#5425e0")
                document.documentElement.style.setProperty("--title-color", "#4c24e0")
                document.documentElement.style.setProperty("--text-color", "black")
                document.documentElement.style.setProperty("--search-color", "#5025ff")
                document.documentElement.style.setProperty("--search-text", "black")
                document.documentElement.style.setProperty("--drop-color", "#662eff")
                document.documentElement.style.setProperty("--drop-border", "#5e30f7")
                document.documentElement.style.setProperty("--drop-hover", "#6d3cff")
                document.documentElement.style.setProperty("--drop-text", "white")
                document.documentElement.style.setProperty("--drop-text-hover", "black")
                document.documentElement.style.setProperty("--settings-color", "#673efa")
                document.documentElement.style.setProperty("--settings-text", "black")
                document.documentElement.style.setProperty("--version-color", "#653aff")
                document.documentElement.style.setProperty("--version-text", "black")
                document.documentElement.style.setProperty("--settings-ok", "#5a35ff")
                document.documentElement.style.setProperty("--settings-ok-text", "black")
                document.documentElement.style.setProperty("--settings-revert", "#a83bf0")
                document.documentElement.style.setProperty("--settings-revert-text", "black")
                document.documentElement.style.setProperty("--version-accept", "#7442ff")
                document.documentElement.style.setProperty("--version-accept-text", "black")
                document.documentElement.style.setProperty("--version-reject", "#ad42ff")
                document.documentElement.style.setProperty("--version-reject-text", "black")
                document.documentElement.style.setProperty("--cookie-button", "#5826fe")
            }
            setTheme("light")
            ipcRenderer.invoke("save-theme", "light")
            ipcRenderer.invoke("update-color", "light")
        }
    }

    const getSiteIcon = () => {
        if (website === "crunchyroll") {
            return hoverSite ? crHover : cr
        } else if (website === "hidive") {
            return hoverSite ? hiHover : hi
        } else if (website === "funimation") {
            return hoverSite ? fuHover : fu
        }
    }

    const getThemeIcon = () => {
        if (website === "crunchyroll") {
            return hoverTheme ? (theme === "light" ? darkButtonHoverCR : lightButtonHoverCR) : (theme === "light" ? darkButtonCR : lightButtonCR)
        } else if (website === "hidive") {
            return hoverTheme ? (theme === "light" ? darkButtonHoverHI : lightButtonHoverHI) : (theme === "light" ? darkButtonHI : lightButtonHI)
        } else if (website === "funimation") {
            return hoverTheme ? (theme === "light" ? darkButtonHoverFU : lightButtonHoverFU) : (theme === "light" ? darkButtonFU : lightButtonFU)
        }
    }

    const getSettingsIcon = () => {
        if (website === "crunchyroll") {
            return hoverSettings ? settingsButtonHoverCR : settingsButtonCR
        } else if (website === "hidive") {
            return hoverSettings ? settingsButtonHoverHI : settingsButtonHI
        } else if (website === "funimation") {
            return hoverSettings ? settingsButtonHoverFU : settingsButtonFU
        }
    }

    const getWebIcon = () => {
        if (website === "crunchyroll") {
            return hoverWeb ? loginButtonHoverCR : loginButtonCR
        } else if (website === "hidive") {
            return hoverWeb ? loginButtonHoverHI : loginButtonHI
        } else if (website === "funimation") {
            return hoverWeb ? loginButtonHoverFU : loginButtonFU
        }
    }

    const getStarIcon = () => {
        if (website === "crunchyroll") {
            return hoverStar ? starButtonHoverCR : starButtonCR
        } else if (website === "hidive") {
            return hoverStar ? starButtonHoverHI : starButtonHI
        } else if (website === "funimation") {
            return hoverStar ? starButtonHoverFU : starButtonFU
        }
    }

    const getReloadIcon = () => {
        if (website === "crunchyroll") {
            return hoverReload ? reloadButtonHoverCR : reloadButtonCR
        } else if (website === "hidive") {
            return hoverReload ? reloadButtonHoverHI : reloadButtonHI
        } else if (website === "funimation") {
            return hoverReload ? reloadButtonHoverFU : reloadButtonFU
        }
    }

    const getMinimizeIcon = () => {
        if (website === "crunchyroll") {
            return hoverMin ? minimizeButtonHoverCR : minimizeButtonCR
        } else if (website === "hidive") {
            return hoverMin ? minimizeButtonHoverHI : minimizeButtonHI
        } else if (website === "funimation") {
            return hoverMin ? minimizeButtonHoverFU : minimizeButtonFU
        }
    }

    const getMaximizeIcon = () => {
        if (website === "crunchyroll") {
            return hoverMax ? maximizeButtonHoverCR : maximizeButtonCR
        } else if (website === "hidive") {
            return hoverMax ? maximizeButtonHoverHI : maximizeButtonHI
        } else if (website === "funimation") {
            return hoverMax ? maximizeButtonHoverFU : maximizeButtonFU
        }
    }

    const getCloseIcon = () => {
        if (website === "crunchyroll") {
            return hoverClose ? closeButtonHoverCR: closeButtonCR
        } else if (website === "hidive") {
            return hoverClose ? closeButtonHoverHI : closeButtonHI
        } else if (website === "funimation") {
            return hoverClose ? closeButtonHoverFU : closeButtonFU
        }
    }

    const getTitle = () => {
        if (website === "crunchyroll") {
            return "Crunchyroll Downloader"
        } else if (website === "hidive") {
            return "HIDIVE Downloader"
        } else if (website === "funimation") {
            return "Funimation Downloader"
        }
    }

    const getAppIcon = () => {
        if (website === "crunchyroll") {
            return crIcon
        } else if (website === "hidive") {
            return hiIcon
        } else if (website === "funimation") {
            return fuIcon
        }
    }

    return (
        <section className="title-bar">
                <div className="title-bar-drag-area">
                    <div className="title-container">
                        <img className="app-icon" height="22" width="22" src={getAppIcon()}/>
                        <p><span className="title">{getTitle()} v{pack.version}</span></p>
                    </div>
                    <div className="title-bar-buttons">
                        <img src={getSiteIcon()} height="20" width="20" className="title-bar-button site-button" onClick={() => changeSite()} onMouseEnter={() => setHoverSite(true)} onMouseLeave={() => setHoverSite(false)}/>
                        <img src={getThemeIcon()} height="20" width="20" className="title-bar-button theme-button" onClick={() => changeTheme()} onMouseEnter={() => setHoverTheme(true)} onMouseLeave={() => setHoverTheme(false)}/>
                        <img src={getSettingsIcon()} height="20" width="20" className="title-bar-button settings-button" onClick={settings} onMouseEnter={() => setHoverSettings(true)} onMouseLeave={() => setHoverSettings(false)}/>
                        <img src={getWebIcon()} height="20" width="20" className="title-bar-button" onClick={web} onMouseEnter={() => setHoverWeb(true)} onMouseLeave={() => setHoverWeb(false)}/>
                        <img src={getStarIcon()} height="20" width="20" className="title-bar-button star-button" onClick={star} onMouseEnter={() => setHoverStar(true)} onMouseLeave={() => setHoverStar(false)}/>
                        <img src={getReloadIcon()} height="20" width="20" className="title-bar-button reload-button" onClick={reload} onMouseEnter={() => setHoverReload(true)} onMouseLeave={() => setHoverReload(false)}/>
                        <img src={getMinimizeIcon()} height="20" width="20" className="title-bar-button" onClick={minimize} onMouseEnter={() => setHoverMin(true)} onMouseLeave={() => setHoverMin(false)}/>
                        <img src={getMaximizeIcon()} height="20" width="20" className="title-bar-button" onClick={maximize} onMouseEnter={() => setHoverMax(true)} onMouseLeave={() => setHoverMax(false)}/>
                        <img src={getCloseIcon()} height="20" width="20" className="title-bar-button" onClick={close} onMouseEnter={() => setHoverClose(true)} onMouseLeave={() => setHoverClose(false)}/>
                    </div>
                </div>
        </section>
    )
}

export default TitleBar