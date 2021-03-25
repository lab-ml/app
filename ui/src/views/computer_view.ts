import {Status} from "../models/status"
import {IsUserLogged} from '../models/user'
import {ROUTER, SCREEN} from '../app'
import {Weya as $, WeyaElement} from '../../../lib/weya/weya'
import {ScreenView} from "../screen"
import {DataLoader} from "../components/loader"
import {BackButton, DeleteButton} from "../components/buttons"
import {Card} from "../analyses/types"
import CACHE, {ComputerCache, ComputerStatusCache, IsUserLoggedCache} from "../cache/cache"
import {Computer} from '../models/computer'
import {ComputerHeaderCard} from '../analyses/computers/computer_header/card'
import {computerAnalyses} from '../analyses/analyses'
import {AlertMessage} from "../components/alert"
import mix_panel from "../mix_panel"
import {handleNetworkError, handleNetworkErrorInplace} from '../utils/redirect'
import {AwesomeRefreshButton} from '../components/refresh_button'

class ComputerView extends ScreenView {
    uuid: string
    computer: Computer
    computerCache: ComputerCache
    status: Status
    statusCache: ComputerStatusCache
    isUserLogged: IsUserLogged
    isUserLoggedCache: IsUserLoggedCache
    actualWidth: number
    elem: HTMLDivElement
    computerHeaderCard: ComputerHeaderCard
    cards: Card[] = []
    lastUpdated: number
    private cardContainer: HTMLDivElement
    private deleteButton: DeleteButton
    private alertMessage: AlertMessage
    private loader: DataLoader
    private refresh: AwesomeRefreshButton

    constructor(uuid: string) {
        super()
        this.uuid = uuid
        this.computerCache = CACHE.getComputer(this.uuid)
        this.statusCache = CACHE.getComputerStatus(this.uuid)
        this.isUserLoggedCache = CACHE.getIsUserLogged()

        this.deleteButton = new DeleteButton({onButtonClick: this.onDelete.bind(this), parent: this.constructor.name})
        this.alertMessage = new AlertMessage({
            message: 'This computer will be deleted in 12 hours. Click here to add it to your computers.',
            onClickMessage: this.onMessageClick.bind(this)
        })

        this.loader = new DataLoader(async (force) => {
            this.computer = await this.computerCache.get(force)
            this.status = await this.statusCache.get(force)
            this.isUserLogged = await this.isUserLoggedCache.get(force)
        })
        this.refresh = new AwesomeRefreshButton(this.onRefresh.bind(this))

        mix_panel.track('Computer View', {uuid: this.uuid})
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
        this.elem.innerHTML = ''
        $(this.elem, $ => {
            $('div', '.run.page',
                {style: {width: `${this.actualWidth}px`}}, $ => {
                    $('div', $ => {
                        this.alertMessage.render($)
                        this.alertMessage.hideMessage(true)
                    })
                    $('div', '.nav-container', $ => {
                        new BackButton({text: 'Computers', parent: this.constructor.name}).render($)
                        this.deleteButton.render($)
                        this.deleteButton.hide(true)
                        this.refresh.render($)
                    })
                    this.computerHeaderCard = new ComputerHeaderCard({
                        uuid: this.uuid,
                        width: this.actualWidth,
                        lastUpdated: this.lastUpdated,
                        clickable: true
                    })
                    this.loader.render($)
                    this.computerHeaderCard.render($)
                    this.cardContainer = $('div')
                })
        })

        try {
            await this.loader.load()

            this.renderCards()
        } catch (e) {
            handleNetworkErrorInplace(e)
        } finally {
            if (this.status && this.status.isRunning) {
                this.refresh.attachHandler(this.computerHeaderCard.renderLastRecorded.bind(this.computerHeaderCard))
                this.refresh.start()
            }
        }
    }

    private renderCards() {
        $(this.cardContainer, $ => {
            computerAnalyses.map((analysis, i) => {
                let card: Card = new analysis.card({uuid: this.uuid, width: this.actualWidth})
                this.cards.push(card)
                card.render($)
            })
        })

        this.alertMessage.hideMessage(!(!this.isUserLogged.is_user_logged && !this.computer.is_claimed))
        this.deleteButton.hide(!(this.isUserLogged.is_user_logged && this.computer.is_claimed))
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
        let oldest = (new Date()).getTime()
        try {
            await this.loader.load(true)
        } catch (e) {

        } finally {
            if (this.status && !this.status.isRunning) {
                this.refresh.stop()
            }

            for (let card of this.cards) {
                card.refresh()

                let lastUpdated = card.getLastUpdated()
                if (lastUpdated < oldest) {
                    oldest = lastUpdated
                }
            }

            this.lastUpdated = oldest
            this.computerHeaderCard.refresh(this.lastUpdated).then()
        }
    }

    onVisibilityChange() {
        this.refresh.changeVisibility(!document.hidden)
    }

    onMessageClick() {
        mix_panel.track('Unclaimed Warning Clicked', {uuid: this.uuid, analysis: this.constructor.name})

        ROUTER.navigate(`/login#return_url=${window.location.pathname}`)
    }

    onDelete = async () => {
        if (confirm("Are you sure?")) {
            try {
                await CACHE.getComputersList().deleteSessions(new Set<string>([this.uuid]))
            } catch (e) {
                handleNetworkError(e)
                return
            }
            ROUTER.navigate('/computers')
        }
    }
}

export class ComputerHandler {
    constructor() {
        ROUTER.route('session/:uuid', [this.handleSession])
    }

    handleSession = (uuid: string) => {
        SCREEN.setView(new ComputerView(uuid))
    }
}
