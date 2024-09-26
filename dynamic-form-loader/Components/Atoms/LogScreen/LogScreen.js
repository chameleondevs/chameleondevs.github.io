export class LogScreen extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.shadowRoot.innerHTML = `
      <style>
        .container {
          display: block;
        }

        .logContainer {
          background-color: #152B49FF;
          color: white;
          padding: 5px;
          border-radius: 8px;
          margin: 10px 0;
          font-family: var(--font-family-monospace), monospace;
          font-weight: bold;
          overflow: hidden;
          overflow-y: auto;
          height: 400px;
          text-shadow: 0 0 6px #737dff;
          scrollbar-width: thin;
          scrollbar-color: #152B49FF #1d4172;
          box-shadow: inset 0 0 30px #131d27, 0 0 18px -3px #3544fa33;
          border-top: 3px solid var(--color-cream);
          border-left: 3px solid var(--color-cream);
          border-bottom: 3px solid var(--color-white);
          border-right: 3px solid var(--color-white);
        }
        </style>
        <div class="logContainer"><slot></slot></div>
        `;
    }

    connectedCallback() {
        this.logContainer = this.shadowRoot.getElementById('logContainer');
    }
}