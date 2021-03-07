import d3 from "../../../d3"
import {WeyaElement, WeyaElementFunction} from '../../../../../lib/weya/weya'
import {ChartOptions} from '../types'
import {SeriesModel} from "../../../models/run"
import {defaultSeriesToPlot, getExtent, getLogScale, getScale} from "../utils"
import {LineFill, LinePlot} from "./plot"
import {BottomAxis, RightAxis} from "../axis"
import {formatStep} from "../../../utils/value"
import {LineGradients, DropShadow, DefaultLineGradient} from "../chart_gradients"
import ChartColors from "../chart_colors"


interface LineChartOptions extends ChartOptions {
    plotIdx: number[]
    onSelect?: (i: number) => void
    chartType: string
    onCursorMove?: ((cursorStep?: number | null) => void)[]
    isCursorMoveOpt?: boolean
    isDivergent?: boolean
}

export class LineChart {
    series: SeriesModel[]
    plotIdx: number[]
    plot: SeriesModel[] = []
    filteredPlotIdx: number[] = []
    chartType: string
    chartWidth: number
    chartHeight: number
    margin: number
    axisSize: number
    labels: string[] = []
    xScale: d3.ScaleLinear<number, number>
    yScale: d3.ScaleLinear<number, number>
    svgElem: WeyaElement
    stepElement: WeyaElement
    linePlots: LinePlot[] = []
    onCursorMove?: ((cursorStep?: number | null) => void)[]
    isCursorMoveOpt?: boolean
    chartColors: ChartColors
    isDivergent: boolean

    constructor(opt: LineChartOptions) {
        this.series = opt.series
        this.chartType = opt.chartType
        this.plotIdx = opt.plotIdx
        this.onCursorMove = opt.onCursorMove ? opt.onCursorMove : []
        this.isCursorMoveOpt = opt.isCursorMoveOpt

        this.axisSize = 30
        let windowWidth = opt.width
        this.margin = Math.floor(windowWidth / 64)
        this.chartWidth = windowWidth - 2 * this.margin - this.axisSize
        this.chartHeight = Math.round(this.chartWidth / 2)

        if (this.plotIdx.length === 0) {
            this.plotIdx = defaultSeriesToPlot(this.series)
        }

        for (let i = 0; i < this.plotIdx.length; i++) {
            if (this.plotIdx[i] >= 0) {
                this.filteredPlotIdx.push(i)
                this.plot.push(this.series[i])
            }
        }
        if (this.plotIdx.length > 0 && Math.max(...this.plotIdx) < 0) {
            this.plot = [this.series[0]]
            this.filteredPlotIdx = [0]
        }

        const stepExtent = getExtent(this.series.map(s => s.series), d => d.step)
        this.xScale = getScale(stepExtent, this.chartWidth, false)

        this.chartColors = new ChartColors({nColors: this.series.length, isDivergent: opt.isDivergent})
    }

    chartId = `chart_${Math.round(Math.random() * 1e9)}`

    changeScale() {
        let plotSeries = this.plot.map(s => s.series)

        if (this.chartType === 'log') {
            this.yScale = getLogScale(getExtent(plotSeries, d => d.value, false, true), -this.chartHeight)
        } else {
            this.yScale = getScale(getExtent(plotSeries, d => d.value, false), -this.chartHeight)
        }
    }

    updateCursorStep(ev: TouchEvent | MouseEvent) {
        let cursorStep: number = null
        let clientX = ev instanceof TouchEvent ? ev.touches[0].clientX : ev.clientX

        if (clientX) {
            const info = this.svgElem.getBoundingClientRect()
            let currentX = this.xScale.invert(clientX - info.left - this.margin)
            if (currentX > 0) {
                cursorStep = currentX
            }
        }

        this.renderStep(cursorStep)
        for (let linePlot of this.linePlots) {
            linePlot.renderCursorCircle(cursorStep)
        }
        for (let func of this.onCursorMove) {
            func(cursorStep)
        }
    }

    renderStep(cursorStep: number) {
        this.stepElement.textContent = `Step : ${formatStep(cursorStep)}`
    }

    render($: WeyaElementFunction) {
        this.changeScale()

        if (this.series.length === 0) {
            $('div', '')
        } else {
            $('div', $ => {
                $('div', $ => {
                        this.stepElement = $('h6.text-center.selected-step')
                        this.svgElem = $('svg', '#chart',
                            {
                                height: 2 * this.margin + this.axisSize + this.chartHeight,
                                width: 2 * this.margin + this.axisSize + this.chartWidth,
                            }, $ => {
                                new DefaultLineGradient().render($)
                                new DropShadow().render($)
                                new LineGradients({chartColors: this.chartColors, chartId: this.chartId}).render($)
                                $('g',
                                    {
                                        transform: `translate(${this.margin}, ${this.margin + this.chartHeight})`
                                    }, $ => {
                                        if (this.plot.length < 3) {
                                            this.plot.map((s, i) => {
                                                new LineFill({
                                                    series: s.series,
                                                    xScale: this.xScale,
                                                    yScale: this.yScale,
                                                    color: this.chartColors.getColor(this.filteredPlotIdx[i]),
                                                    colorIdx: this.filteredPlotIdx[i],
                                                    chartId: this.chartId
                                                }).render($)
                                            })
                                        }
                                        this.plot.map((s, i) => {
                                            let linePlot = new LinePlot({
                                                series: s.series,
                                                xScale: this.xScale,
                                                yScale: this.yScale,
                                                color: this.chartColors.getColor(this.filteredPlotIdx[i])
                                            })
                                            this.linePlots.push(linePlot)
                                            linePlot.render($)
                                        })
                                    })
                                $('g.bottom-axis',
                                    {
                                        transform: `translate(${this.margin}, ${this.margin + this.chartHeight})`
                                    }, $ => {
                                        new BottomAxis({chartId: this.chartId, scale: this.xScale}).render($)
                                    })
                                $('g.right-axis',
                                    {
                                        transform: `translate(${this.margin + this.chartWidth}, ${this.margin + this.chartHeight})`
                                    }, $ => {
                                        new RightAxis({chartId: this.chartId, scale: this.yScale}).render($)
                                    })
                            })
                    }
                )
            })
            if (this.isCursorMoveOpt) {
                this.svgElem.addEventListener('touchmove', this.updateCursorStep.bind(this))
                this.svgElem.addEventListener('touchstart', this.updateCursorStep.bind(this))
                this.svgElem.addEventListener('mousemove', this.updateCursorStep.bind(this))
            }
        }
    }
}
