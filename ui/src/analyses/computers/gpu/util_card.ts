import {Weya as $, WeyaElementFunction,} from '../../../../../lib/weya/weya'
import {SeriesModel} from "../../../models/run"
import {Card, CardOptions} from "../../types"
import {AnalysisDataCache} from "../../../cache/cache"
import {DataLoader} from "../../../components/loader"
import gpuCache from './cache'
import {getSeriesData} from './utils'
import {TimeSeriesChart} from "../../../components/charts/timeseries/chart"
import {Labels} from "../../../components/charts/labels"
import {ROUTER} from '../../../app'

export class GPUUtilCard extends Card {
    uuid: string
    width: number
    series: SeriesModel[]
    analysisCache: AnalysisDataCache
    lineChartContainer: HTMLDivElement
    elem: HTMLDivElement
    private loader: DataLoader
    private labelsContainer: HTMLDivElement
    plotIdx: number[] = []

    constructor(opt: CardOptions) {
        super(opt)

        this.uuid = opt.uuid
        this.width = opt.width
        this.analysisCache = gpuCache.getAnalysis(this.uuid)
        this.loader = new DataLoader(async (force) => {
            this.series = getSeriesData((await this.analysisCache.get(force)).series, 'utilization')
        })
    }

    getLastUpdated(): number {
        return this.analysisCache.lastUpdated
    }

    async render($: WeyaElementFunction) {
        this.elem = $('div', '.labml-card.labml-card-action', {on: {click: this.onClick}}, $ => {
            $('h3', '.header', 'GPU - Utilization')
            this.loader.render($)
            this.lineChartContainer = $('div', '')
            this.labelsContainer = $('div', '')
        })

        try {
            await this.loader.load()

            if (this.series.length > 0) {
                this.renderLineChart()
            } else {
                this.elem.classList.add('hide')
            }
        } catch (e) {

        }
    }

    renderLineChart() {
        let res: number[] = []
        for (let i = 0; i < this.series.length; i++) {
            res.push(i)
        }
        this.plotIdx = res

        this.lineChartContainer.innerHTML = ''
        $(this.lineChartContainer, $ => {
            new TimeSeriesChart({
                series: this.series,
                width: this.width,
                plotIdx: this.plotIdx,
                yExtend: [0, 100],
                chartHeightFraction: 4,
                isDivergent: true
            }).render($)
        })

        this.labelsContainer.innerHTML = ''
        $(this.labelsContainer, $ => {
            new Labels({labels: Array.from(this.series, x => x['name']), isDivergent: true}).render($)
        })
    }

    async refresh() {
        try {
            await this.loader.load(true)
            if (this.series.length > 0) {
                this.renderLineChart()
                this.elem.classList.remove('hide')
            }
        } catch (e) {

        }
    }

    onClick = () => {
        ROUTER.navigate(`/session/${this.uuid}/gpu_util`)
    }
}


