import {IsUserLogged} from '../models/user'
import {ROUTER, SCREEN} from '../app'
import {Weya as $, WeyaElement} from '../../../lib/weya/weya'
import {ScreenView} from "../screen"
import {Loader} from "../components/loader"
import CACHE, {IsUserLoggedCache, RunsListCache} from "../cache/cache"
import {RunListItemModel} from '../models/run_list'
import {ListItemView} from '../components/list_item'
import {SearchView} from '../components/search';
import {CancelButton, DeleteButton, EditButton, RefreshButton} from '../components/buttons';

class RunsListView extends ScreenView {
    runListCache: RunsListCache
    currentRunsList: RunListItemModel[]
    isUserLogged: IsUserLogged
    isUserLoggedCache: IsUserLoggedCache
    elem: WeyaElement
    runsListContainer: HTMLDivElement
    btnContainer: HTMLDivElement
    loader: Loader
    searchQuery: string
    buttonContainer: HTMLDivElement
    deleteButton: DeleteButton
    editButton: EditButton
    refreshButton: RefreshButton
    cancelButton: CancelButton
    isEditMode: boolean
    runsDeleteSet: Set<string>

    constructor() {
        super()

        this.runListCache = CACHE.getRunsList()
        this.isUserLoggedCache = CACHE.getIsUserLogged()

        this.loader = new Loader()
        this.searchQuery = ''
        this.isEditMode = false
        this.runsDeleteSet = new Set<string>()
    }

    render() {
        this.elem = <HTMLElement>$('div', $ => {
            this.buttonContainer = <HTMLDivElement>$('div.button-container', $ => {
                this.deleteButton = new DeleteButton({
                    onButtonClick: this.onDelete
                })
                this.editButton = new EditButton({
                    onButtonClick: this.onEdit
                })
                this.refreshButton = new RefreshButton({
                    onButtonClick: this.onRefresh
                })
                this.cancelButton = new CancelButton({
                    onButtonClick: this.onCancel
                })
            })
            $('div.runs-list', $ => {
                new SearchView({onSearch: this.onSearch}).render($)
                this.runsListContainer = <HTMLDivElement>$('div.list', '')
            })
            this.loader.render($)
        })

        this.renderList().then()

        return this.elem
    }

    renderButtons() {
        this.buttonContainer.innerHTML = ''
        $(this.buttonContainer, $ => {
            if (this.currentRunsList.length) {
                if (this.isEditMode) {
                    this.cancelButton.render($)
                    this.deleteButton.render($)
                } else {
                    this.refreshButton.render($)
                    this.editButton.render($)
                }
            }
        })
    }

    private async renderList() {
        this.currentRunsList = (await this.runListCache.get()).runs
        this.isUserLogged = await this.isUserLoggedCache.get()

        let re = new RegExp(this.searchQuery.toLowerCase(), 'g')
        this.currentRunsList = this.currentRunsList.filter(run => this.runsFilter(run, re))

        this.loader.remove()
        this.renderButtons()


        this.runsListContainer.innerHTML = ''
        $(this.runsListContainer, $ => {
            for (let i = 0; i < this.currentRunsList.length; i++) {
                new ListItemView({item: this.currentRunsList[i], onClick: this.onItemClicked}).render($)
            }
        })
    }

    runsFilter = (run: RunListItemModel, query: RegExp) => {
        let name = run.name.toLowerCase()
        let comment = run.comment.toLowerCase()

        return (name.search(query) !== -1 || comment.search(query) !== -1)
    }

    onRefresh = async () => {
        this.currentRunsList = (await this.runListCache.get(true)).runs
        await this.renderList()
    }

    onEdit = () => {
        this.isEditMode = true
        this.renderButtons()
    }

    onDelete = async () => {
        await this.runListCache.deleteRuns(this.runsDeleteSet)
        await this.renderList()
    }

    onCancel = () => {
        this.isEditMode = false
        this.renderButtons()
    }

    onItemClicked = (elem: ListItemView) => {
        let uuid = elem.item.run_uuid
        if(!this.isEditMode) {
            ROUTER.navigate(`/run/${uuid}`)
            return
        }

        if(this.runsDeleteSet.has(uuid)){
            this.runsDeleteSet.delete(uuid)
            elem.elem.classList.remove('.selected')
        }

        this.runsDeleteSet.add(uuid)
        elem.elem.classList.add('.selected')

    }

    onSearch = (query: string) => {
        this.searchQuery = query
        this.renderList().then()
    }

}

export class RunsListHandler {
    constructor() {
        ROUTER.route('runs', [this.handleRunsList])
    }

    handleRunsList = () => {
        SCREEN.setView(new RunsListView())
    }
}
