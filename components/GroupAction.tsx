import {ipcRenderer} from "electron"
import React, {useContext, useEffect, useState} from "react"
import {WebsiteContext} from "../renderer"
import clearAllButtonHoverCR from "../assets/crunchyroll/clearFinished-hover.png"
import clearAllButtonCR from "../assets/crunchyroll/clearFinished.png"
import deleteAllButtonCR from "../assets/crunchyroll/deleteAll.png"
import deleteAllButtonHoverCR from "../assets/crunchyroll/deleteAll-hover.png"
import stopAllButtonCR from "../assets/crunchyroll/stopAll.png"
import stopAllButtonHoverCR from "../assets/crunchyroll/stopAll-hover.png"
import clearAllButtonDarkHoverCR from "../assets/crunchyroll/clearFinished-dark-hover.png"
import clearAllButtonDarkCR from "../assets/crunchyroll/clearFinished-dark.png"
import deleteAllButtonDarkCR from "../assets/crunchyroll/deleteAll-dark.png"
import deleteAllButtonDarkHoverCR from "../assets/crunchyroll/deleteAll-dark-hover.png"
import stopAllButtonDarkCR from "../assets/crunchyroll/stopAll-dark.png"
import stopAllButtonDarkHoverCR from "../assets/crunchyroll/stopAll-dark-hover.png"
import clearAllButtonHoverHI from "../assets/hidive/clearFinished-hover.png"
import clearAllButtonHI from "../assets/hidive/clearFinished.png"
import deleteAllButtonHI from "../assets/hidive/deleteAll.png"
import deleteAllButtonHoverHI from "../assets/hidive/deleteAll-hover.png"
import stopAllButtonHI from "../assets/hidive/stopAll.png"
import stopAllButtonHoverHI from "../assets/hidive/stopAll-hover.png"
import clearAllButtonDarkHoverHI from "../assets/hidive/clearFinished-dark-hover.png"
import clearAllButtonDarkHI from "../assets/hidive/clearFinished-dark.png"
import deleteAllButtonDarkHI from "../assets/hidive/deleteAll-dark.png"
import deleteAllButtonDarkHoverHI from "../assets/hidive/deleteAll-dark-hover.png"
import stopAllButtonDarkHI from "../assets/hidive/stopAll-dark.png"
import stopAllButtonDarkHoverHI from "../assets/hidive/stopAll-dark-hover.png"
import {ClearAllContext} from "../renderer"
import "../styles/groupaction.less"

const GroupAction: React.FunctionComponent = (props) => {
    const {website, setWebsite} = useContext(WebsiteContext)
    const {clearAll} = useContext(ClearAllContext)
    const [clearHover, setClearHover] = useState(false)
    const [deleteHover, setDeleteHover] = useState(false)
    const [stopHover, setStopHover] = useState(false)
    const [color, setColor] = useState("light")

    useEffect(() => {
        const updateColor = (event: any, color: string) => {
            setColor(color)
        }
        ipcRenderer.on("update-color", updateColor)
        return () => {
            ipcRenderer.removeListener("update-color", updateColor)
        }
    }, [])

    const clear = () => {
        ipcRenderer.invoke("clear-all")
        setClearHover(false)
    }

    const del = () => {
        ipcRenderer.invoke("delete-all")
    }

    const stop = () => {
        ipcRenderer.invoke("stop-all")
    }

    const getImage = (type: string) => {
        if (website === "crunchyroll") {
            if (type === "clear") {
                if (color === "light") {
                    return clearHover ? clearAllButtonHoverCR : clearAllButtonCR
                } else {
                    return clearHover ? clearAllButtonDarkHoverCR : clearAllButtonDarkCR
                }
            } else if (type === "stop") {
                if (color === "light") {
                    return stopHover ? stopAllButtonHoverCR : stopAllButtonCR
                } else {
                    return stopHover ? stopAllButtonDarkHoverCR : stopAllButtonDarkCR
                }
            } else if (type === "delete") {
                if (color === "light") {
                    return deleteHover ? deleteAllButtonHoverCR : deleteAllButtonCR
                } else {
                    return deleteHover ? deleteAllButtonDarkHoverCR : deleteAllButtonDarkCR
                }
            }
        } else if (website === "hidive") {
            if (type === "clear") {
                if (color === "light") {
                    return clearHover ? clearAllButtonHoverHI : clearAllButtonHI
                } else {
                    return clearHover ? clearAllButtonDarkHoverHI : clearAllButtonDarkHI
                }
            } else if (type === "stop") {
                if (color === "light") {
                    return stopHover ? stopAllButtonHoverHI : stopAllButtonHI
                } else {
                    return stopHover ? stopAllButtonDarkHoverHI : stopAllButtonDarkHI
                }
            } else if (type === "delete") {
                if (color === "light") {
                    return deleteHover ? deleteAllButtonHoverHI : deleteAllButtonHI
                } else {
                    return deleteHover ? deleteAllButtonDarkHoverHI : deleteAllButtonDarkHI
                }
            }
        }
    }

    if (clearAll) {
        return (
            <section className="group-action-container">
                    <img src={getImage("clear")} onClick={clear} className="group-action-button" width="436" height="61" onMouseEnter={() => setClearHover(true)} onMouseLeave={() => setClearHover(false)}/>
                    <img src={getImage("stop")} onClick={stop} className="group-action-button" width="319" height="61" onMouseEnter={() => setStopHover(true)} onMouseLeave={() => setStopHover(false)}/>
                    <img src={getImage("delete")} onClick={del} className="group-action-button" width="319" height="61" onMouseEnter={() => setDeleteHover(true)} onMouseLeave={() => setDeleteHover(false)}/>
            </section>
        )
    }
    return null
}

export default GroupAction