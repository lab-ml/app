import {WeyaElementFunction} from '../../../../../lib/weya/weya'
import {ChartOptions} from '../types'
import {SeriesModel} from "../../../models/run"
import {defaultSeriesToPlot, getExtent} from "../utils"
import {CompareSparkLine} from "./spark_line"
import ChartColors from "../chart_colors"
import {DefaultLineGradient} from "../chart_gradients"

interface CompareSparkLinesOptions extends ChartOptions {
    baseSeries: SeriesModel[]
    currentPlotIdx: number[]
    basePlotIdx: number[]
    onCurrentSelect?: (i: number) => void
    onBaseSelect?: (i: number) => void
    isMouseMoveOpt?: boolean
    isDivergent?: boolean
}

export class CompareSparkLines {
    currentSeries: SeriesModel[]
    baseSeries: SeriesModel[]
    currentPlotIdx: number[]
    basePlotIdx: number[]
    isEditable: boolean
    rowWidth: number
    minLastValue: number
    maxLastValue: number
    isMouseMoveOpt: boolean
    stepExtent: [number, number]
    currentColorIndices: number[] = []
    baseColorIndices: number[] = []
    onCurrentSelect?: (i: number) => void
    onBaseSelect?: (i: number) => void
    sparkLines: CompareSparkLine[] = []
    chartColors: ChartColors
    isDivergent?: boolean
    uniqueItems: Map<string, number>

    constructor(opt: CompareSparkLinesOptions) {
        this.currentSeries = opt.series
        this.baseSeries = opt.baseSeries
        this.currentPlotIdx = opt.currentPlotIdx
        this.basePlotIdx = opt.basePlotIdx
        this.onCurrentSelect = opt.onCurrentSelect
        this.onBaseSelect = opt.onBaseSelect
        this.isMouseMoveOpt = opt.isMouseMoveOpt
        this.uniqueItems = new Map<string, number>()

        const margin = Math.floor(opt.width / 64)
        this.rowWidth = Math.min(450, opt.width - 3 * margin)

        let lastValues: number[] = []
        let idx = 0
        for (let s of this.currentSeries.concat(this.baseSeries)) {
            let series = s.series
            lastValues.push(series[series.length - 1].value)
            if (!this.uniqueItems.has(s.name)) {
                this.uniqueItems.set(s.name, idx++)
            }
        }

        this.maxLastValue = Math.max(...lastValues)
        this.minLastValue = Math.min(...lastValues)

        this.stepExtent = getExtent(this.currentSeries.concat(this.baseSeries).map(s => s.series), d => d.step)

        if (this.currentPlotIdx.length === 0) {
            this.currentPlotIdx = defaultSeriesToPlot(this.currentSeries)
        }
        if (this.basePlotIdx.length === 0) {
            this.basePlotIdx = defaultSeriesToPlot(this.baseSeries)
        }

        for (let i = 0; i < this.currentPlotIdx.length; i++) {
            if (this.currentPlotIdx[i] >= 0) {
                this.currentColorIndices.push(i)
            } else {
                this.currentColorIndices.push(-1)
            }
        }
        for (let i = 0; i < this.basePlotIdx.length; i++) {
            if (this.basePlotIdx[i] >= 0) {
                this.baseColorIndices.push(i)
            } else {
                this.baseColorIndices.push(-1)
            }
        }

        this.chartColors = new ChartColors({nColors: this.uniqueItems.size, isDivergent: opt.isDivergent})
    }

    changeCursorValues = (cursorStep?: number | null) => {
        for (let sparkLine of this.sparkLines) {
            sparkLine.changeCursorValue(cursorStep)
        }
    }

    render($: WeyaElementFunction) {
        this.sparkLines = []
        $('div.sparkline-list.list-group', $ => {
            this.currentSeries.map((s, i) => {
                $('svg', {style: {height: `${1}px`}}, $ => {
                    new DefaultLineGradient().render($)
                })
                let onClick
                if (this.onCurrentSelect != null) {
                    onClick = this.onCurrentSelect.bind(null, i)
                }
                let sparkLine = new CompareSparkLine({
                    name: s.name,
                    series: s.series,
                    selected: this.currentPlotIdx[i],
                    stepExtent: this.stepExtent,
                    width: this.rowWidth,
                    onClick: onClick,
                    minLastValue: this.minLastValue,
                    maxLastValue: this.maxLastValue,
                    color: this.chartColors.getColor(this.uniqueItems.get(s.name)),
                    isMouseMoveOpt: this.isMouseMoveOpt
                })
                this.sparkLines.push(sparkLine)
            })
            this.baseSeries.map((s, i) => {
                $('svg', {style: {height: `${1}px`}}, $ => {
                    new DefaultLineGradient().render($)
                })
                let onClick
                if (this.onBaseSelect != null) {
                    onClick = this.onBaseSelect.bind(null, i)
                }
                let sparkLine = new CompareSparkLine({
                    name: s.name,
                    series: s.series,
                    selected: this.basePlotIdx[i],
                    stepExtent: this.stepExtent,
                    width: this.rowWidth,
                    onClick: onClick,
                    minLastValue: this.minLastValue,
                    maxLastValue: this.maxLastValue,
                    color: this.chartColors.getColor(this.uniqueItems.get(s.name)),
                    isMouseMoveOpt: this.isMouseMoveOpt,
                    isDotted: true
                })
                this.sparkLines.push(sparkLine)
            })
            this.sparkLines.sort((a, b) => a.name.localeCompare(b.name))
            this.sparkLines.map(sparkLine => {
                sparkLine.render($)
            })
        })
    }
}
