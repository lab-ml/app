import Card from "../../card"
import {SeriesModel} from "../../../models/run"
import {SeriesCache} from "../../../cache/cache"
import {Weya, WeyaElement, WeyaElementFunction} from "../../../../../lib/weya/weya"
import {Loader} from "../../../components/loader"
import {CardOptions} from "../../types";
import gpuCache from "./cache"
import {getSeriesData} from "./utils"
import {Labels} from "../../../components/charts/labels"
import {TimeSeriesChart} from "../../../components/charts/timeseries/chart"
import {ROUTER} from "../../../app"

export class GPUMemoryCard extends Card {
    uuid: string
    width: number
    series: SeriesModel[]
    analysisCache: SeriesCache
    lineChartContainer: WeyaElement
    elem: WeyaElement
    loader: Loader
    plotIdx: number[] = []

    constructor(opt: CardOptions) {
        super()

        this.uuid = opt.uuid
        this.width = opt.width
        this.analysisCache = gpuCache.getAnalysis(this.uuid)
        this.loader = new Loader()
    }

    getLastUpdated(): number {
        return this.analysisCache.lastUpdated
    }

    async render($: WeyaElementFunction) {
        this.elem = $('div.labml-card.labml-card-action', {on: {click: this.onClick}}, $ => {
            $('h3.header', 'GPU - Memory')
        })

        this.elem.appendChild(this.loader.render($))
        this.series = getSeriesData((await this.analysisCache.get()).series, 'memory', true)
        this.loader.remove()

        Weya(this.elem, $ => {
            this.lineChartContainer = $('div', '')
            new Labels({labels: Array.from(this.series, x => x['name'])}).render($)
        })

        if (this.series.length > 0) {
            this.renderLineChart()
        } else {
            this.elem.classList.add('hide')
        }
    }

    renderLineChart() {
        let res: number[] = []
        for (let i = 0; i < this.series.length; i++) {
            res.push(i)
        }
        this.plotIdx = res

        this.lineChartContainer.innerHTML = ''
        Weya(this.lineChartContainer, $ => {
            new TimeSeriesChart({
                series: this.series,
                width: this.width,
                plotIdx: this.plotIdx,
                chartHeightFraction: 4
            }).render($)
        })
    }

    async refresh() {
        this.series = getSeriesData((await this.analysisCache.get(true)).series, 'memory', true)

        if (this.series.length > 0) {
            this.renderLineChart()
            this.elem.classList.remove('hide')
        }
    }

    onClick = () => {
        ROUTER.navigate(`/session/${this.uuid}/gpu_memory`)
    }
}