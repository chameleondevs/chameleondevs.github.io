
import { template } from "./Template.js";
import {BaseComponent} from "../../BaseComponent.js";

export class Select extends BaseComponent {
    constructor() {
        super(template);
    }

    connectedCallback() {
        setTimeout(() => {
            this.shadowRoot.querySelector('input').style.borderColor = getComputedStyle(this.shadowRoot.querySelector('input'), null).color;
        }, 100);
    }

    static get observedAttributes() {
        return ['value', 'type', 'name'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'value' && oldValue !== newValue) {
            this.shadowRoot.querySelector('input').value = newValue;
        }

        if (name === 'type' && oldValue !== newValue) {
            this.shadowRoot.querySelector('input').type = newValue;
        }

        if (name === 'name' && oldValue !== newValue) {
            this.shadowRoot.querySelector('input').name = newValue;
        }

        if (name === 'placeholder' && oldValue !== newValue) {
            this.shadowRoot.querySelector('input').placeholder = newValue;
        }
    }
}