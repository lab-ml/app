import {ScreenView} from "../../../screen"
import {Weya as $, WeyaElement} from "../../../../../lib/weya/weya"
import {ROUTER, SCREEN} from "../../../app"
import {Run} from "../../../models/run"
import CACHE, {IsUserLoggedCache, RunCache, RunStatusCache} from "../../../cache/cache"
import {Status} from "../../../models/status"
import {BackButton, CancelButton, DeleteButton, EditButton, SaveButton} from "../../../components/buttons"
import EditableField from "../../../components/editable_field"
import {formatTime, getTimeDiff} from "../../../utils/time"
import {DataLoader} from "../../../components/loader"
import {BadgeView} from "../../../components/badge"
import {StatusView} from "../../../components/status"
import mix_panel from "../../../mix_panel"
import {IsUserLogged} from '../../../models/user'
import {handleNetworkError, handleNetworkErrorInplace} from '../../../utils/redirect'
import {setTitle} from '../../../utils/document'

class RunHeaderView extends ScreenView {
    elem: HTMLDivElement
    run: Run
    runCache: RunCache
    status: Status
    statusCache: RunStatusCache
    isUserLogged: IsUserLogged
    isUserLoggedCache: IsUserLoggedCache
    isEditMode: boolean
    uuid: string
    actualWidth: number
    fieldContainer: HTMLDivElement
    nameField: EditableField
    commentField: EditableField
    noteField: EditableField
    private deleteButton: DeleteButton
    private loader: DataLoader

    constructor(uuid: string) {
        super()
        this.uuid = uuid
        this.runCache = CACHE.getRun(this.uuid)
        this.statusCache = CACHE.getRunStatus(this.uuid)
        this.isUserLoggedCache = CACHE.getIsUserLogged()
        this.isEditMode = false

        this.deleteButton = new DeleteButton({onButtonClick: this.onDelete.bind(this), parent: this.constructor.name})

        this.loader = new DataLoader(async (force) => {
            this.status = await this.statusCache.get(force)
            this.run = await this.runCache.get(force)
            this.isUserLogged = await this.isUserLoggedCache.get(force)
        })

        mix_panel.track('Analysis View', {uuid: this.uuid, analysis: this.constructor.name})
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
        setTitle({section: 'Run Details'})
        this.elem.innerHTML = ''
        $(this.elem, $ => {
            $('div', '.page',
                {style: {width: `${this.actualWidth}px`}},
                $ => {
                    $('div', $ => {
                        $('div', '.nav-container', $ => {
                            new BackButton({text: 'Run', parent: this.constructor.name}).render($)
                            if (this.isEditMode) {
                                new CancelButton({
                                    onButtonClick: this.onToggleEdit,
                                    parent: this.constructor.name
                                }).render($)
                                new SaveButton({onButtonClick: this.updateRun, parent: this.constructor.name}).render($)
                                this.deleteButton.render($)
                                this.deleteButton.hide(true)
                            } else {
                                new EditButton({
                                    onButtonClick: this.onToggleEdit,
                                    parent: this.constructor.name
                                }).render($)
                            }
                        })
                        $('h2', '.header.text-center', 'Run Details')
                        this.loader.render($)
                        this.fieldContainer = $('div', '.input-list-container')
                    })
                })
        })

        try {
            await this.loader.load()

            setTitle({section: 'Run Details', item: this.run.name})
            this.renderFields()
        } catch (e) {
            handleNetworkErrorInplace(e)
        } finally {

        }
    }

    render(): WeyaElement {
        this.elem = $('div')

        this._render().then()

        return this.elem
    }

    renderFields() {
        this.fieldContainer.innerHTML = ''
        $(this.fieldContainer, $ => {
            $('ul', $ => {
                this.nameField = new EditableField({
                    name: 'Run Name',
                    value: this.run.name,
                    isEditable: this.isEditMode
                })
                this.nameField.render($)
                this.commentField = new EditableField({
                    name: 'Comment',
                    value: this.run.comment,
                    isEditable: this.isEditMode
                })
                this.commentField.render($)
                $(`li`, $ => {
                    $('span', '.item-key', 'Tags')
                    $('span', '.item-value', $ => {
                        $('div', $ => {
                            this.run.tags.map((tag, idx) => (
                                new BadgeView({text: tag}).render($)
                            ))
                        })
                    })
                })
                this.noteField = new EditableField({
                    name: 'Note',
                    value: this.run.note,
                    placeholder: 'write your note here',
                    numEditRows: 5,
                    isEditable: this.isEditMode
                })
                this.noteField.render($)
                $(`li`, $ => {
                    $('span', '.item-key', 'Run Status')
                    $('span', '.item-value', $ => {
                        new StatusView({status: this.status.run_status}).render($)
                    })
                })
                new EditableField({
                    name: 'UUID',
                    value: this.run.run_uuid,
                }).render($)
                new EditableField({
                    name: 'Start Time',
                    value: formatTime(this.run.start_time),
                }).render($)
                new EditableField({
                    name: 'Last Recorded',
                    value: this.status.isRunning ? getTimeDiff(this.status.last_updated_time * 1000) :
                        formatTime(this.status.last_updated_time),
                }).render($)
                new EditableField({
                    name: 'Start Step',
                    value: this.run.start_step
                }).render($)
                new EditableField({
                    name: 'Python File',
                    value: this.run.python_file
                }).render($)
                $(`li`, $ => {
                    $('span', '.item-key', 'Remote Repo')
                    $('span', '.item-value', $ => {
                        $('a', this.run.repo_remotes, {
                            href: this.run.repo_remotes,
                            target: "_blank",
                            rel: "noopener noreferrer"
                        })
                    })
                })
                $(`li`, $ => {
                    $('span', '.item-key', 'Commit')
                    $('span', '.item-value', $ => {
                        $('a', this.run.commit, {
                            href: this.run.commit,
                            target: "_blank",
                            rel: "noopener noreferrer"
                        })
                    })
                })
                new EditableField({
                    name: 'Commit Message',
                    value: this.run.commit_message
                }).render($)
            })
        })
        this.deleteButton.hide(!(this.isUserLogged.is_user_logged && this.run.is_claimed))
    }

    onToggleEdit = () => {
        this.isEditMode = !this.isEditMode

        this._render().then()
    }

    onDelete = async () => {
        if (confirm("Are you sure?")) {
            try {
                await CACHE.getRunsList().deleteRuns(new Set<string>([this.uuid]))
            } catch (e) {
                handleNetworkError(e)
                return
            }
            ROUTER.navigate('/runs')
        }
    }

    updateRun = () => {
        if (this.nameField.getInput()) {
            this.run.name = this.nameField.getInput()
        }

        if (this.commentField.getInput()) {
            this.run.comment = this.commentField.getInput()
        }

        if (this.noteField.getInput()) {
            this.run.note = this.noteField.getInput()
        }

        this.runCache.setRun(this.run).then()
        this.onToggleEdit()
    }
}

export class RunHeaderHandler {
    constructor() {
        ROUTER.route('run/:uuid/header', [this.handleRunHeader])
    }

    handleRunHeader = (uuid: string) => {
        SCREEN.setView(new RunHeaderView(uuid))
    }
}
