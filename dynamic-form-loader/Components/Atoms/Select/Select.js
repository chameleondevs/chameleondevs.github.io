import { template } from "./Template.js";
import { BaseComponent } from "../../BaseComponent.js";

export class Select extends BaseComponent {
    constructor() {
        super(template);
    }

    connectedCallback() {
        setTimeout(() => {
            this.shadowRoot.querySelector('input').style.borderColor = getComputedStyle(this.shadowRoot.querySelector('input'), null).color;
        }, 100);
        this.shadowRoot.querySelector('input').addEventListener('change', (e) => { this.handleChange(e) });
        this.shadowRoot.getElementById('openDropdown').addEventListener('click', () => {
            this.toggleDropdown();
        });
    }

    handleChange = (e) => {
        this.dispatchEvent(new CustomEvent('zui-change', { detail: {value: e.target.value }}));
        this.shadowRoot.querySelector('zui-dropdown').setAttribute('open', 'false');
    }

    toggleDropdown = () => {
        const dropdown = this.shadowRoot.querySelector('zui-dropdown');
        dropdown.toggleOpen();
    }

    static get observedAttributes() {
        return ['value', 'type', 'name', 'options'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'value' && oldValue !== newValue) {
            this.shadowRoot.querySelector('input').value = newValue;
            const labelForValue = this.optionsObject.find(option => option.value === newValue);
            if (labelForValue) {
                this.shadowRoot.getElementById('openDropdown').innerText = labelForValue.label;
            }
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

        if (name === 'options' && oldValue !== newValue) {
            this.populateOptions(newValue);
        }
    }

    populateOptions = (options) => {
        const dropdown = this.shadowRoot.querySelector('zui-dropdown');
        dropdown.innerHTML = '';
        this.optionsObject = JSON.parse(options);
        this.optionsObject.forEach(option => {
            const dropdownItem = document.createElement('zui-dropdown-item');
            dropdownItem.innerHTML = option.label;
            dropdownItem.addEventListener('click', () => {
                this.shadowRoot.querySelector('input').value = option.value;
                this.shadowRoot.querySelector('input').dispatchEvent(new Event('change'));
                this.setAttribute('value', option.value);
            });
            dropdown.appendChild(dropdownItem);
        });
    }
}