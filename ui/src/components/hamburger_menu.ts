import {Weya as $, WeyaElementFunction} from '../../../lib/weya/weya'
import {MenuButton, NavButton} from './buttons';
import {Loader} from './loader';
import CACHE, {UserCache} from "../cache/cache"
import {User} from '../models/user';
import {ROUTER} from '../app';
import NETWORK from '../network';

const DEFAULT_IMAGE = 'https://raw.githubusercontent.com/azouaoui-med/pro-sidebar-template/gh-pages/src/img/user.jpg'

export interface HamburgerMenuOptions {
    title: string
    setButtonContainer?: (container: HTMLDivElement) => void
}

export class HamburgerMenuView {
    elem: HTMLDivElement
    navLinksContainer: HTMLElement
    overlayElement: HTMLDivElement
    buttonContainer: HTMLDivElement
    loader: Loader
    userCache: UserCache
    user: User
    isMenuVisible: boolean
    title: string
    setButtonContainer?: (container: HTMLDivElement) => void

    constructor(opt: HamburgerMenuOptions) {
        this.userCache = CACHE.getUser()

        this.title = opt.title
        this.setButtonContainer = opt.setButtonContainer

        this.loader = new Loader()
        this.isMenuVisible = false
    }


    render($: WeyaElementFunction) {
        this.elem = $('div', $ => {
            $('div', '.nav-container', $ => {
                this.navLinksContainer = $('nav', '.nav-links', $ => {
                    this.loader.render($)
                })
                new MenuButton({onButtonClick: this.onMenuToggle}).render($)
                $('div', '.title', $ => {
                    $('h5', this.title)
                })
                this.buttonContainer = $('div', '.buttons', '')
            })
            this.overlayElement = $('div', '.overlay', {on: {click: this.onMenuToggle}})
        })

        this.renderProfile().then()

        if (this.setButtonContainer) {
            this.setButtonContainer(this.buttonContainer)
        }
        return this.elem
    }

    private async renderProfile() {
        this.user = await this.userCache.get()

        this.loader.remove()

        $(this.navLinksContainer, $ => {
            $('div', '.text-center', $ => {
                $('img', '.mt-2.image-style.rounded-circle', {
                    src: this.user.picture || DEFAULT_IMAGE
                })
                $('div', '.mb-5.mt-3.mt-2', $ => {
                    $('h5', this.user.name)
                })
            })
            new NavButton({
                icon: '.fas.fa-running',
                text: 'Runs',
                link: '/runs'
            }).render($)
            new NavButton({
                icon: '.fas.fa-desktop',
                text: 'Computers',
                link: '/computers'
            }).render($)
            new NavButton({
                icon: '.fas.fa-book',
                text: 'Documentation',
                link: 'https://docs.labml.ai',
                target: '_blank'
            }).render($)
            new NavButton({
                icon: '.fas.fa-sliders-h',
                text: 'Settings',
                link: '/settings'
            }).render($)
            $('span', '.mt-5', '')
            new NavButton({icon: '.fas.fa-power-off', text: 'Log out', onButtonClick: this.onLogOut}).render($)
            new NavButton({
                icon: '.fas.fa-comments',
                text: 'Join our Slack',
                link: 'https://join.slack.com/t/labforml/shared_invite/zt-egj9zvq9-Dl3hhZqobexgT7aVKnD14g/',
                target: '_blank'
            }).render($)
        })
    }

    onMenuToggle = () => {
        this.isMenuVisible = !this.isMenuVisible
        if (this.isMenuVisible) {
            this.navLinksContainer.classList.add('nav-active')
            this.overlayElement.classList.add('d-block')
        } else {
            this.navLinksContainer.classList.remove('nav-active')
            this.overlayElement.classList.remove('d-block')
        }
    }

    onLogOut = async () => {
        let res = await NETWORK.signOut()
        if (res.is_successful) {
            NETWORK.redirectLogout()
        } else {
            //TODO: Sentry
        }
    }
}