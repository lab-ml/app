import {WeyaElement, WeyaElementFunction} from '../../../lib/weya/weya'

export class Loader {
    elem: WeyaElement

    constructor() {
    }

    render($: WeyaElementFunction) {
        this.elem = $(`div.center`, $ => {
            $('div.loader', '')
        })
    }

    remove() {
        this.elem.innerHTML = ''
    }
}

