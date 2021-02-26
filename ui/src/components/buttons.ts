import {Weya as $, WeyaElement, WeyaElementFunction} from "../../../lib/weya/weya"
import {ROUTER} from '../app'
import {computerAnalyses, experimentAnalyses} from '../analyses/analyses'
import runHeaderAnalysis from '../analyses/experiments/run_header/init'
import isMobile from '../utils/mobile';


interface buttonOptions {
    onButtonClick?: () => void
    isDisabled?: boolean
}

abstract class Button {
    onButtonClick: () => void
    isDisabled: boolean
    elem?: WeyaElement

    protected constructor(opt: buttonOptions) {
        this.onButtonClick = opt.onButtonClick
        this.isDisabled = opt.isDisabled ? opt.isDisabled : false
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
        e.preventDefault()
        setTimeout(args => {
            if (!this.isDisabled) {
                this.onButtonClick()
            }
        }, isMobile ? 100 : 0)
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

        if (this.currentPath.includes('run')) {
            this.text = 'Runs'
            this.navigatePath = 'runs'
        } else if (this.currentPath.includes('session')) {
            this.text = 'Computers'
            this.navigatePath = 'computers'
        } else if (this.currentPath.includes(runHeaderAnalysis.route)) {
            this.text = 'Run'
            this.navigatePath = this.currentPath.replace(runHeaderAnalysis.route, 'run')
        } else {
            for (let analysis of experimentAnalyses) {
                if (this.currentPath.includes(analysis.route)) {
                    this.text = 'Run'
                    this.navigatePath = this.currentPath.replace(analysis.route, 'run')
                    break
                }
            }
            for (let analysis of computerAnalyses) {
                if (this.currentPath.includes(analysis.route)) {
                    this.text = 'Computer'
                    this.navigatePath = this.currentPath.replace(analysis.route, 'session')
                    break
                }
            }
        }
    }

    onClick = () => {
        ROUTER.navigate(this.navigatePath)
    }

    render($: WeyaElementFunction) {
        this.elem = $('nav', `.nav-link.tab.float-left${this.isDisabled ? '.disabled' : ''}`,
            {on: {click: this.onClick}},
            $ => {
                $('span.fas.fa-chevron-left', '')
                $('span.ms-1', this.text)
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
                $('span.fas.fa-sync', '')
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
                $('span.fas.fa-save', '')
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
                $('span.fas.fa-edit', '')
            })
    }
}

export class DeleteButton extends Button {
    constructor(opt: buttonOptions) {
        super(opt)
    }

    render($: WeyaElementFunction) {
        this.elem = $('nav', `.nav-link.tab.float-right${this.isDisabled ? '.disabled' : ''}`,
            {on: {click: this.onClick}},
            $ => {
                $('span.fas.fa-trash', '')
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
                $('span.fas.fa-times', '')
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
                $('span.fas.fa-bars', '')
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
        setTimeout(args => {
            if (this.link) {
                if (this.target === '_blank') {
                    window.open(this.link)
                    return
                }
                ROUTER.navigate(this.link)
                return
            }
            this.onButtonClick()
        }, isMobile ? 100 : 0)
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
        this.elem = $(`div.d-flex`,
            {on: {click: this.onClick}}
        )

        this.renderToggleButton()
    }

    renderToggleButton() {
        this.elem.innerHTML = ''

        $(this.elem, $ => {
            $(`nav.nav-link.float-left.tab.toggle-button.${this.defaultClass}`,
                $ => {
                    $('span', this.text)
                }
            )
        })
    }
}