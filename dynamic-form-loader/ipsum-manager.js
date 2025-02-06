customElements.define('ipsum-manager', class ipsumManager extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
.container {
          display: block;
        }
        .headerslot {
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        .footerSlot {
            display: flex;
            flex-direction: row;
            gap: 10px;
        }
        
        .footerSlot #generateIpsum {
            flex: 1 1 auto;
        }
        </style>

        <zui-card collapsed="true">
            <div slot="header" class="headerslot">
                <zui-status-light status="disabled" id="statusLight"></zui-status-light>Ipsum generator
            </div>
            <div slot="content">
                <div class="container">
                </div>
            </div>
            <div slot="footer">
                <div class="footerSlot">
                <zui-button id="clearIpsum" label="Clear ipsum" version="primary" width="100%"></zui-button>
                    <zui-button id="generateIpsum" label="Add ipsum" width="100%"></zui-button>
                </div>
            </div>
        </zui-card> 
      `;
  
      this.config = {
          showDataLayer: true,
          showInternal: true
      }
    }
  
    connectedCallback() {
        this.shadowRoot.getElementById('generateIpsum').addEventListener('click', async () => {
            this.shadowRoot.getElementById('generateIpsum').loading = true;
            await this.generateIpsum();
            this.shadowRoot.getElementById('generateIpsum').loading = false;
        });
        this.shadowRoot.getElementById('clearIpsum').addEventListener('click', () => {
            this.clearIpsum();
        });
        // Add ipsum to the container bu pressing ctrl + i
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === 'i') {
                this.generateIpsum();
            }
        });
    }

    async generateIpsum() {
        this.shadowRoot.getElementById('statusLight').setAttribute('status', 'success');
        const response = await fetch('https://hipsum.co/api/?type=hipster-centric&sentences=2');
        const ipsum = await response.json();
        const ipsumContainers = Array.from(document.querySelectorAll('.ipsumContainer'));
        ipsumContainers.forEach(container => {
            const paragraph = document.createElement('p');
            paragraph.innerText = ipsum;
            container.appendChild(paragraph);
        });
    }

    clearIpsum() {
        const ipsumContainers = Array.from(document.querySelectorAll('.ipsumContainer'));
        ipsumContainers.forEach(container => {
            container.innerHTML = '';
        });
        this.shadowRoot.getElementById('statusLight').setAttribute('status', 'disabled');
    }
});
  