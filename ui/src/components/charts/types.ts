import {SeriesModel} from "../../models/run"

export interface SeriesProps {
    series: SeriesModel[]
    plotIdx: number[]
    width: number
    onSelect?: (i: number) => void
    currentX?: number
}

export interface LineChartProps extends SeriesProps {
    chartType?: 'log' | 'normal'
}

export let chartTypes: 'log' | 'normal'
