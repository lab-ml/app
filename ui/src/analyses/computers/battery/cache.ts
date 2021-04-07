import {ComputerStatusCache, AnalysisDataCache, AnalysisPreferenceCache} from "../../../cache/cache"
import {AnalysisCache} from "../../helpers"

class BatteryAnalysisCache extends AnalysisDataCache {
    constructor(uuid: string, statusCache: ComputerStatusCache) {
        super(uuid, 'battery', statusCache)
    }
}

class BatteryPreferenceCache extends AnalysisPreferenceCache {
    constructor(uuid: string) {
        super(uuid, 'battery')
    }
}

let batteryCache = new AnalysisCache('computer', BatteryAnalysisCache, BatteryPreferenceCache)

export default batteryCache
