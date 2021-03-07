import d3 from "../../../d3"
import {Weya as $, WeyaElementFunction} from '../../../../../lib/weya/weya'
import {PointValue} from "../../../models/run"
import {BASE_COLOR} from "../constants"
import {getExtent, getScale, getSelectedIdx} from "../utils"
import {LineFill, LinePlot} from "../lines/plot"
import {formatFixed} from "../../../utils/value"

export interface SparkLineOptions {
    name: string
    series: PointValue[]
    width: number
    stepExtent: [number, number]
    selected: number
    minLastValue: number
    maxLastValue: number
    onClick?: () => void
    isMouseMoveOpt?: boolean
    color: string
}

export class SparkLine {
    series: PointValue[]
    name: string
    minLastValue: number
    maxLastValue: number
    color: string
    selected: number
    titleWidth: number
    chartWidth: number
    onClick?: () => void
    isMouseMoveOpt?: boolean
    valueElem: HTMLSpanElement
    className: string = 'empty'
    xScale: d3.ScaleLinear<number, number>
    yScale: d3.ScaleLinear<number, number>
    bisect: d3.Bisector<number, number>
    linePlot: LinePlot

    constructor(opt: SparkLineOptions) {
        this.series = opt.series
        this.name = opt.name
        this.selected = opt.selected
        this.onClick = opt.onClick
        this.isMouseMoveOpt = opt.isMouseMoveOpt
        this.color = this.selected >= 0 ? opt.color : BASE_COLOR
        this.titleWidth = Math.min(150, Math.round(opt.width * .375))
        this.chartWidth = opt.width - this.titleWidth * 2
        this.minLastValue = opt.minLastValue
        this.maxLastValue = opt.maxLastValue

        this.yScale = getScale(getExtent([this.series], d => d.value, true), -25)
        this.xScale = getScale(opt.stepExtent, this.chartWidth)

        this.bisect = d3.bisector(function (d: PointValue) {
            return d.step
        }).left

        if (this.onClick != null && this.selected >= 0) {
            this.className = 'selected'
        }

        if (this.onClick != null) {
            this.className += '.list-group-item-action'
        }
    }

    changeCursorValue(cursorStep?: number | null) {
        if (this.selected >= 0 || this.isMouseMoveOpt) {
            this.linePlot.renderCursorCircle(cursorStep)
            this.renderValue(cursorStep)
        }
    }

    renderValue(cursorStep?: number | null) {
        const last = this.series[this.selected >= 0 || this.isMouseMoveOpt ?
            getSelectedIdx(this.series, this.bisect, cursorStep) : this.series.length - 1]

        this.valueElem.innerHTML = ''

        if (Math.abs(last.value - last.smoothed) > Math.abs(last.value) / 1e6) {
            $(this.valueElem, $ => {
                $('span.value-secondary', formatFixed(last.value, 6), {style: {color: this.color}})
                $('span.value-primary', formatFixed(last.smoothed, 6), {style: {color: this.color}})
            })
        } else {
            this.valueElem.classList.add('primary-only')
            $(this.valueElem, $ => {
                $('span.value-primary', formatFixed(last.smoothed, 6), {style: {color: this.color}})
            })
        }
    }

    render($: WeyaElementFunction) {
        $(`div.sparkline-list-item.list-group-item.${this.className}`, {on: {click: this.onClick}}, $ => {
            $('div.sparkline-content', {style: {width: `${this.titleWidth * 2 + this.chartWidth}px`}}, $ => {
                $('span', this.name, {style: {width: `${this.titleWidth}px`, color: this.color}})
                $('svg.sparkline', {style: {width: `${this.chartWidth}px`}, height: 25}, $ => {
                    $('g', {transform: `translate(${0}, 25)`}, $ => {
                        new LineFill({
                            series: this.series,
                            xScale: this.xScale,
                            yScale: this.yScale,
                            color: '#7f8c8d',
                            colorIdx: 9
                        }).render($)
                        this.linePlot = new LinePlot({
                            series: this.series,
                            xScale: this.xScale,
                            yScale: this.yScale,
                            color: '#7f8c8d'
                        })
                        this.linePlot.render($)
                    })
                })
                this.valueElem = <HTMLSpanElement>$('span.value', {style: {width: `${this.titleWidth}px`}})
            })
        })

        this.renderValue()
    }
}
