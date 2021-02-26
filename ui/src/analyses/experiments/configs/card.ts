import {Weya, WeyaElement, WeyaElementFunction} from '../../../../../lib/weya/weya'
import {Run} from "../../../models/run"
import CACHE, {RunCache} from "../../../cache/cache"
import {CardOptions} from "../../types"
import Card from "../../card"
import {Loader} from "../../../components/loader"
import {Configs} from "./components"


export class ConfigsCard extends Card {
    run: Run
    uuid: string
    width: number
    runCache: RunCache
    elem: WeyaElement
    configsContainer: WeyaElement
    loader: Loader

    constructor(opt: CardOptions) {
        super({...opt, path: 'configs'})

        this.uuid = opt.uuid
        this.width = opt.width
        this.runCache = CACHE.getRun(this.uuid)
        this.loader = new Loader()
    }

    getLastUpdated(): number {
        return this.runCache.lastUpdated
    }

    async render($: WeyaElementFunction) {
        this.elem = $('div.labml-card.labml-card-action', {on: {click: this.onClick}}, $ => {
            $('h3.header', 'Configurations')
        })

        this.elem.appendChild(this.loader.render($))
        this.run = await this.runCache.get()
        this.loader.remove()

        Weya(this.elem, $ => {
            this.configsContainer = $('div')
        })

        if (this.run.configs.length > 0) {
            this.renderConfigs()
        } else {
            this.elem.classList.add('hide')
        }
    }

    async refresh() {
        this.run = await this.runCache.get(true)

        if (this.run.configs.length > 0) {
            this.renderConfigs()
            this.elem.classList.remove('hide')
        }
    }

    renderConfigs() {
        this.configsContainer.innerHTML = ''
        Weya(this.configsContainer, $ => {
            new Configs({configs: this.run.configs, width: this.width, isHyperParamOnly: true}).render($)
        })
    }
}