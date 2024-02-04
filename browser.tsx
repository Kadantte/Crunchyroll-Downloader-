import React, {useEffect, useState} from "react"
import {ipcRenderer} from "electron"
import ReactDom from "react-dom"
import BrowserTitleBar from "./components/BrowserTitleBar"
import "./browser.less"
import functions from "./structures/functions"

export const WebsiteContext = React.createContext<any>(null)

const App: React.FunctionComponent = () => {
    const [website, setWebsite] = useState("crunchyroll")
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const web = document.getElementById("webview") as any 
        web?.addEventListener("did-navigate-in-page", async () => {
            await functions.timeout(500)
            await web.executeJavaScript("document.querySelector('[data-t=\"show-more-btn\"]')?.click()")
        })
        web?.addEventListener("dom-ready", async () => {
            ipcRenderer.invoke("webview-id", web.getWebContentsId())
            const site = await ipcRenderer.invoke("get-site")
            setReady(true)
            setWebsite(site)
        })
        const siteChange = (event: any, site: string) => {
            setWebsite(site)
        }
        ipcRenderer.addListener("site-change", siteChange)
        return () => {
            ipcRenderer.removeListener("site-change", siteChange)
        }
    }, [])

    useEffect(() => {
        if (!ready) return
        const web = document.getElementById("webview") as any 
        if (website === "crunchyroll") {
            web?.loadURL("https://www.crunchyroll.com/")
        } else if (website === "hidive") {
            web?.loadURL("https://www.hidive.com/")
            loginToHIDIVE()
        }
    }, [ready, website])

    const loginToHIDIVE = async () => {
        const cookie = await ipcRenderer.invoke("get-hidive-cookie")
        const email = await ipcRenderer.invoke("get-hidive-email")
        const password = await ipcRenderer.invoke("get-hidive-password")
        if (!cookie && !email && !password) return
        const data = {ReturnUrl: "/dashboard", TwoFactorAuth: "False", Email: email, Password: password, BillingZipCode: "", BillingAddress: "anime"}
        const response = await fetch(`https://www.hidive.com/account/login`, {method: "POST", body: JSON.stringify(data), headers: {cookie}}).then((r) => r.text())
        console.log(response)
    }

    const getSource = () => {
        if (website === "crunchyroll") {
            return "https://www.crunchyroll.com/"
        } else if (website === "hidive") {
            return "https://www.hidive.com/"
        }
    }

    return (
        <WebsiteContext.Provider value={{website, setWebsite}}>
            <main className="app">
                <BrowserTitleBar/>
                <webview id="webview" src={getSource()} partition="persist:webview-partition"></webview>
            </main>
        </WebsiteContext.Provider>
    )
}

ReactDom.render(<App/>, document.getElementById("root"))
