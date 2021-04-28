import {Weya as $, WeyaElement, WeyaElementFunction} from "../../../lib/weya/weya"
import {ROUTER} from '../app'
import runHeaderAnalysis from '../analyses/experiments/run_header'
import mix_panel from "../mix_panel"

interface buttonOptions {
    onButtonClick?: () => void
    isDisabled?: boolean
    parent: string
}

abstract class Button {
    onButtonClick: () => void
    isDisabled: boolean
    parent: string
    elem?: WeyaElement

    protected constructor(opt: buttonOptions) {
        this.onButtonClick = opt.onButtonClick
        this.isDisabled = opt.isDisabled ? opt.isDisabled : false
        this.parent = opt.parent
    }

    set disabled(isDisabled: boolean) {
        this.isDisabled = isDisabled
        if (this.elem) {
            if (this.isDisabled) {
                this.elem.classList.add('disabled')
                return
            }
            this.elem.classList.remove('disabled')
        }
    }

    onClick = (e: Event) => {
        mix_panel.track(`${this.constructor.name} Clicked`, {parent: this.parent})

        e.preventDefault()
        if (!this.isDisabled) {
            this.onButtonClick()
        }
    }

    hide = (isHidden: boolean) => {
        if (this.elem == null) {
            return
        }
        if (isHidden) {
            this.elem.classList.add('hide')
        } else {
            this.elem.classList.remove('hide')
        }
    }

    render($: WeyaElementFunction) {
    }
}

interface BackButtonOptions extends buttonOptions {
    text: string
}

export class BackButton extends Button {
    currentPath: string
    navigatePath: string
    text: string = 'Home'

    constructor(opt: BackButtonOptions) {
        super(opt)

        this.text = opt.text
        this.currentPath = window.location.pathname

        if (/\/run\/.+\/.+/.test(this.currentPath)) {
            this.text = 'Run'
            this.navigatePath = this.currentPath.replace(/\/run\/(.+)\/.+/, '/run/$1')
        } else if (/\/session\/.+\/.+/.test(this.currentPath)) {
            this.text = 'Computer'
            this.navigatePath = this.currentPath.replace(/\/session\/(.+)\/.+/, '/session/$1')
        } else if (this.currentPath.includes('run')) {
            this.text = 'Runs'
            this.navigatePath = 'runs'
        } else if (this.currentPath.includes('session')) {
            this.text = 'Computers'
            this.navigatePath = 'computers'
        } else if (this.currentPath.includes(runHeaderAnalysis.route)) {
            this.text = 'Run'
            this.navigatePath = this.currentPath.replace(runHeaderAnalysis.route, 'run')
        }
    }

    onClick = () => {
        if (ROUTER.canBack()) {
            ROUTER.back()
            return
        }
        ROUTER.navigate(this.navigatePath)
    }

    render($: WeyaElementFunction) {
        this.elem = $('nav', `.nav-link.tab.float-left${this.isDisabled ? '.disabled' : ''}`,
            {on: {click: this.onClick}},
            $ => {
                $('span', '.fas.fa-chevron-left', '')
                $('span', '.ms-1', this.text)
            })
    }
}

export class RefreshButton extends Button {

    constructor(opt: buttonOptions) {
        super(opt)
    }

    render($: WeyaElementFunction) {
        this.elem = $('nav', `.nav-link.tab.float-right${this.isDisabled ? '.disabled' : ''}`,
            {on: {click: this.onClick}},
            $ => {
                $('span', '.fas.fa-sync', '')
            })
    }

    remove() {
        this.elem.remove()
    }
}

export class SaveButton extends Button {
    constructor(opt: buttonOptions) {
        super(opt)
    }

    render($: WeyaElementFunction) {
        this.elem = $('nav', `.nav-link.tab.float-right${this.isDisabled ? '.disabled' : ''}`,
            {on: {click: this.onClick}},
            $ => {
                $('span', '.fas.fa-save', '')
            })
    }
}

export class EditButton extends Button {
    constructor(opt: buttonOptions) {
        super(opt)
    }

    render($: WeyaElementFunction) {
        this.elem = $('nav', `.nav-link.tab.float-right${this.isDisabled ? '.disabled' : ''}`,
            {on: {click: this.onClick}},
            $ => {
                $('span', '.fas.fa-edit', '')
            })
    }

    remove() {
        this.elem.remove()
    }
}

export class DeleteButton extends Button {
    constructor(opt: buttonOptions) {
        super(opt)
    }

    render($: WeyaElementFunction) {
        this.elem = $('nav', `.nav-link.tab.float-right.danger${this.isDisabled ? '.disabled' : ''}`,
            {on: {click: this.onClick}},
            $ => {
                $('span', '.fas.fa-trash', '')
            })
    }
}

export class CancelButton extends Button {
    constructor(opt: buttonOptions) {
        super(opt)
    }

    render($: WeyaElementFunction) {
        this.elem = $('nav', `.nav-link.tab.float-right${this.isDisabled ? '.disabled' : ''}`,
            {on: {click: this.onClick}},
            $ => {
                $('span', '.fas.fa-times', '')
            })
    }
}

export class CleanButton extends Button {
    constructor(opt: buttonOptions) {
        super(opt)
    }

    render($: WeyaElementFunction) {
        this.elem = $('nav', `.nav-link.tab.float-right${this.isDisabled ? '.disabled' : ''}`,
            {on: {click: this.onClick}},
            $ => {
                $('span', '.fas.fa-broom', '')
            })
    }
}

export class MenuButton extends Button {
    constructor(opt: buttonOptions) {
        super(opt)
    }

    render($: WeyaElementFunction) {
        this.elem = $('nav', `.burger.nav-link.tab.float-left${this.isDisabled ? '.disabled' : ''}`,
            {on: {click: this.onClick}},
            $ => {
                $('span', '.fas.fa-bars', '')
            })
    }
}

interface NavButtonOptions extends buttonOptions {
    text: string
    icon: string
    link?: string
    target?: string
}

export class NavButton extends Button {
    text: string
    icon: string
    link?: string
    target?: string

    constructor(opt: NavButtonOptions) {
        super(opt)
        this.icon = opt.icon
        this.text = opt.text
        this.link = opt.link
        this.target = opt.target
    }

    render($: WeyaElementFunction) {
        this.elem = $('a', '.nav-link.tab',
            {href: this.link, target: this.target, on: {click: this.onClick}},
            $ => {
                $('span', this.icon, '')
                $('span', '', this.text)
            })
    }

    onClick = (e: Event) => {
        e.preventDefault()
        if (this.link) {
            if (this.target === '_blank') {
                window.open(this.link)
                return
            }
            ROUTER.navigate(this.link)
            return
        }
        this.onButtonClick()
    }
}

interface ToggleButtonOptions extends buttonOptions {
    text: string
    isToggled: boolean
}

export class ToggleButton extends Button {
    text: string
    isToggled: boolean
    defaultClass: string

    constructor(opt: ToggleButtonOptions) {
        super(opt)

        this.text = opt.text
        this.isToggled = opt.isToggled
        this.defaultClass = this.isToggled ? 'selected' : 'empty'
    }

    onClick = () => {
        this.onButtonClick()

        this.defaultClass = this.defaultClass === 'selected' ? 'empty' : 'selected'
        this.renderToggleButton()
    }

    render($: WeyaElementFunction) {
        this.elem = $('div', '.d-flex',
            {on: {click: this.onClick}}
        )

        this.renderToggleButton()
    }

    renderToggleButton() {
        this.elem.innerHTML = ''

        $(this.elem, $ => {
            $('nav', `.nav-link.float-left.tab.toggle-button.${this.defaultClass}`,
                $ => {
                    $('span', this.text)
                }
            )
        })
    }
}

interface CustomButtonOptions extends buttonOptions {
    text: string
    title?: string
}

export class CustomButton extends Button {
    text: string
    title: string

    constructor(opt: CustomButtonOptions) {
        super(opt)

        this.text = opt.text
        this.title = opt.title
    }

    render($: WeyaElementFunction) {
        this.elem = $('nav', `.nav-link.mb-2.tab${this.isDisabled ? '.disabled' : ''}`,
            {on: {click: this.onClick}, title: this.title},
            $ => {
                $('span', this.text)
            })
    }
}

interface ShareButtonOptions extends buttonOptions {
    text: string
}

export class ShareButton extends Button {
    private _text: string
    private toastDiv: HTMLDivElement

    constructor(opt: ShareButtonOptions) {
        super(opt)

        this._text = `Check this ${opt.text} on labml`
    }

    render($: WeyaElementFunction) {
        this.elem = $('nav', `.nav-link.tab.float-right${this.isDisabled ? '.disabled' : ''}`,
            {on: {click: this.onClick}},
            $ => {
                $('span', '.fas.fa-share-alt', '')
            })

        this.renderToast()

    }

    renderToast() {
        if (this.toastDiv != null) {
            this.toastDiv.remove()
        }
        $(document.body, $ => {
            $('div', '.toast-custom-container', $ => {
                this.toastDiv = $('div', '.toast.align-items-center', {
                    role: 'alert',
                    'aria-live': 'assertive',
                    'aria-atomic': 'true'
                }, $ => {
                    $('div', '.d-flex', $ => {
                        $('div', '.toast-body', 'Link copied!')
                    })
                })
            })
        })
    }

    copyLink() {
        this.toastDiv.classList.add('show')
        $(document.body, $ => {
            let elm = $('input', {value: window.location.href})
            elm.select()
            document.execCommand('copy')
            elm.remove()
        })
        window.setTimeout(() => {
            this.toastDiv.classList.remove('show')
        }, 2500)
    }

    onClick = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    text: `${this._text}`,
                    url: window.location.href
                })
            } catch (e) {
                this.copyLink()
            }
        } else {
            this.copyLink()
        }
    }

    set text(value: string) {
        this._text = `Check this ${value} on labml`
    }
}
