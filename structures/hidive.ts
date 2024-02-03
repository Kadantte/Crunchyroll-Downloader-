import crypto from "crypto"
import got from "got"

const devName = "Android"
const apiKey = "508efd7b42d546e19cc24f4d0b414e57e351ca73"
const appId = "24i-Android"
const clientExpo = "smartexoplayer/1.6.0.R (Linux;Android 6.0) ExoPlayerLib/2.6.0"
const clientWeb = "okhttp/3.4.1"

export default class HIDIVE {
    private cookie: string
    private client: {
        ip: string
        nonce: string
        signature: string
        visitId: string
        profile: {
          userId: number
          profileId: number
          deviceId : string
        }
    }

    public constructor() {
        this.cookie = ""
        this.client = {
            ip: "", nonce: "", signature: "", visitId: "", profile: {userId: 0, profileId: 0, deviceId: ""}
        }
    }

    private generateNonce = () => {
        const initDate = new Date()
        const nonceDate = [
          initDate.getUTCFullYear().toString().slice(-2),
          ("0"+(initDate.getUTCMonth()+1)).slice(-2),
          ("0"+initDate.getUTCDate()).slice(-2),
          ("0"+initDate.getUTCHours()).slice(-2),
          ("0"+initDate.getUTCMinutes()).slice(-2)
        ].join("")
        const nonceCleanStr = nonceDate + apiKey
        const nonceHash = crypto.createHash("sha256").update(nonceCleanStr).digest("hex")
        return nonceHash
    }
    
    private generateSignature = (visitId: string, profile: any) => {
        const sigCleanStr = [
            this.client.ip,
            appId,
            profile.deviceId,
            visitId,
            profile.userId,
            profile.profileId,
            this.client.nonce,
            apiKey,
        ].join("")
        return crypto.createHash("sha256").update(sigCleanStr).digest("hex")
    }

    public login = async (email: string, password: string) => {
        const auth = await this.post("Authenticate", {"Email": email, "Password": password})
        this.client.profile.userId = auth.Data.User.Id
        this.client.profile.profileId = auth.Data.Profiles[0].Id
    }

    public init = async () => {
        const newIp = await this.post("Ping")
        this.client.ip = newIp.IPAddress
        const newDevice = await this.post("InitDevice", {"DeviceName": devName})
        this.client.profile.deviceId = newDevice.Data.DeviceId
        const newVisitId = await this.post("InitVisit")
        this.client.visitId = newVisitId.Data.VisitId
    }

    public get = async (endpoint: string) => {
        let headers = {
            cookie: this.cookie,
            "User-Agent": clientExpo,
            referer: "https://www.hidive.com/",
            origin: "https://www.hidive.com/"
        }

        let url = `https://api.hidive.com/api/v1/${endpoint}`

        this.client.nonce = this.generateNonce()
        this.client.signature = this.generateSignature(this.client.visitId, this.client.profile)
        url += "?" + new URLSearchParams({
            "X-VisitId" : this.client.visitId,
            "X-UserId" : String(this.client.profile.userId),
            "X-ProfileId" : String(this.client.profile.profileId),
            "X-DeviceId" : this.client.profile.deviceId,
            "X-Nonce" : this.client.nonce,
            "X-Signature" : this.client.signature
        }).toString()

        return got(url, {headers}).then((r) => JSON.parse(r.body))
    }

    public post = async (endpoint: string, body: any = {}) => {
        let headers = {
            cookie: this.cookie,
            "User-Agent": clientExpo,
            referer: "https://www.hidive.com/",
            origin: "https://www.hidive.com/",
            "Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8",
            "X-ApplicationId": appId
        }

        const url = `https://api.hidive.com/api/v1/${endpoint}`

        if (endpoint !== "Ping") {
            this.client.nonce = this.generateNonce()
            this.client.signature = this.generateSignature(this.client.visitId, this.client.profile)
            headers = {...headers, ...{
                "X-VisitId" : this.client.visitId,
                "X-UserId" : this.client.profile.userId,
                "X-ProfileId" : this.client.profile.profileId,
                "X-DeviceId" : this.client.profile.deviceId,
                "X-Nonce" : this.client.nonce,
                "X-Signature" : this.client.signature
            }}
        }

        const request = await got(url, {method: "POST", body: JSON.stringify(body), headers})
        const newCookie = request.headers["set-cookie"]?.join("")
        if (newCookie) this.cookie = newCookie
        return JSON.parse(request.body)
    }
}