import {GameObject, runtime} from "../core.js";

export const TextType = {
    MESSAGE: 1,
    NAME: 2,
    TITLE: 3,
    LIST_ITEM: 4
}

export function addText(title, textType, color) {
    let text = new Text(title, -999, -999);
    text.setColor(color, 1);
    text.setTextType(textType);

    return text;
}

export function positionText(textObj, x, y) {
    textObj.setX(x - textObj.element.clientWidth * .5);
    textObj.setY(y);
}

export class Text extends GameObject {

    constructor(text, x, y) {
        super();

        this._renderText(text, x, y );

        this.text = text;

        this.x = x;
        this.y = y;
        this.textType = null;
    }

    setTextType(textType) {
        if (!textType)
            return;

        this.textType = textType;
        switch (textType) {
            case TextType.MESSAGE:
                this.element.className = 'text absolute message';
                break;
            default:
            case TextType.NAME:
                this.element.className = 'text absolute name';
                break;
            case TextType.LIST_ITEM:
                this.element.className = 'text absolute list';
                break;
            case TextType.TITLE:
                this.element.className = 'text absolute title';
                break;
        }
    }

    setText(text) {
       this._renderText(text, this.x, this.y);
       this.text = text;
    }

    _renderText(text, x, y) {
        if (this.text !== text) {
            this.element?.parentNode?.removeChild(this.element);

            const classList = this.element?.classList ?? [];

            runtime.logger?.log('rendering text...');
            this.element = document.createElement('p');
            this.element.className = 'text absolute message';
            classList.forEach(className => {
               this.element.classList.add(className);
            });

            this.setTextType(this.textType);

            this.element.style.color = this.color;

            this.element.innerText = text;
            this.element.style.top = y.toString();
            this.element.style.left = x.toString();

            let canvasWrapper = document.getElementById('game-surface-wrapper');
            canvasWrapper.appendChild(this.element);
        }
    }

     _addAlpha(color, opacity) {
        let _opacity = Math.round(Math.min(Math.max(opacity ?? 1, 0), 1) * 255);
        return color + _opacity.toString(16).toUpperCase();
    }

    setX(x) {
        this.x = x;
        this.element.style.left = x.toString();
    }

    setXRight(x) {
        this.x = x;
        this.element.style.left = null;
        this.element.style.right = runtime.settings.SURFACE_WIDTH - x.toString();
    }

    setY(y) {
        this.y = y;
        this.element.style.top = y.toString();
    }

    setColor(color, alpha) {
        this.color = this._addAlpha(color, alpha);
        this.element.style.color = this.color;
    }

    setVisible(visible) {
        this.element.style.visibility = visible ? 'visible' : 'hidden';
        this.visible = visible;
    }

    destroy() {
        super.destroy();

        if (this.element)
            this.element.innerHTML = '';
        if (this.element?.parentNode)
            this.element.outerHTML = '';
    }
}