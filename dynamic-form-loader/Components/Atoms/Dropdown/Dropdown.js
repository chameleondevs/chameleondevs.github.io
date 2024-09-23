export class DropdownContainer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
        <div class="container">
            <slot></slot>
        </div>
        <style>
            :host {
                display: block;
                position: relative;
                z-index: 999;;
            }
            .container {
                position: absolute;
                top: 0;
                left: 50%;
                transition: transform 0.3s, opacity 0.3s;
                display: none;
                padding: 5px;
                border-radius: 5px;
                margin: 10px 0;
                background-color: var(--color-light-grey);
                color: var(--color-ui);
                box-shadow: 0 0 5px rgba(0,0,0,0.5);
                opacity: 0;
                transform: translate(-50%, -10px);
            }
            .container.open {
                transform: translate(-50%, 0);
                display: block;
                opacity: 1;
                width: 100%;
            }
        </style>`;
    }

    toggleOpen() {
        if (this.getAttribute('open') === 'true') {
            this.setAttribute('open', 'false');
        } else {
            this.setAttribute('open', 'true');
        }
    }

    static get observedAttributes() {
        return ['open'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && oldValue !== newValue) {
            if (newValue === 'true') {
                this.shadowRoot.querySelector('.container').classList.add('open');
            } else {
                this.shadowRoot.querySelector('.container').classList.remove('open');
            }
        }
    }

}