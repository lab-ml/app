import React from "react"

import {useLocation} from "react-router-dom"

import {SummaryCardProps, Analysis} from "../../types"
import {BasicSparkTimeLines} from "../../../components/charts/summary_views"
import ComputerHeaderCard from "../computer_header/card"
import {BasicTimeSeriesView} from "../../../components/charts/detail_views"
import {Cache} from "../../common"
import {SeriesCache, SeriesPreferenceCache, ComputerStatusCache} from "../../../cache/cache"

const TITLE = 'Disk'
const URL = 'disk'

class DiskAnalysisCache extends SeriesCache {
    constructor(uuid: string, statusCache: ComputerStatusCache) {
        super(uuid, 'disk', statusCache)
    }
}


class DiskPreferenceCache extends SeriesPreferenceCache {
    constructor(uuid: string) {
        super(uuid, 'disk')
    }
}


let cache = new Cache('computer', DiskAnalysisCache, DiskPreferenceCache)


function AnalysisSummary(props: SummaryCardProps) {
    return <BasicSparkTimeLines title={TITLE}
                                url={URL}
                                cache={cache}
                                uuid={props.uuid}
                                ref={props.refreshRef}
                                chartHeightFraction={4}
                                isSetPreferences={true}
                                forceYStart={0}
                                width={props.width}/>
}

function AnalysisDetails() {
    const location = useLocation()

    return <BasicTimeSeriesView title={TITLE}
                                cache={cache}
                                location={location}
                                forceYStart={0}
                                headerCard={ComputerHeaderCard}/>
}


let DiskAnalysis: Analysis = {
    card: AnalysisSummary,
    view: AnalysisDetails,
    route: `${URL}`
}

export default DiskAnalysis
