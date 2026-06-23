const COPY_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
const CHECK_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

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
        }
        .messageItem {
            padding: 5px;
            margin: 5px 0;;
            font-size: 12px;
            background: #152B49FF;
            overflow: hidden;
            border-radius: 3px;
            border: 1px solid white;
        }
        .json {
            font-family: "Inconsolata", monospace;
            font-size: 12px;
            font-weight: normal;
            line-height: 1.4;
            white-space: pre-wrap;
            word-break: break-word;
            margin: 5px 0 0;
            color: #d7e3f4;
        }
        .copyBtn {
            float: right;
            background: transparent;
            border: none;
            color: #c792ff;
            cursor: pointer;
            padding: 0 4px;
            display: inline-flex;
            align-items: center;
            border-radius: 3px;
            line-height: 1;
        }
        .copyBtn:hover {
            color: white;
            background: rgba(255, 255, 255, 0.12);
        }
        .copyBtn.copied {
            color: #7CFC9A;
        }
        .copyBtn svg {
            display: block;
        }
        .timestamp {
            font-size: 14px;
            color: #c792ff;
            text-align: right;
            font-weight: normal;
            margin-top: 5px;
        }
        .searchInput {
            width: 100%;
            box-sizing: border-box;
            margin-bottom: 10px;
            padding: 6px 10px;
            font-size: 12px;
            font-family: inherit;
            color: white;
            background: rgb(28, 39, 58);
            border: 1px solid white;
            border-radius: 16px;
        }
        .searchInput::placeholder {
            color: rgba(255, 255, 255, 0.6);
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
            <input type="search" id="eventSearch" class="searchInput" placeholder="Filter events by name…" autocomplete="off" spellcheck="false">
            <zui-log-screen class="logContainer"></zui-log-screen>
            </div>
          </div>
         </zui-card> 
    `;

    this.config = {
        showDataLayer: true,
        showInternal: true,
        searchTerm: ''
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
    this.shadowRoot.getElementById('eventSearch').addEventListener('input', (e) => {
        this.config.searchTerm = e.target.value.trim().toLowerCase();
        this.filterLogs();
    });
    this.shadowRoot.querySelector('.logContainer').addEventListener('click', (e) => {
        const btn = e.target.closest('.copyBtn');
        if (!btn) return;
        e.preventDefault(); // don't toggle the <details> when copying
        const details = btn.closest('details');
        const jsonEl = details && details.querySelector('.json');
        navigator.clipboard.writeText(jsonEl ? jsonEl.textContent : '');
        btn.classList.add('copied');
        btn.innerHTML = CHECK_ICON;
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = COPY_ICON;
        }, 1000);
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
    logItem.dataset.event = String(data.event ?? '');
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
      messageItem.dataset.event = String(eventType ?? '');
      messageItem.innerHTML = this.formatMessage(eventType, parsedData, 'internal');
      logContainer.appendChild(messageItem);
      this.filterLogs();
    } catch (e) {
      // console.error(`Could not parse message ${JSON.stringify(data)}`);
    }
  }

  formatMessage(eventType, data, source) {
    let html = `<summary>${this.escapeHtml(eventType)} <small>${this.escapeHtml(source)}</small><button class="copyBtn" type="button" title="Copy JSON" aria-label="Copy JSON">${COPY_ICON}</button></summary>`;
    html += this.formatData(data);
    html += `<div class="timestamp">${this.escapeHtml(new Date().toLocaleTimeString())}</div>`;
    return html;
  }

  formatData(data) {
    let json;
    try {
      json = JSON.stringify(data, null, 2);
    } catch (e) {
      json = String(data);
    }
    return `<pre class="json">${this.escapeHtml(json)}</pre>`;
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  clearLogs() {
    this.shadowRoot.getElementById('statusLight').setAttribute('status', 'disabled');
    this.shadowRoot.querySelector('.logContainer').innerHTML = '';
  }

  filterLogs() {
    const showDataLayer = this.config.showDataLayer;
    const showInternal = this.config.showInternal;
    const searchTerm = this.config.searchTerm;

    const items = this.shadowRoot.querySelectorAll('.logItem, .messageItem');

    items.forEach(item => {
      const sourceVisible = item.classList.contains('dataLayer') ? showDataLayer : showInternal;
      const eventName = (item.dataset.event || '').toLowerCase();
      const matchesSearch = !searchTerm || eventName.includes(searchTerm);
      item.style.display = sourceVisible && matchesSearch ? 'block' : 'none';
    });
  }
});
