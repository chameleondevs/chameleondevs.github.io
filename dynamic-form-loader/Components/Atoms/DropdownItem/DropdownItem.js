export class DropdownItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
        <div class="container">
            <slot></slot>
        </div>
        <style>
            .container {
                padding: 5px;
                cursor: pointer;
                transition: background-color 0.1s, color 0.1s;
                border-radius: var(--input-border-radius);
            }
            .container:hover {
                background-color: var(--color-ui);
                color: var(--color-off-white);
            }
        </style>`;
    }

    connectedCallback() {
    }

    static get observedAttributes() {
        return [];
    }
}