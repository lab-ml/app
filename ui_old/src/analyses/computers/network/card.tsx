import React from "react"

import {useLocation} from "react-router-dom"

import {SummaryCardProps, Analysis} from "../../types"
import {BasicSparkTimeLines} from "../../../components/charts/summary_views"
import ComputerHeaderCard from "../computer_header/card"
import {BasicTimeSeriesView} from "../../../components/charts/detail_views"
import {Cache} from "../../common"
import {SeriesCache, SeriesPreferenceCache, ComputerStatusCache} from "../../../cache/cache"

const TITLE = 'Network'
const URL = 'network'

class NetworkAnalysisCache extends SeriesCache {
    constructor(uuid: string, statusCache: ComputerStatusCache) {
        super(uuid, 'network', statusCache)
    }
}


class NetworkPreferenceCache extends SeriesPreferenceCache {
    constructor(uuid: string) {
        super(uuid, 'network')
    }
}


let cache = new Cache('computer', NetworkAnalysisCache, NetworkPreferenceCache)


function AnalysisSummary(props: SummaryCardProps) {
    return <BasicSparkTimeLines title={TITLE}
                                url={URL}
                                cache={cache}
                                uuid={props.uuid}
                                ref={props.refreshRef}
                                chartHeightFraction={4}
                                isSetPreferences={true}
                                width={props.width}/>
}

function AnalysisDetails() {
    const location = useLocation()

    return <BasicTimeSeriesView title={TITLE}
                                cache={cache}
                                location={location}
                                headerCard={ComputerHeaderCard}/>
}


let NetworkAnalysis: Analysis = {
    card: AnalysisSummary,
    view: AnalysisDetails,
    route: `${URL}`
}

export default NetworkAnalysis
