import {WeyaElementFunction} from '../../../../../lib/weya/weya'
import CACHE, {RunCache, RunStatusCache} from "../../../cache/cache"
import {CardProps} from "../../types"
import {Run} from "../../../models/run"
import {Status} from "../../../models/status"
import {StatusView} from "../../../components/status"
import {getTimeDiff, formatTime} from "../../../utils/time"

interface CardOptions extends CardProps {
    lastUpdated?: number
}

export class RunHeaderCard {
    run: Run
    status: Status
    lastUpdated: number
    runCache: RunCache
    statusCache: RunStatusCache

    constructor(opt: CardOptions) {
        this.lastUpdated = opt.lastUpdated
        this.runCache = CACHE.getRun(opt.uuid)
        this.statusCache = CACHE.getRunStatus(opt.uuid)
        this.lastUpdated = opt.lastUpdated ? opt.lastUpdated : this.statusCache.lastUpdated
    }

    render($: WeyaElementFunction) {
        this.LoadData().then(() => {
            $('div.labml-card.labml-card-action', $ => {
                $('div', $ => {
                    let lastRecorded = this.status.last_updated_time
                    $('div.last-updated.mb-2', `Last Recorded ${this.status.isStatusInProgress ?
                        getTimeDiff(lastRecorded * 1000) : formatTime(lastRecorded)}`)
                    $('div.run-info', $ => {
                        new StatusView({status: this.status.run_status}).render($)
                        $('h3', `${this.run.name}`)
                        $('h5', `${this.run.comment}`)
                        if (this.status.isStatusInProgress) {
                            $('div.last-updated.text-info', `${getTimeDiff(this.lastUpdated)}`)
                        }
                    })
                })
            })
        })
    }

    private async LoadData() {
        this.status = await this.statusCache.get()
        this.run = await this.runCache.get()
    }
}
