import {ipcRenderer} from "electron"
import React, {useState, useEffect, useContext} from "react"
import EpisodeContainer from "./EpisodeContainer"
import Reorder from "react-reorder"
import {ClearAllContext} from "../renderer"
import {CrunchyrollEpisode, FFmpegProgress} from "../structures/types"
import "../styles/episodecontainerlist.less"

const EpisodeContainerList: React.FunctionComponent = (props) => {
    const {setClearAll} = useContext(ClearAllContext)
    const [containers, setContainers] = useState([] as  Array<{id: number, jsx: any}>)
    useEffect(() => {
        const downloadWaiting = (event: any, info: {id: number, kind: string, episode: CrunchyrollEpisode, format: string}) => {
            const progress = {percent: -1} as FFmpegProgress
            setContainers(prev => {
                let newState = [...prev]
                const index = newState.findIndex((c) => c.id === info.id)
                if (index === -1) newState = [...newState, {id: info.id, jsx: <EpisodeContainer key={info.id} id={info.id} kind={info.kind} format={info.format} episode={info.episode} progress={progress} remove={removeContainer}/>}]
                return newState
            })
        }
        ipcRenderer.on("download-waiting", downloadWaiting)
        return () => {
            ipcRenderer.removeListener("download-waiting", downloadWaiting)
        }
    }, [])

    useEffect(() => {
        update()
    })

    const update = () => {
        let found = containers.length ? true : false
        setClearAll(found)
    }

    const removeContainer = (id: number) => {
        setContainers(prev => {
            const newState = [...prev]
            const index = newState.findIndex((c) => c.id === id)
            if  (index !== -1) newState.splice(index, 1)
            return newState
        })
    }

    const reorder = (event: React.MouseEvent, from: number, to: number) => {
        setContainers(prev => {
            const newState = [...prev]
            newState.splice(to, 0, newState.splice(from, 1)[0])
            return newState
        })
    }

    return (
        <Reorder reorderId="episode-containers" component="ul" holdTime={50} onReorder={reorder}>{
            containers.map((c) => (
                <li key={c.id}>
                    {c.jsx}
                </li>
            ))
        }</Reorder>
    )
}

export default EpisodeContainerList