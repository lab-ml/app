import {WeyaElement, WeyaElementFunction, Weya} from '../../../../../lib/weya/weya'
import {ROUTER} from '../../../app'
import CACHE, {RunCache, RunStatusCache} from "../../../cache/cache"
import {CardOptions} from "../../types"
import {Run} from "../../../models/run"
import {Status} from "../../../models/status"
import {StatusView} from "../../../components/status"
import {getTimeDiff, formatTime} from "../../../utils/time"


interface RunHeaderOptions extends CardOptions {
    lastUpdated?: number
}

export class RunHeaderCard {
    run: Run
    uuid: string
    status: Status
    lastUpdated: number
    runCache: RunCache
    elem: WeyaElement
    lastRecordedContainer: WeyaElement
    lastUpdatedContainer: WeyaElement
    statusCache: RunStatusCache

    constructor(opt: RunHeaderOptions) {
        this.uuid = opt.uuid
        this.lastUpdated = opt.lastUpdated
        this.runCache = CACHE.getRun(this.uuid)
        this.statusCache = CACHE.getRunStatus(this.uuid)
        this.lastUpdated = opt.lastUpdated ? opt.lastUpdated : this.statusCache.lastUpdated
    }

    async render($: WeyaElementFunction) {
        this.elem = $('div.labml-card.labml-card-action', {on: {click: this.onClick}})

        this.status = await this.statusCache.get()
        this.run = await this.runCache.get()

        Weya(this.elem, $ => {
            $('div', $ => {
                this.lastRecordedContainer = $('div')
                $('div.run-info', $ => {
                    new StatusView({status: this.status.run_status}).render($)
                    $('h3', `${this.run.name}`)
                    $('h5', `${this.run.comment}`)
                    this.lastUpdatedContainer = $('div')
                })
            })
        })

        this.renderLastRecorded()
        this.renderLastUpdated()
    }

    renderLastRecorded() {
        let lastRecorded = this.status.last_updated_time

        this.lastRecordedContainer.innerHTML = ''
        Weya(this.lastRecordedContainer, $ => {
            $('div.last-updated.mb-2', `Last Recorded ${this.status.isRunning ?
                getTimeDiff(lastRecorded * 1000) : formatTime(lastRecorded)}`)
        })
    }

    renderLastUpdated() {
        this.lastUpdatedContainer.innerHTML = ''
        Weya(this.lastUpdatedContainer, $ => {
            if (this.status.isRunning) {
                $('div.last-updated.text-info', `${getTimeDiff(this.lastUpdated)}`)
            }
        })
    }

    async refresh(lastUpdated?: number) {
        this.status = await this.statusCache.get()

        this.lastUpdated = lastUpdated ? lastUpdated : this.statusCache.lastUpdated

        this.renderLastRecorded()
        this.renderLastUpdated()
    }

    onClick = () => {
        ROUTER.navigate(`/run_header/${this.uuid}`)
    }
}
