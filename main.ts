import {app, BrowserWindow, ipcMain, dialog, shell, globalShortcut, session, protocol, webContents} from "electron"
import {autoUpdater} from "electron-updater"
import windowStateKeeper from "electron-window-state"
import debounce from "debounce"
import path from "path"
import fs from "fs"
import axios from "axios"
import Store from "electron-store"
import functions from "./structures/functions"
import crunchyroll, {FFmpegProgress, DownloadOptions, CrunchyrollEpisode} from "crunchyroll.ts"
import process from "process"
import pack from "./package.json"
import "./dev-app-update.yml"

require("@electron/remote/main").initialize()
process.setMaxListeners(0)
let window: Electron.BrowserWindow | null
let website: Electron.BrowserWindow | null
let ffmpegPath = undefined as any
if (process.platform === "darwin") ffmpegPath = path.join(app.getAppPath(), "../../ffmpeg/ffmpeg.app")
if (process.platform === "win32") ffmpegPath = path.join(app.getAppPath(), "../../ffmpeg/ffmpeg.exe")
if (process.platform === "linux") ffmpegPath = path.join(app.getAppPath(), "../../ffmpeg/ffmpeg")
if (!fs.existsSync(ffmpegPath)) ffmpegPath = process.platform === "darwin" ? "ffmpeg/ffmpeg.app" : undefined
autoUpdater.autoDownload = false
const store = new Store()

const history: Array<{id: number, dest: string}> = []
const active: Array<{id: number, dest: string, action: null | "pause" | "stop" | "kill", resume?: () => boolean}> = []
const queue: Array<{started: boolean, info: any, format: string}> = []

ipcMain.handle("update-color", (event, color: string) => {
  window?.webContents.send("update-color", color)
})

ipcMain.handle("trigger-paste", () => {
  window?.webContents.send("trigger-paste")
})

ipcMain.handle("init-settings", () => {
  return store.get("settings", null)
})

ipcMain.handle("store-settings", (event, settings) => {
  const prev = store.get("settings", {}) as object
  store.set("settings", {...prev, ...settings})
})

ipcMain.handle("advanced-settings", () => {
  window?.webContents.send("close-all-dialogs", "settings")
  window?.webContents.send("show-settings-dialog")
})

ipcMain.handle("delete-all", () => {
  window?.webContents.send("delete-all")
})

ipcMain.handle("stop-all", () => {
  window?.webContents.send("stop-all")
})

ipcMain.handle("clear-all", () => {
  window?.webContents.send("clear-all")
})

ipcMain.handle("get-streams", () => {
  return store.get("streams", "")
})

ipcMain.handle("get-episodes-link", () => {
  return store.get("episodes", "")
})

ipcMain.handle("get-object", () => {
  return store.get("object", "")
})

ipcMain.handle("delete-cookies", () => {
  session.defaultSession.clearStorageData()
  store.delete("cookie")
  store.delete("token")
})

ipcMain.handle("get-cookie", () => {
  return store.get("cookie", "")
})

ipcMain.handle("get-token", () => {
  return store.get("token", "")
})

ipcMain.handle("download-url", (event, url, html) => {
  if (window?.isMinimized()) window?.restore()
  window?.focus()
  window?.webContents.send("download-url", url, html)
})

const openWebsite = async () => {
  if (!website) {
    let websiteState = windowStateKeeper({file: "website.json", defaultWidth: 800, defaultHeight: 600})
    website = new BrowserWindow({width: websiteState.width, height: websiteState.height, minWidth: 790, minHeight: 550, frame: false, backgroundColor: "#ffffff", center: false, webPreferences: {nodeIntegration: true, webviewTag: true, contextIsolation: false}})
    await website.loadFile(path.join(__dirname, "crunchyroll.html"))
    require("@electron/remote/main").enable(website.webContents)
    website.on("resize", debounce((event: any) => websiteState.saveState(event.sender), 500))
    website?.on("closed", () => {
      website = null
    })
  } else {
    if (website.isMinimized()) website.restore()
    website.focus()
  }
}

ipcMain.handle("open-url", async (event, url: string) => {
  await openWebsite()
  website?.webContents.send("open-url", url)
})

ipcMain.handle("open-website", async () => {
  if (website) {
    website.close()
  } else {
    await openWebsite()
  }
})

ipcMain.handle("logout", async (event) => {
  await crunchyroll.logout().catch(() => null)
  store.delete("username")
  store.delete("password")
})

ipcMain.handle("init-login", async () => {
  const username = store.get("username", null) as string
  const password = store.get("password", null) as string
  if (username && password) {
    try {
      await crunchyroll.login(username, password)
      return username
    } catch {
      return null
    }
  }
})

ipcMain.handle("login", async (event, username, password) => {
  try {
    const result = await crunchyroll.login(username, password)
    store.set("username", result.user.username)
    store.set("password", password)
    return result.user.username
  } catch (error: any) {
    if (Number(error.response?.status) === 429) {
      return "rate limited"
    }
    return null
  }
})

ipcMain.handle("login-dialog", async (event) => {
  window?.webContents.send("close-all-dialogs", "login")
  window?.webContents.send("show-login-dialog")
})

ipcMain.handle("get-theme", () => {
  return store.get("theme", "light")
})

ipcMain.handle("save-theme", (event, theme: string) => {
  store.set("theme", theme)
})

ipcMain.handle("install-update", async (event) => {
  if (process.platform === "darwin") {
    const update = await autoUpdater.checkForUpdates()
    const url = `${pack.repository.url}/releases/download/v${update.updateInfo.version}/${update.updateInfo.files[0].url}`
    await shell.openExternal(url)
    app.quit()
  } else {
    await autoUpdater.downloadUpdate()
    autoUpdater.quitAndInstall()
  }
})

ipcMain.handle("check-for-updates", async (event, startup: boolean) => {
  window?.webContents.send("close-all-dialogs", "version")
  const update = await autoUpdater.checkForUpdates()
  let newVersion = update.updateInfo.version
  if (pack.version === newVersion) {
    if (!startup) window?.webContents.send("show-version-dialog", null)
  } else {
    window?.webContents.send("show-version-dialog", newVersion)
  }
})

ipcMain.handle("get-downloads-folder", async (event, location: string) => {
  if (store.has("downloads")) {
    return store.get("downloads")
  } else {
    const downloads = app.getPath("downloads")
    store.set("downloads", downloads)
    return downloads
  }
})

ipcMain.handle("open-location", async (event, location: string) => {
  if (!fs.existsSync(location)) return
  shell.showItemInFolder(path.normalize(location))
})

ipcMain.handle("delete-download", async (event, id: number) => {
  let dest = ""
  let index = active.findIndex((a) => a.id === id)
  if (index !== -1) {
    dest = active[index].dest
    active[index].action = "kill"
  } else {
    index = history.findIndex((a) => a.id === id)
    if (index !== -1) dest = history[index].dest
  }
  if (dest) {
    let error = true
    while (fs.existsSync(dest) && error) {
      await functions.timeout(1000)
      try {
        if (fs.statSync(dest).isDirectory()) {
          functions.removeDirectory(dest)
        } else {
          fs.unlinkSync(dest)
        }
        error = false
      } catch {
        // ignore
      }
    }
    return true
  } 
  return false
})

ipcMain.handle("stop-download", async (event, id: number) => {
  const index = active.findIndex((a) => a.id === id)
  if (index !== -1) {
    active[index].action = "stop"
    return true
  }
  return false
})

ipcMain.handle("pause-download", async (event, id: number) => {
  const index = active.findIndex((a) => a.id === id)
  if (index !== -1) active[index].action = "pause"
})

ipcMain.handle("resume-download", async (event, id: number) => {
  const index = active.findIndex((a) => a.id === id)
  if (index !== -1) {
    active[index].action = null
    active[index].resume?.()
  }
})

ipcMain.handle("select-directory", async () => {
  if (!window) return
  const result = await dialog.showOpenDialog(window, {
    properties: ["openDirectory"]
  })
  const dir = result.filePaths[0]
  if (dir) {
    store.set("downloads", dir)
    return dir
  }
})

ipcMain.handle("get-episodes", async (event, query, info) => {
  if (/crunchyroll.com/.test(query)) return null
  let start = null as any
  let end = null as any
  if (/\d *- *\d/.test(query)) {
    let part = query.match(/(?<= )\d(.*?)(?=$)/)?.[0]
    start = Number(part.split("-")[0]) - 1
    end = Number(part.split("-")[1])
    query = query.replace(part, "").trim()
  }
  let episodes = null
  if (/\d{5,}/.test(query)) {
    const anime = await crunchyroll.anime.get(query).catch(() => query)
    episodes = await crunchyroll.anime.episodes(anime, info).catch(() => null)
  } else {
    const season = await crunchyroll.season.get(query, info).catch(() => query)
    episodes = await crunchyroll.anime.episodes(season, info).catch(() => null)
  }
  return start !== null ? episodes?.slice(start, end) : episodes
})

ipcMain.handle("get-episode", async (event, query, info) => {
  // if (/beta/.test(query)) return null
  if (!/\d+/.test(query)) return null
  if (/\d *- *\d/.test(query)) return null
  const episode = await crunchyroll.episode.get(query, info).catch(() => null)
  if (!episode && /\d{5,}/.test(query) && /episode/.test(query)) return query
  return episode
})

const nextQueue = async (info: any) => {
  const index = active.findIndex((a) => a.id === info.id)
  if (index !== -1) active.splice(index, 1)
  const settings = store.get("settings", {}) as any
  let qIndex = queue.findIndex((q) => q.info.id === info.id)
  if (qIndex !== -1) {
    queue.splice(qIndex, 1)
    let concurrent = Number(settings?.queue)
    if (Number.isNaN(concurrent) || concurrent < 1) concurrent = 1
    if (active.length < concurrent) {
      const next = queue.find((q) => !q.started)
      if (next) {
        if (next.format === "ass") { 
          await downloadSubtitles(next.info).catch((err: Error) => {
            console.log(err)
            window?.webContents.send("download-error", "download")
          })
        } else {
          await downloadEpisode(next.info, next.info.episode).catch((err: Error) => {
            console.log(err)
            window?.webContents.send("download-error", "download")
          })
        }
      }
    }
  }
}

const downloadEpisode = async (info: any, episode: CrunchyrollEpisode) => {
  let qIndex = queue.findIndex((q) => q.info.id === info.id)
  if (qIndex !== -1) queue[qIndex].started = true
  let format = "mp4"
  if (info.softSubs) format = "mkv"
  if (info.codec === "vp8") format = "webm"
  if (info.audioOnly) format = "mp3"
  if (info.skipConversion) format = "m3u8"
  if (info.thumbnails) format = "png"
  let dest = crunchyroll.util.parseDest(episode, format, info.dest, info.template, info.playlist, info.language)
  const videoProgress = (progress: FFmpegProgress, resume: () => boolean) => {
    window?.webContents.send("download-progress", {id: info.id, progress})
    let index = active.findIndex((e) => e.id === info.id)
    if (index !== -1) {
      if (!active[index].resume) active[index].resume = resume
      let action = active[index].action
      if (action) {
        if (action === "kill") active.splice(index, 1)
        return action
      }
    }
  }
  history.push({id: info.id, dest})
  active.push({id: info.id, dest, action: null})
  window?.webContents.send("download-started", {id: info.id, kind: info.kind, episode, format})
  await functions.timeout(100)
  if (fs.existsSync(dest)) {
    if (fs.statSync(dest).isDirectory()) {
      const files = fs.readdirSync(dest)
      if (files.length) {
        window?.webContents.send("download-ended", {id: info.id, output: dest, skipped: true})
        return nextQueue(info)
      }
    } else {
      if (info.skipConversion) {
        window?.webContents.send("download-ended", {id: info.id, output: dest, skipped: true})
        return nextQueue(info)
      }
      const duration1 = await crunchyroll.util.parseDuration(dest, ffmpegPath)
      const duration2 = await crunchyroll.util.parseDuration(info.playlist, ffmpegPath)
      if (Math.abs(Math.round(duration1) - Math.round(duration2)) < 500) {
        window?.webContents.send("download-ended", {id: info.id, output: dest, skipped: true})
        return nextQueue(info)
      }
    }
  }
  info.ffmpegPath = ffmpegPath
  let output = ""
  if (info.thumbnails) {
    output = await crunchyroll.util.downloadThumbnails(episode, info.dest, info)
  } else {
    output = await crunchyroll.util.downloadEpisode(episode, info.dest, info, videoProgress)
  }
  if (info.skipConversion) {
    await functions.download(output, dest)
    output = dest
  }
  window?.webContents.send("download-ended", {id: info.id, output})
  nextQueue(info)
}

const downloadSubtitles = async (info: any) => {
  let qIndex = queue.findIndex((q) => q.info.id === info.id)
  if (qIndex !== -1) queue[qIndex].started = true
  let output = crunchyroll.util.parseDest(info.episode, "ass", info.dest, info.template, null, info.language)
  const folder = path.dirname(output)
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true})
  history.push({id: info.id, dest: output})
  active.push({id: info.id, dest: output, action: null})
  window?.webContents.send("download-started", {id: info.id, episode: info.episode, format: "ass", kind: info.kind})
  await functions.timeout(100)
  if (fs.existsSync(output)) {
    window?.webContents.send("download-ended", {id: info.id, output, skipped: true})
    return nextQueue(info)
  }
  const data = await axios.get(info.url).then((r) => r.data)
  fs.writeFileSync(output, data)
  window?.webContents.send("download-ended", {id: info.id, output})
  nextQueue(info)
}

ipcMain.handle("download-subtitles", async (event, info) => {
  let format = "ass"
  window?.webContents.send("download-waiting", {id: info.id, kind: info.kind, episode: info.episode, format})
  queue.push({info, started: false, format})
  const settings = store.get("settings", {}) as any
  let concurrent = Number(settings?.queue)
  if (Number.isNaN(concurrent) || concurrent < 1) concurrent = 1
  if (active.length < concurrent) {
    await downloadSubtitles(info).catch((err: Error) => {
      console.log(err)
      window?.webContents.send("download-error", "download")
    })
  }
})

ipcMain.handle("download-error", async (event, info) => {
    window?.webContents.send("download-error", info)
})

ipcMain.handle("update-concurrency", async (event, concurrent) => {
  if (Number.isNaN(concurrent) || concurrent < 1) concurrent = 1
  let counter = active.length
  while (counter < concurrent) {
    const next = queue.find((q) => !q.started)
    if (next) {
      counter++
      if (next.format === "ass") {
        await downloadSubtitles(next.info).catch((err: Error) => {
          console.log(err)
          window?.webContents.send("download-error", "download")
        })
      } else {
        await downloadEpisode(next.info, next.info.episode).catch((err: Error) => {
          console.log(err)
          window?.webContents.send("download-error", "download")
        })
      }
    } else {
      break
    }
  }
})


ipcMain.handle("move-queue", async (event, id: number) => {
  const settings = store.get("settings", {}) as any
  let concurrent = Number(settings?.queue)
  if (Number.isNaN(concurrent) || concurrent < 1) concurrent = 1
  if (id) {
    let qIndex = queue.findIndex((q) => q.info.id === id)
    if (qIndex !== -1) queue.splice(qIndex, 1)
  }
  if (active.length < concurrent) {
    const next = queue.find((q) => !q.started)
    if (next) {
      if (next.format === "ass") {
        await downloadSubtitles(next.info).catch((err: Error) => {
          console.log(err)
          window?.webContents.send("download-error", "download")
        })
      } else {
        await downloadEpisode(next.info, next.info.episode).catch((err: Error) => {
          console.log(err)
          window?.webContents.send("download-error", "download")
        })
      }
    }
  }
})

ipcMain.handle("download", async (event, info) => {
  let format = "mp4"
  if (info.softSubs) format = "mkv"
  if (info.codec === "vp8") format = "webm"
  if (info.audioOnly) format = "mp3"
  if (info.skipConversion) format = "m3u8"
  if (info.thumbnails) format = "png"
  window?.webContents.send("download-waiting", {id: info.id, kind: info.kind, episode: info.episode, format})
  queue.push({info, started: false, format})
  const settings = store.get("settings", {}) as any
  let concurrent = Number(settings?.queue)
  if (Number.isNaN(concurrent) || concurrent < 1) concurrent = 1
  if (active.length < concurrent) {
    await downloadEpisode(info, info.episode).catch((err: Error) => {
      console.log(err)
      window?.webContents.send("download-error", "download")
    })
  }
})

ipcMain.handle("webview-id", async (event, id) => {
  const contents = webContents.fromId(id)!
  contents.debugger.attach("1.3")
  
  contents.debugger.on("detach", (event, reason) => { 
    console.log("Debugger detached due to: ", reason)
  })
  
  contents.debugger.on("message", (event, method, params) => {
    if (method === "Network.requestWillBeSentExtraInfo") {
      if (params.headers[":path"] === "/auth/v1/token") {
        let cookie = params.headers.cookie
        store.set("cookie", cookie)
      }
    }
    if (method === "Network.responseReceived") {
      if (params.response.url === "https://www.crunchyroll.com/auth/v1/token") {
        contents.debugger.sendCommand("Network.getResponseBody", {requestId: params.requestId}).then((response) => {
          const token = JSON.parse(response.body).access_token
          store.set("token", token)
        })
      }
    }
  })
  contents.debugger.sendCommand("Network.enable")
})

const singleLock = app.requestSingleInstanceLock()

if (!singleLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    if (window) {
      if (window.isMinimized()) window.restore()
      window.focus()
    }
  })

  app.on("ready", () => {
    let mainWindowState = windowStateKeeper({file: "main.json", defaultWidth: 800, defaultHeight: 600})
    window = new BrowserWindow({width: mainWindowState.width, height: mainWindowState.height, minWidth: 790, minHeight: 550, frame: false, backgroundColor: "#f97540", center: true, webPreferences: {nodeIntegration: true, contextIsolation: false}})
    window.loadFile(path.join(__dirname, "index.html"))
    window.removeMenu()
    require("@electron/remote/main").enable(window.webContents)
    if (ffmpegPath && process.platform !== "win32" && process.env.DEVELOPMENT !== "true") fs.chmodSync(ffmpegPath, "777")
    window.on("resize", debounce((event: any) => mainWindowState.saveState(event.sender), 500))
    window.on("close", () => {
      website?.close()
      for (let i = 0; i < active.length; i++) {
        active[i].action = "stop"
      }
    })
    window.on("closed", () => {
      window = null
    })
    try {
      window.webContents.debugger.attach("1.3")
    } catch (error) {
      console.log("Debugger attach failed: ", error)
    }
    globalShortcut.register("Control+Shift+I", () => {
      window?.webContents.toggleDevTools()
      website?.webContents.toggleDevTools()
    })
    session.defaultSession.webRequest.onSendHeaders({urls: ["https://www.crunchyroll.com/", "https://www.crunchyroll.com/login"]}, (details) => {
      let cookie = details.requestHeaders["Cookie"]
      console.log(cookie)
      cookie = cookie.match(/(__cf_bm)(.*)/)?.[0]!
      store.set("cookie", cookie)
    })
    session.defaultSession.webRequest.onCompleted({urls: ["https://www.crunchyroll.com/cms/*"]}, (details) => {
      if (details.url.includes("objects/")) store.set("object", encodeURI(details.url))
      if (details.url.includes("videos/")) store.set("streams", encodeURI(details.url))
      if (details.url.includes("/episodes?")) store.set("episodes", encodeURI(details.url))
    })
  })
}