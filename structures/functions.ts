import axios from "axios"
import fs from "fs"
import path from "path"

export default class functions {
    public static download = async (link: string, dest: string) => {
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
        const bin = await axios.get(link, {responseType: "arraybuffer", headers}).then((r) => r.data)
        fs.writeFileSync(dest, Buffer.from(bin, "binary"))
    }

    public static arrayRemove = <T>(arr: T[], val: T) => {
        return arr.filter(item => item !== val)
    }

    public static removeDuplicates = <T>(arr: T[]) => {
        return [...new Set(arr)];
    }

    public static timeout = async (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    public static formatMS = (ms: number) => {
        const sec = ms / 1000
        const hours = parseInt(String(Math.floor(sec / 3600)), 10)
        const minutes = parseInt(String(Math.floor(sec / 60) % 60), 10)
        const seconds = parseInt(String(sec % 60), 10)
        const str = [hours, minutes, seconds]
            .map((v) => v < 10 ? "0" + v : v)
            .filter((v, i) => v !== "00" || i > 0)
            .join(":")
        return str.startsWith("0") ? str.slice(1) : str
    }

    public static epRegex = (html: string) => {
        let seasonTitle = html.match(/(?<=<title>)(.*?)(?= Episode)/i)?.[0]
        if (!seasonTitle) seasonTitle = html.match(/(?<=<title>)(.*?)(?= Episodio)/i)?.[0]
        if (!seasonTitle) seasonTitle = html.match(/(?<=<title>)(.*?)(?= Episódio)/i)?.[0]
        if (!seasonTitle) seasonTitle = html.match(/(?<=<title>)(.*?)(?= Épisode)/i)?.[0]
        if (!seasonTitle) seasonTitle = html.match(/(?<=<title>)(.*?)(?= Folge)/i)?.[0]
        if (!seasonTitle) seasonTitle = html.match(/(?<=<title>)(.*?)(?= الحلقة)/i)?.[0]
        if (!seasonTitle) seasonTitle = html.match(/(?<=<title>)(.*?)(?= Серия)/i)?.[0]
        return seasonTitle
    }

    public static stripLocale = (link: string) => {
        return link
        .replace("/en-gb/", "/")
        .replace("/es/", "/")
        .replace("/es-es/", "/")
        .replace("/pt-br/", "/")
        .replace("/pt-pt/", "/")
        .replace("/fr/", "/")
        .replace("/de/", "/")
        .replace("/ar/", "/")
        .replace("/it/", "/")
        .replace("/ru/", "/")
        .replace("https://www.crunchyroll.com/", "https://www.crunchyroll.com/en-gb/")
    }

    public static parseLocale = (locale: string, hidive?: boolean) => {
        if (locale === "all") return "All"
        if (locale === "jaJP") return "Japanese"
        if (locale === "enUS") return "English"
        if (locale === "enGB") return "English"
        if (locale === "esES") return hidive ? "Spanish Europe" : "Spanish"
        if (locale === "esLA") return hidive ? "Spanish LatAm" : "Spanish"
        if (locale === "frFR") return "French"
        if (locale === "deDE") return "German"
        if (locale === "itIT") return "Italian"
        if (locale === "ruRU") return "Russian"
        if (locale === "ptBR") return "Portuguese"
        if (locale === "ptPT") return "Portuguese"
        if (locale === "arME") return "Arabic"
        if (locale.toLowerCase() === "japanese") return "jaJP"
        if (locale.toLowerCase() === "english") return "enUS"
        if (locale.toLowerCase() === "spanish") return "esES"
        if (locale.toLowerCase() === "french") return "frFR"
        if (locale.toLowerCase() === "german") return "deDE"
        if (locale.toLowerCase() === "italian") return "itIT"
        if (locale.toLowerCase() === "russian") return "ruRU"
        if (locale.toLowerCase() === "portuguese") return "ptPT"
        if (locale.toLowerCase() === "arabic") return "arME"
        return "None"
    }

    public static dashLocale = (locale: string) => {
        if (locale === "ja-JP") return "Japanese"
        if (locale === "en-US") return "English"
        if (locale === "en-GB") return "English"
        if (locale === "es-ES") return "Spanish"
        if (locale === "es-419") return "Spanish"
        if (locale === "fr-FR") return "French"
        if (locale === "de-DE") return "German"
        if (locale === "it-IT") return "Italian"
        if (locale === "ru-RU") return "Russian"
        if (locale === "pt-BR") return "Portuguese"
        if (locale === "pt-PT") return "Portuguese"
        if (locale === "ar-SA") return "Arabic"
        if (locale === "hi-IN") return "Hindi"
        if (locale === "jaJP") return "ja-JP"
        if (locale === "enUS") return "en-US"
        if (locale === "enGB") return "en-GB"
        if (locale === "esES") return "es-ES"
        if (locale === "esLA") return "es-419"
        if (locale === "frFR") return "fr-FR"
        if (locale === "deDE") return "de-DE"
        if (locale === "itIT") return "it-IT"
        if (locale === "ruRU") return "ru-RU"
        if (locale === "ptBR") return "pt-BR"
        if (locale === "ptPT") return "pt-PT"
        if (locale === "arME") return "ar-SA"
        if (locale === "hiIN") return "hi-IN"
        if (locale === "JP") return "ja-JP"
        if (locale === "US") return "en-US"
        if (locale === "GB") return "en-GB"
        if (locale === "ES") return "es-ES"
        if (locale === "LA") return "es-419"
        if (locale === "FR") return "fr-FR"
        if (locale === "DE") return "de-DE"
        if (locale === "IT") return "it-IT"
        if (locale === "RU") return "ru-RU"
        if (locale === "BR") return "pt-BR"
        if (locale === "PT") return "pt-PT"
        if (locale === "ME") return "ar-SA"
        if (locale === "HI") return "hi-IN"
        if (locale === "all") return "all"
        // id-ID
        // ms-MY
        // th-TH
        // vi-VN
        // ta-IN
        return "None"
    }

    public static removeDirectory = (dir: string) => {
        if (dir === "/" || dir === "./") return
        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach(function(entry) {
                const entryPath = path.join(dir, entry)
                if (fs.lstatSync(entryPath).isDirectory()) {
                    functions.removeDirectory(entryPath)
                } else {
                    fs.unlinkSync(entryPath)
                }
            })
            try {
                fs.rmdirSync(dir)
            } catch (e) {
                console.log(e)
            }
        }
    }

    public static skipWall = (url: string) => {
        return url.includes("?") ? `${url}&skip_wall=1` : `${url}?skip_wall=1`
    }

    public static getDialect = (language: string, englishDialect: string, spanishDialect: string, portugeuseDialect: string) => {
        let dialect = language
        if (language === "enUS") if (englishDialect === "UK") dialect = "enGB"
        if (language === "esLA") if (spanishDialect === "ES") dialect = "esES"
        if (language === "ptBR") if (portugeuseDialect === "PT") dialect = "ptPT"
        if (dialect === "all") dialect = "enUS"
        return dialect
    }

    public static reverseRGB = (rgb: string) => {
        const r = rgb.slice(0, 2)
        const g = rgb.slice(2, 4)
        const b = rgb.slice(4, 6)
        return b + g + r
    }

    public static headerObj = (headers?: string[]) => {
        if (!headers?.length) return {}
        let obj = {} as any
        for (let i = 0; i < headers.length; i++) {
            const split = headers[i].split(":")
            obj[split[0]] = split[1].trim()
        }
        return obj
    }

    public static convertSeconds = (time: string) => {
        if (!time.includes(":")) return +time
        return +time.split(":").reduce((acc: string, time: string) => (60 * +acc) + +time as any)
    }
}