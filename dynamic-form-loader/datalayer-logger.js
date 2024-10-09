customElements.define('datalayer-logger', class dataLayerLogger extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style> 
        .container {
          display: block;
        }
        
        .logItem {
            padding: 5px;
            margin: 5px 0;;
            font-size: 12px;
            background: #152B49FF;
            overflow: hidden;
            border-radius: 3px;
            border: 1px solid white;
            box-shadow: 0 0 2px #737dff, inset 0 0 2px #737dff;
        }
        .messageItem {
            padding: 5px;
            margin: 5px 0;;
            font-size: 12px;
            background: #152B49FF;
            overflow: hidden;
            border-radius: 3px;
            border: 1px solid white;
            box-shadow: 0 0 2px #737dff, inset 0 0 2px #737dff;
        }
        .timestamp {
            font-size: 14px;
            color: #c792ff;
            text-shadow: 0 0 2px blueviolet;
            text-align: right;
            font-weight: normal;
            margin-top: 5px;
        }
        summary {
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            padding: 5px 0;
        }
        .toggleContainer {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }
        .toggle {
          display: flex;
          align-items: center;
          background: rgb(28, 39, 58);
          padding: 5px;
          border-radius: 16px;
          cursor: pointer;
        }
        .toggle input {
          display: none;
        }
        .toggle span {
          padding: 5px;
          border-radius: 16px;
        }
        .toggle:hover input:not(:checked) + span {
            color: white;
        }
        .toggle input:checked + span {
          background: white;
          color:  rgb(17, 24, 37); 
        }
        .headerslot {
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        
      </style>
      <zui-card collapsed="true">
        <div slot="header" class="headerslot">
            <zui-status-light status="disabled" id="statusLight"></zui-status-light>Event logger
        </div>
        
        <div slot="content">
            <div class="container">
              <zui-toggle id="dataLayerToggle" checked><div slot="label">Datalayer</div></zui-toggle>
              <zui-toggle id="internalToggle" checked><div slot="label">Chameleon internal</div></zui-toggle>
            </div>
            <zui-log-screen class="logContainer"></zui-log-screen>
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
    this.wrapDataLayer();

    window.addEventListener('datalayerpush', this.handlePush.bind(this));
    window.addEventListener('cleardatalayerlogs', this.clearLogs.bind(this));
    window.addEventListener('message', this.handlePostMessage.bind(this));
    this.shadowRoot.getElementById('dataLayerToggle').addEventListener('zui-toggle-change', (e) => {
        this.config.showDataLayer = e.detail.checked;
        this.filterLogs();
    });
    this.shadowRoot.getElementById('internalToggle').addEventListener('zui-toggle-change', (e) => {
        this.config.showInternal = e.detail.checked;
        this.filterLogs();
    });
    this.shadowRoot.getElementById('statusLight').setAttribute('status', 'success');
  }

  wrapDataLayer() {
    window.dataLayer = window.dataLayer || new Proxy([], {
      set: (obj, prop, value) => {
        if (prop !== 'length') {
          const pushEvent = new CustomEvent('datalayerpush', {
            detail: value
          });
          window.dispatchEvent(pushEvent);
        }
        return Reflect.set(obj, prop, value);
      }
    });
  }

  disconnectedCallback() {
    window.removeEventListener('datalayerpush', this.handlePush);
    window.removeEventListener('cleardatalayerlogs', this.clearLogs);
  }

  async handlePush(e) {
    this.shadowRoot.getElementById('statusLight').setAttribute('status', 'loading');
    this.writeDataLayerPush(e.detail);
    await new Promise(resolve => setTimeout(resolve, 200));
    this.shadowRoot.getElementById('statusLight').setAttribute('status', 'success');
  }

  handlePostMessage(e) {
    if (!e.data) {
      console.log(`No data in post message ${e}`);
    }
    this.writeMessage(e.data);
  }

  writeDataLayerPush(data) {
    const logContainer = this.shadowRoot.querySelector('.logContainer');
    const logItem = document.createElement('details');
    logItem.classList.add('logItem', 'dataLayer');
    logItem.innerHTML = this.formatMessage(data.event, data, 'dataLayer');
    logContainer.appendChild(logItem);
    this.filterLogs();
  }

  writeMessage(data) {
    const logContainer = this.shadowRoot.querySelector('.logContainer');
    const messageItem = document.createElement('details');
    messageItem.classList.add('messageItem', 'internal');
    try {
      const eventInfoArray = data.split(/:(.+)/);
      const eventType = eventInfoArray[0];
      const parsedData = JSON.parse(eventInfoArray[1]);
      messageItem.innerHTML = this.formatMessage(eventType, parsedData, 'internal');
      logContainer.appendChild(messageItem);
      this.filterLogs();
    } catch (e) {
      // console.error(`Could not parse message ${JSON.stringify(data)}`);
    }
  }

  formatMessage(eventType, data, source) {
    let html = `<summary>${eventType} <small>${source}</small></summary>`;
    html += `${this.formatData(data)};`
    html += `<div class="timestamp">timestamp: ${Date.now()}</div>`;
    return html;
  }

  formatData(data) {
    return Object.keys(data).map(key => {
      return `<strong>${key}</strong>: ${typeof data[key] === 'string' || typeof data[key] === 'number' ? data[key] : JSON.stringify(data[key])}`;
    }).join('<br>');
  }

  clearLogs() {
    this.shadowRoot.getElementById('statusLight').setAttribute('status', 'disabled');
    this.shadowRoot.querySelector('.logContainer').innerHTML = '';
  }

  filterLogs() {
    const showDataLayer = this.config.showDataLayer;
    const showInternal = this.config.showInternal;

    const logItems = this.shadowRoot.querySelectorAll('.logItem');
    const messageItems = this.shadowRoot.querySelectorAll('.messageItem');

    logItems.forEach(item => {
      item.style.display = showDataLayer ? 'block' : 'none';
    });

    messageItems.forEach(item => {
      item.style.display = showInternal ? 'block' : 'none';
    });
  }
});
