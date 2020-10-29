import {CardProps} from "../types";
import React, {useEffect, useState} from "react";
import {Run, Status} from "../../models/run";
import CACHE from "../../cache/cache"
import {formatTime, getTimeDiff} from "../../components/utils";
import {LabLoader} from "../../components/loader";
import {StatusView} from "../../components/status";
import "./style.scss"

interface RunViewProps {
    run: Run
    status: Status
}

function RunView(props: RunViewProps) {
    let runView = null
    if (props.run != null && props.status != null) {
        runView = <div>
            <div className={'run-info'}>
                <StatusView status={props.status.run_status} lastUpdatedTime={props.status.last_updated_time}/>
                <h3>{props.run.name}</h3>
                <h5>{props.run.comment}</h5>
                <div className={"run-uuid"}><span role={'img'} aria-label={'running'}>📌 UUID:</span>{props.run.uuid}
                </div>
                <div className={'start-time'}>Started {formatTime(props.run.start_time)}</div>
            </div>
        </div>
    } else {
        return <LabLoader isLoading={true}/>
    }

    return <div className={'labml-card'}>
         <div className={'last-updated'}>Last updated {getTimeDiff(props.status.last_updated_time)}</div>
        {runView}
    </div>
}

function Card(props: CardProps) {
    const [run, setRun] = useState(null as unknown as Run)
    const [status, setStatus] = useState(null as unknown as Status)
    const runCache = CACHE.getRun(props.uuid)

    useEffect(() => {
        async function load() {
            let status = await runCache.getStatus()
            setStatus(status)
            let run = await runCache.getRun()
            document.title = `LabML: ${run.name.trim()}`
            setRun(run)
        }

        load().then()
            .catch((e) => {
                props.errorCallback(`${e}`)
            })
    })

    useEffect(() => {
        async function loadStatus() {
            let status = await runCache.getStatus()
            setStatus(status)
            if (!status.isRunning) {
                clearInterval(interval)
            }
        }

        let interval = setInterval(loadStatus, 1000)
        return () => clearInterval(interval)
    })

    return <div>
        <RunView run={run} status={status}/>
    </div>
}

export default {
    Card
}