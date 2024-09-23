import { template } from "./Template.js";
import {BaseComponent} from "../../BaseComponent.js";

export class Toggle extends BaseComponent {
    constructor() {
        super(template);
    }

    connectedCallback() {
        this.addEventListener('click', () => { this.toggleState() })
    }

    toggleState = () => {
        const currentValue = this.shadowRoot.getElementById('toggle').checked;
        this.shadowRoot.getElementById('toggle').checked = !currentValue;
        if (currentValue) {
            this.removeAttribute('checked');
            this.dispatchEvent(new CustomEvent('zui-toggle-change', { detail: { checked: false } }));
        } else {
            this.setAttribute('checked', 'true');
            this.dispatchEvent(new CustomEvent('zui-toggle-change', { detail: { checked: true } }));
        }
    }

    setChecked = (value) => {
        this.shadowRoot.getElementById('toggle').setAttribute('checked', value);
    }

    static get observedAttributes() {
        return ['checked'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'checked') {
            this.setChecked(newValue);
        }
    }


}