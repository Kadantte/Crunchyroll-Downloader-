import {Session} from "./license"
import {ipcRenderer} from "electron"

export const getKeys = async (pssh: string, licenseServer: string, authData: any) => {
    const privateKey = await ipcRenderer.invoke("device-private-key")
    const identifierBlob = await ipcRenderer.invoke("device-client-id-blob")

    const psshBuffer = Buffer.from(pssh, "base64")

    const session = new Session({privateKey, identifierBlob}, psshBuffer)
    const response = await fetch(licenseServer, {method: "POST", body: session.createLicenseRequest(), headers: authData})

    if (response.status === 200) {
        const json = await response.json()
        const keys = session.parseLicense(Buffer.from(json["license"], "base64"))
        return keys
    } else {
        return []
    }
}