import {ROUTER, SCREEN} from "../../../app"
import {ScreenView} from "../../../screen"
import {Weya as $, WeyaElement} from "../../../../../lib/weya/weya"
import {Run} from "../../../models/run"
import {Status} from "../../../models/status"
import CACHE, {RunCache, RunStatusCache} from "../../../cache/cache"
import {Loader} from "../../../components/loader"
import {BackButton, RefreshButton} from "../../../components/buttons"
import {RunHeaderCard} from "../run_header/card"
import {Configs} from "./components"
import mix_panel from "../../../mix_panel";
import Timeout = NodeJS.Timeout;
import {handleNetworkError} from '../../../utils/redirect';

const AUTO_REFRESH_TIME = 2 * 60 * 1000

class ConfigsView extends ScreenView {
    elem: WeyaElement
    uuid: string
    run: Run
    status: Status
    statusCache: RunStatusCache
    runCache: RunCache
    actualWidth: number
    autoRefresh: Timeout
    loader: Loader
    refreshButton: RefreshButton
    runHeaderCard: RunHeaderCard
    configsView: WeyaElement
    configsContainer: WeyaElement
    lastVisibilityChange: number

    constructor(uuid: string) {
        super()

        this.uuid = uuid
        this.runCache = CACHE.getRun(this.uuid)
        this.statusCache = CACHE.getRunStatus(this.uuid)
        this.loader = new Loader(true)

        mix_panel.track('Analysis View', {uuid: this.uuid, analysis: this.constructor.name})
    }

    get requiresAuth(): boolean {
        return false
    }

    onResize(width: number) {
        super.onResize(width)

        this.actualWidth = Math.min(800, width)
    }

    render() {
        this.elem = <HTMLElement>$('div.page',
            {style: {width: `${this.actualWidth}px`}}, $ => {
                this.configsView = $('div', '')
            })

        this.elem.appendChild(this.loader.render($))

        this.loadData().then(() => {
            this.loader.remove()

            if (this.status.isRunning) {
                this.autoRefresh = setInterval(this.onRefresh.bind(this), AUTO_REFRESH_TIME)
            }

            this.renderConfigs()
        }).catch(() => {
        })

        return this.elem
    }

    async loadData() {
        try {
            this.run = await this.runCache.get()
            this.status = await this.statusCache.get()
        }  catch (e) {
            handleNetworkError(e)
            return
        }
    }

    destroy() {
        if (this.autoRefresh !== undefined) {
            clearInterval(this.autoRefresh)
        }
        if (this.runHeaderCard) {
            this.runHeaderCard.clearCounter()
        }
    }

    async onRefresh() {
        await this.loadData()

        if (!this.status.isRunning) {
            this.refreshButton.remove()
            clearInterval(this.autoRefresh)
        }

        this.renderConfigsView()
        this.runHeaderCard.refresh().then()
    }

    onVisibilityChange() {
        let currentTime = Date.now()
        if (document.hidden) {
            this.lastVisibilityChange = currentTime
            clearInterval(this.autoRefresh)
        } else {
            if (this.status.isRunning) {
                setTimeout(args => {
                    this.onRefresh().then()
                    this.autoRefresh = setInterval(this.onRefresh.bind(this), AUTO_REFRESH_TIME)
                }, Math.max(0, (this.lastVisibilityChange + AUTO_REFRESH_TIME) - currentTime))
            }
        }
    }

    renderConfigs() {
        this.configsView.innerHTML = ''

        $(this.configsView, $ => {
            $('div.nav-container', $ => {
                new BackButton({text: 'Run', parent: this.constructor.name}).render($)
                if (this.status && this.status.isRunning) {
                    this.refreshButton = new RefreshButton({
                        onButtonClick: this.onRefresh.bind(this),
                        parent: this.constructor.name
                    })
                    this.refreshButton.render($)
                }
            })
            this.runHeaderCard = new RunHeaderCard({
                uuid: this.uuid,
                width: this.actualWidth
            })
            this.runHeaderCard.render($).then()
            $('h2.header.text-center', 'Configurations')
            this.configsContainer = $('div.labml-card')
        })

        this.renderConfigsView()
    }

    renderConfigsView() {
        this.configsContainer.innerHTML = ''
        $(this.configsContainer, $ => {
            new Configs({configs: this.run.configs, width: this.actualWidth, isHyperParamOnly: false}).render($)
        })
    }

}


export class ConfigsHandler {
    constructor() {
        ROUTER.route('run/:uuid/configs', [this.handleConfigs])
    }

    handleConfigs = (uuid: string) => {
        SCREEN.setView(new ConfigsView(uuid))
    }
}
