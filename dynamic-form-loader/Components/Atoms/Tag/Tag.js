import { template } from "./Template.js";
import { BaseComponent } from "../../BaseComponent.js";

export class Tag extends BaseComponent {
    constructor() {
        super(template);
    }

    connectedCallback() {
    }

    static get observedAttributes() {
        return ['type'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'type' && oldValue !== newValue) {
            this.shadowRoot.querySelector('.tag').classList.add(newValue);
        }
    }
}

