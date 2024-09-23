import { BaseComponent } from "../../BaseComponent.js";
import { template } from "./Template.js";

export class CopyToClipboard extends BaseComponent {
    constructor() {
        super(template);
    }

    connectedCallback() {
        this.shadowRoot.querySelector('#copyButton').addEventListener('click', this.copyToClipboard);
        setTimeout(() => {
            this.shadowRoot.querySelector('#value').style.borderColor = getComputedStyle(this.shadowRoot.querySelector('#value'), null).color;
        }, 100);
    }

    copyToClipboard = async () => {
        const text = this.shadowRoot.querySelector('#value').innerText;
        navigator.clipboard.writeText(text);
        this.shadowRoot.querySelector('#copyButton').setAttribute('loading', 'true');
        await new Promise(resolve => setTimeout(resolve, 500));
        this.shadowRoot.querySelector('#copyButton').setAttribute('loading', 'false');
    }

    static get observedAttributes() {
        return ['value'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'value') {
            this.shadowRoot.querySelector('#value').innerText = newValue;
        }
    }
}