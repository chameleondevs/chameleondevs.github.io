
import { template } from "./Template.js";
import {BaseComponent} from "../../BaseComponent.js";

export class Card extends BaseComponent {
    constructor() {
        super(template);
    }

    connectedCallback() {
        this.shadowRoot.getElementById('toggleCollapsed').addEventListener('click', () => {
            this.toggleCollapsed();
        })

    }


    static get observedAttributes() {
        return ['collapsed'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'collapsed') {
            this.updateCollapsed(newValue);
        }
    }

    toggleCollapsed() {
        if (this.getAttribute('collapsed') === 'true') {
            this.setAttribute('collapsed', 'false');
            return;
        }
        this.setAttribute('collapsed', 'true');

    }
    updateCollapsed = (value) => {
        if (value === 'true') {
            this.shadowRoot.querySelector('.container').classList.add('collapsed');
            return;
        }
        this.shadowRoot.querySelector('.container').classList.remove('collapsed');
    }
}