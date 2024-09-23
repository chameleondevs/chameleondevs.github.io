import { template } from "./Template.js";
import { BUTTON_VERSIONS } from "./Contants.js";
import { BaseComponent } from "../../BaseComponent.js";

export class Button extends BaseComponent {
    constructor() {
        super(template);
    }

    connectedCallback() {
        this.shadowRoot.querySelector('button').addEventListener('mousedown', this.createRipple)
    }

    createRipple(e){
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        const rippleLayer = button.querySelector('.rippleLayer');
        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        circle.classList.add("ripple");
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${offsetX - diameter / 2}px`;
        circle.style.top = `${offsetY - diameter / 2}px`;
        const oldRipple = button.getElementsByClassName("ripple")[0];
        if (oldRipple) {
            oldRipple.remove();
        }
        rippleLayer.appendChild(circle);
    }

    static get observedAttributes() {
        return ['label', 'disabled', 'loading', 'version', 'width'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'label') {
            this.shadowRoot.getElementById('buttonLabel').innerHTML = newValue;
            return;
        }

        if (name === 'disabled') {
            if (newValue === 'true') {
                this.shadowRoot.getElementById('button').disabled = true;
                return;
            }
            this.shadowRoot.getElementById('button').disabled = false;
        }

        if (name === 'loading') {
            if (newValue === 'true') {
                this.shadowRoot.getElementById('loader').style.visibility = 'visible';
                this.shadowRoot.getElementById('buttonLabel').style.visibility = 'hidden';
                return;
            }
            this.shadowRoot.getElementById('loader').style.visibility = 'hidden';
            this.shadowRoot.getElementById('buttonLabel').style.visibility = 'visible';
        }

        if (name === 'version') {
            if (!Object.values(BUTTON_VERSIONS).includes(newValue)) {
                console.warn(`button version ${newValue} is not supported`);
                return;
            }
            Object.values(BUTTON_VERSIONS).forEach((v) => {
                this.shadowRoot.getElementById('button').classList.remove(v);
            })

            this.shadowRoot.getElementById('button').classList.add(newValue);
        }

        if (name === 'width') {
            this.shadowRoot.getElementById('button').style.width = newValue;
        }
    }

    get label() {
        return this.getAttribute('label');
    }
    set label(label) {
        this.setAttribute('label', label);
    }

    get disabled() {
        return this.getAttribute('disabled');
    }
    set disabled(disabled) {
        this.setAttribute('disabled', disabled);
    }

    get loading() {
        return this.getAttribute('loading');
    }
    set loading(loading) {
        this.setAttribute('loading', loading);
    }

    get version() {
        return this.getAttribute('version');
    }

    set version(version) {
        this.setAttribute('version', version);
    }

    get width() {
        this.getAttribute('width');
    }

    set width(width) {
        this.setAttribute('width', width);
    }
}