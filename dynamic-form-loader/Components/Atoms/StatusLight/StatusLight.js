import { BaseComponent } from "../../BaseComponent.js";
import { template } from "./Template.js";
import { STATUS_LIGHT_STATES } from "./Constants.js";


export class StatusLight extends BaseComponent {
    constructor() {
        super(template);
    }

    static get observedAttributes() {
        return ['status'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'status') {
            if (STATUS_LIGHT_STATES.includes(newValue)) {
               this.updateStatusLight(newValue)
            }
        }
    }

    updateStatusLight = (status) => {
        const statusLight = this.shadowRoot.querySelector('.statuslight');
        statusLight.classList.remove(...STATUS_LIGHT_STATES);
        statusLight.classList.add(status);
    }
}