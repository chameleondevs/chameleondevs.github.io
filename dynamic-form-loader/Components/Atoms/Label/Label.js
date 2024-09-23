import { template } from "./Template.js";
import { BaseComponent } from "../../BaseComponent.js";

export class Label extends BaseComponent {
    constructor() {
        super(template);
    }

    connectedCallback() {

    }


    static get observedAttributes() {
        return ['label'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'label' && oldValue !== newValue) {
            this.updateLabel(newValue);
        }
    }

    updateLabel = (value) => {
        this.shadowRoot.getElementById('label').innerText = value;
    }
}