import {ROUTER} from './app'
import {RunHandler} from './views/run_view'
import {PageNotFoundHandler} from './views/page_not_found_view'
import {RunsListHandler} from './views/runs_list_view'
import {ComputersListHandler} from './views/computers_list_view'
import {LoginHandler} from './views/login_view'
import {SettingsHandler} from './views/settings_view'

import {experimentAnalyses} from "./analyses/analyses"
import {RunHeaderHandler} from "./analyses/experiments/run_header/view"
import {ComputerHandler} from './views/computer_view'

new LoginHandler()

new RunHandler()
new ComputerHandler()
new PageNotFoundHandler()
new RunsListHandler()
new ComputersListHandler()
new SettingsHandler()

new RunHeaderHandler()

experimentAnalyses.map((analysis, i) => {
    new analysis.viewHandler()
})

if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
) {
    ROUTER.start(null, false)
} else {
    document.addEventListener('DOMContentLoaded', () => {
        ROUTER.start(null, false)
    })
}
