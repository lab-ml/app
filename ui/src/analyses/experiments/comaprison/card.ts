import {Weya as $, WeyaElement, WeyaElementFunction,} from '../../../../../lib/weya/weya'
import {InsightModel, SeriesModel} from "../../../models/run"
import {AnalysisPreferenceModel, ComparisonPreferenceModel} from "../../../models/preferences"
import {Card, CardOptions} from "../../types"
import {AnalysisDataCache, AnalysisPreferenceCache} from "../../../cache/cache"
import {getChartType, toPointValues} from "../../../components/charts/utils"
import {LineChart} from "../../../components/charts/lines/chart"
import {SparkLines} from "../../../components/charts/spark_lines/chart"
import InsightsList from "../../../components/insights_list"
import {ROUTER} from '../../../app'
import {DataLoader} from '../../../components/loader'
import comparisonCache from './cache'

export class ComparisonCard extends Card {
    currentUuid: string
    baseUuid: string
    width: number
    currentSeries: SeriesModel[]
    baseSeries: SeriesModel[]
    // series: SeriesModel[]
    preferenceData: ComparisonPreferenceModel
    baseAnalysisCache: AnalysisDataCache
    currentAnalysisCache: AnalysisDataCache
    elem: HTMLDivElement
    lineChartContainer: WeyaElement
    sparkLinesContainer: WeyaElement
    preferenceCache: AnalysisPreferenceCache
    currentPlotIdx: number[] = []
    basePlotIdx: number[] = []
    private loader: DataLoader

    constructor(opt: CardOptions) {
        super(opt)

        this.currentUuid = opt.uuid
        this.width = opt.width
        this.currentAnalysisCache = comparisonCache.getAnalysis(this.currentUuid)
        this.preferenceCache = comparisonCache.getPreferences(this.currentUuid)
        this.loader = new DataLoader(async (force) => {
            this.preferenceData = <ComparisonPreferenceModel>await this.preferenceCache.get(force)
            this.baseUuid = this.preferenceData.compared_with
            this.baseAnalysisCache = comparisonCache.getAnalysis(this.baseUuid)
            let currentAnalysisData = await this.currentAnalysisCache.get(force)
            this.currentSeries = toPointValues(currentAnalysisData.series)
            let baseAnalysisData = await this.baseAnalysisCache.get(force)
            this.baseSeries = toPointValues(baseAnalysisData.series)
        })
    }

    getLastUpdated(): number {
        return this.currentAnalysisCache.lastUpdated
    }

    async render($: WeyaElementFunction) {
        this.elem = $('div', '.labml-card.labml-card-action', {on: {click: this.onClick}}, $ => {
            $('h3','.header', 'Metrics')
            this.loader.render($)
            this.lineChartContainer = $('div', '')
            this.sparkLinesContainer = $('div', '')
        })

        try {
            await this.loader.load()

            let currentAnalysisPreferences = this.preferenceData.series_preferences
            if (currentAnalysisPreferences.length > 0) {
                this.currentPlotIdx = [...currentAnalysisPreferences]
            }
            let baseAnalysisPreferences = this.preferenceData.base_series_preferences
            if (baseAnalysisPreferences.length > 0) {
                this.basePlotIdx = [...baseAnalysisPreferences]
            }

            if (this.series.length > 0) {
                this.renderLineChart()
                this.renderSparkLines()
            } else {
                this.elem.classList.add('hide')
            }
        } catch (e) {
        }
    }

    renderLineChart() {
        this.lineChartContainer.innerHTML = ''
        $(this.lineChartContainer, $ => {
            new LineChart({
                series: this.series,
                width: this.width,
                plotIdx: this.plotIdx,
                chartType: this.preferenceData && this.preferenceData.chart_type ?
                    getChartType(this.preferenceData.chart_type) : 'linear',
                isDivergent: true
            }).render($)
        })
    }

    renderSparkLines() {
        this.sparkLinesContainer.innerHTML = ''
        $(this.sparkLinesContainer, $ => {
            new SparkLines({
                series: this.series,
                plotIdx: this.plotIdx,
                width: this.width,
                isDivergent: true
            }).render($)
        })
    }

    async refresh() {
        try {
            await this.loader.load(true)
            if (this.series.length > 0) {
                this.renderLineChart()
                this.renderSparkLines()
                this.elem.classList.remove('hide')
            }
        } catch (e) {
        }
    }

    onClick = () => {
        ROUTER.navigate(`/run/${this.currentUuid}/compare`)
    }
}
