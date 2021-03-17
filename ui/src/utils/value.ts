import d3 from "../d3"
import {WeyaElementFunction} from "../../../lib/weya/weya"
import {type} from "os";

const FORMAT = d3.format(".3s")

function numberWithCommas(x: string) {
    const parts = x.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.join('.')
}

export function formatScalar(value: number) {
    let str = value.toFixed(2)
    if (str.length <= 10) {
        str = value.toPrecision(10)
    }

    return numberWithCommas(str)
}

export function formatStep(step: number) {
    return FORMAT(step)
}

export function formatFixed(value: number, decimals: number) {
    if (Math.abs(value) > 10000) {
        return FORMAT(value)
    }

    if (Math.abs(value) > 1) {
        decimals = 3
    }

    let str = value.toFixed(decimals)

    return numberWithCommas(str)
}

export function formatInt(value: number) {
    let str = value.toString()
    return numberWithCommas(str)
}

export function scaleValue(value: number, minValue: number, maxValue: number) {
    value = Math.abs(value)
    minValue = Math.abs(minValue)
    maxValue = Math.abs(maxValue)

    return (value - minValue) / (maxValue - minValue)
}

export class FormattedValue {
    value: any

    constructor(opt: { value: any }) {
        this.value = opt.value
    }

    render($: WeyaElementFunction) {
        if (typeof this.value === 'boolean') {
            $('span.boolean', this.value.toString())
        } else if (typeof this.value === 'number') {
            if (this.value - Math.floor(this.value) < 1e-9) {
                $('span.int', formatInt(this.value))
            } else {
                $('span.float', formatInt(this.value))
            }
        } else if (typeof this.value === 'string') {
            $('span.string', this.value)
        } else if (this.value instanceof Array) {
            $('span.subtle', '[')
            for (let i = 0; i < this.value.length; ++i) {
                if (i > 0) {
                    $('span.subtle', ', ')
                }
                new FormattedValue({value: this.value[i]}).render($)
            }
            $('span.subtle', ']')
        } else if (typeof this.value === 'object') {
            $('span', '{ ')
            for (const k in this.value) {
                $('span.object-key', `${k}` + ': ')
                $('span.object-value', `${this.value[k]}`)
                $('span', ' ')
            }
            $('span', '}')
        } else {
            $('span.unknown', this.value)
        }
    }
}

export function pickHex(weight: number) {
    let w1: number = weight
    let w2: number = 1 - w1

    const color1 = [53, 88, 108]
    const color2 = [89, 149, 183]

    let rgb = [Math.round(color1[0] * w1 + color2[0] * w2),
        Math.round(color1[1] * w1 + color2[1] * w2),
        Math.round(color1[2] * w1 + color2[2] * w2)]

    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}

