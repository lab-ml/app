import {ScreenView} from "../../../screen"
import {Run, SeriesModel} from "../../../models/run"
import CACHE, {AnalysisDataCache, AnalysisPreferenceCache, RunCache, RunStatusCache} from "../../../cache/cache"
import {Weya as $, WeyaElement} from "../../../../../lib/weya/weya"
import {Status} from "../../../models/status"
import {DataLoader} from "../../../components/loader"
import {ROUTER, SCREEN} from "../../../app"
import {BackButton, SaveButton, ToggleButton} from "../../../components/buttons"
import {RunHeaderCard} from "../run_header/card"
import {ComparisonPreferenceModel} from "../../../models/preferences"
import comparisonCache from "./cache"
import {getChartType, toPointValues} from "../../../components/charts/utils"
import mix_panel from "../../../mix_panel"
import {ViewHandler} from "../../types"
import {AwesomeRefreshButton} from '../../../components/refresh_button'
import {handleNetworkErrorInplace} from '../../../utils/redirect'
import {setTitle} from '../../../utils/document'
import {CompareLineChart} from '../../../components/charts/compare_lines/chart'
import {CompareSparkLines} from '../../../components/charts/compare_spark_lines/chart'

class ComparisonView extends ScreenView {
    elem: HTMLDivElement
    currentUuid: string
    baseUuid: string
    status: Status
    currentPlotIdx: number[] = []
    basePlotIdx: number[] = []
    currentChart: number
    statusCache: RunStatusCache
    currentSeries: SeriesModel[]
    baseSeries: SeriesModel[]
    preferenceData: ComparisonPreferenceModel
    baseAnalysisCache: AnalysisDataCache
    currentAnalysisCache: AnalysisDataCache
    preferenceCache: AnalysisPreferenceCache
    runHeaderCard: RunHeaderCard
    sparkLines: CompareSparkLines
    lineChartContainer: HTMLDivElement
    sparkLinesContainer: HTMLDivElement
    saveButtonContainer: HTMLDivElement
    toggleButtonContainer: HTMLDivElement
    saveButton: SaveButton
    isUpdateDisable: boolean
    actualWidth: number
    private loader: DataLoader;
    private refresh: AwesomeRefreshButton;
    private runCache: RunCache
    private run: Run

    constructor(uuid: string) {
        super()

        this.currentUuid = uuid
        this.currentChart = 0
        this.runCache = CACHE.getRun(this.currentUuid)
        this.statusCache = CACHE.getRunStatus(this.currentUuid)
        this.currentAnalysisCache = comparisonCache.getAnalysis(this.currentUuid)
        this.preferenceCache = comparisonCache.getPreferences(this.currentUuid)

        this.isUpdateDisable = true
        this.saveButton = new SaveButton({onButtonClick: this.updatePreferences, parent: this.constructor.name})

        this.loader = new DataLoader(async (force) => {
            this.preferenceData = <ComparisonPreferenceModel>await this.preferenceCache.get(force)
            this.baseUuid = this.preferenceData.base_experiment
            this.baseAnalysisCache = comparisonCache.getAnalysis(this.baseUuid)
            this.status = await this.statusCache.get(force)
            this.run = await this.runCache.get()
            this.currentSeries = toPointValues((await this.currentAnalysisCache.get(force)).series)
            this.baseSeries = toPointValues((await this.baseAnalysisCache.get(force)).series)
        })
        this.refresh = new AwesomeRefreshButton(this.onRefresh.bind(this))

        mix_panel.track('Analysis View', {uuid: this.currentUuid, analysis: this.constructor.name})
    }

    get requiresAuth(): boolean {
        return false
    }

    onResize(width: number) {
        super.onResize(width)

        this.actualWidth = Math.min(800, width)

        if (this.elem) {
            this._render().then()
        }
    }

    async _render() {
        setTitle({section: 'Metrics'})
        this.elem.innerHTML = ''
        $(this.elem, $ => {
            $('div', '.page',
                {style: {width: `${this.actualWidth}px`}},
                $ => {
                    $('div', $ => {
                        $('div', '.nav-container', $ => {
                            new BackButton({text: 'Run', parent: this.constructor.name}).render($)
                            this.saveButtonContainer = $('div')
                            this.refresh.render($)
                        })
                        this.runHeaderCard = new RunHeaderCard({
                            uuid: this.currentUuid,
                            width: this.actualWidth
                        })
                        this.runHeaderCard.render($).then()
                        this.toggleButtonContainer = $('div')
                        $('h2', '.header.text-center', 'Metrics')
                        this.loader.render($)
                        $('div', '.detail-card', $ => {
                            this.lineChartContainer = $('div', '.fixed-chart')
                            this.sparkLinesContainer = $('div')
                        })
                    })
                })
        })

        try {
            await this.loader.load()

            setTitle({section: 'Comparison', item: this.run.name})
            this.calcPreferences()

            this.renderSparkLines()
            this.renderLineChart()
            this.renderSaveButton()
            this.renderToggleButton()
        } catch (e) {
            handleNetworkErrorInplace(e)
        } finally {
            if (this.status && this.status.isRunning) {
                this.refresh.attachHandler(this.runHeaderCard.renderLastRecorded.bind(this.runHeaderCard))
                this.refresh.start()
            }
        }
    }

    render(): WeyaElement {
        this.elem = $('div')

        this._render().then()

        return this.elem
    }

    destroy() {
        this.refresh.stop()
    }

    async onRefresh() {
        try {
            await this.loader.load(true)

            this.calcPreferences()
            this.renderSparkLines()
            this.renderLineChart()
        } catch (e) {

        } finally {
            if (this.status && !this.status.isRunning) {
                this.refresh.stop()
            }
            await this.runHeaderCard.refresh().then()
        }
    }

    onVisibilityChange() {
        this.refresh.changeVisibility(!document.hidden)
    }

    renderSaveButton() {
        this.saveButton.disabled = this.isUpdateDisable
        this.saveButtonContainer.innerHTML = ''
        $(this.saveButtonContainer, $ => {
            this.saveButton.render($)
        })
    }

    renderToggleButton() {
        this.toggleButtonContainer.innerHTML = ''
        $(this.toggleButtonContainer, $ => {
            new ToggleButton({
                onButtonClick: this.onChangeScale,
                text: 'Log',
                isToggled: this.currentChart > 0,
                parent: this.constructor.name
            }).render($)
        })
    }

    renderLineChart() {
        this.lineChartContainer.innerHTML = ''
        $(this.lineChartContainer, $ => {
            let zxc = new CompareLineChart({
                series: this.currentSeries,
                baseSeries: this.baseSeries,
                width: this.actualWidth,
                currentPlotIdx: this.currentPlotIdx,
                basePlotIdx: this.basePlotIdx,
                chartType: getChartType(this.currentChart),
                onCursorMove: [this.sparkLines.changeCursorValues],
                isCursorMoveOpt: true,
                isDivergent: true
            })
            zxc.render($)
        })
    }

    renderSparkLines() {
        this.sparkLinesContainer.innerHTML = ''
        $(this.sparkLinesContainer, $ => {
            this.sparkLines = new CompareSparkLines({
                series: this.currentSeries,
                baseSeries: this.baseSeries,
                currentPlotIdx: this.currentPlotIdx,
                basePlotIdx: this.basePlotIdx,
                width: this.actualWidth,
                onCurrentSelect: this.toggleCurrentChart,
                onBaseSelect: this.toggleBaseChart,
                isDivergent: true
            })
            this.sparkLines.render($)
        })
    }

    toggleCurrentChart = (idx: number) => {
        this.isUpdateDisable = false

        if (this.currentPlotIdx[idx] >= 0) {
            this.currentPlotIdx[idx] = -1
        } else {
            this.currentPlotIdx[idx] = Math.max(...this.currentPlotIdx) + 1
        }

        if (this.currentPlotIdx.length > 1) {
            this.currentPlotIdx = new Array<number>(...this.currentPlotIdx)
        }

        this.renderSparkLines()
        this.renderLineChart()
        this.renderSaveButton()
    }
    toggleBaseChart = (idx: number) => {
        this.isUpdateDisable = false

        if (this.basePlotIdx[idx] >= 0) {
            this.basePlotIdx[idx] = -1
        } else {
            this.basePlotIdx[idx] = Math.max(...this.basePlotIdx) + 1
        }

        if (this.basePlotIdx.length > 1) {
            this.basePlotIdx = new Array<number>(...this.basePlotIdx)
        }

        this.renderSparkLines()
        this.renderLineChart()
        this.renderSaveButton()
    }

    private calcPreferences() {
        this.currentChart = this.preferenceData.chart_type

        let currentAnalysisPreferences = this.preferenceData.series_preferences
        if (currentAnalysisPreferences && currentAnalysisPreferences.length > 0) {
            this.currentPlotIdx = [...currentAnalysisPreferences]
        } else if (this.currentSeries) {
            let res: number[] = []
            for (let i = 0; i < this.currentSeries.length; i++) {
                res.push(i)
            }
            this.currentPlotIdx = res
        }
        let baseAnalysisPreferences = this.preferenceData.base_series_preferences
        if (baseAnalysisPreferences && baseAnalysisPreferences.length > 0) {
            this.basePlotIdx = [...baseAnalysisPreferences]
        } else if (this.baseSeries) {
            let res: number[] = []
            for (let i = 0; i < this.baseSeries.length; i++) {
                res.push(i)
            }
            this.basePlotIdx = res
        }
    }

    onChangeScale = () => {
        this.isUpdateDisable = false

        if (this.currentChart === 1) {
            this.currentChart = 0
        } else {
            this.currentChart = this.currentChart + 1
        }

        this.renderLineChart()
        this.renderSaveButton()
    }

    updatePreferences = () => {
        this.preferenceData.series_preferences = this.currentPlotIdx
        this.preferenceData.base_series_preferences = this.basePlotIdx
        this.preferenceData.chart_type = this.currentChart
        this.preferenceCache.setPreference(this.preferenceData).then()

        this.isUpdateDisable = true
        this.renderSaveButton()
    }
}

export class ComparisonHandler extends ViewHandler {
    constructor() {
        super()
        ROUTER.route('run/:uuid/compare', [this.handleComparison])
    }

    handleComparison = (uuid: string) => {
        SCREEN.setView(new ComparisonView(uuid))
    }
}
