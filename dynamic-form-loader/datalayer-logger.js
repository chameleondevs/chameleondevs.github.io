class dataLayerLogger extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 5px;
          border-radius: 5px;
          margin: 10px 0;
          background-color: rgb(17,24,37);
          font-family: monospace;
          overflow: hidden;
          overflow-y: scroll;
          height: 600px;
        }
        .logItem {
            padding: 5px;
            margin: 5px 0;;
            font-size: 10px;
            background: rgb(28, 39, 58);
            overflow: hidden;
        }
        .messageItem {
            padding: 5px;
            margin: 5px 0;;
            font-size: 10px;
            background: rgb(28, 39, 58);
            overflow: hidden;
        }
        .timestamp {
            font-size: 8px;
            color: grey;
            text-align: right;
            margin-top: 5px;
        }
        summary {
            cursor: pointer;
            font-weight: bold;
            font-size: 12px;
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
        
      </style>
      <div class="toggleContainer">
        <label class="toggle">
          <input type="checkbox" id="toggleDataLayer" checked>
          <span>dataLayer</span>
        </label>
        <label class="toggle">
          <input type="checkbox" id="toggleInternal" checked>
          <span>internal</span>
        </label>
      </div>
      <div class="logContainer"></div>
    `;
  }

  connectedCallback() {
    window.addEventListener('datalayerpush', this.handlePush.bind(this));
    window.addEventListener('cleardatalayerlogs', this.clearLogs.bind(this));
    window.addEventListener('message', this.handlePostMessage.bind(this));

    this.shadowRoot.querySelector('#toggleDataLayer').addEventListener('change', this.filterLogs.bind(this));
    this.shadowRoot.querySelector('#toggleInternal').addEventListener('change', this.filterLogs.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener('datalayerpush', this.handlePush);
    window.removeEventListener('cleardatalayerlogs', this.clearLogs);
  }

  handlePush(e) {
    this.writeDataLayerPush(e.detail);
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
    this.shadowRoot.querySelector('.logContainer').innerHTML = '';
  }

  filterLogs() {
    const showDataLayer = this.shadowRoot.querySelector('#toggleDataLayer').checked;
    const showInternal = this.shadowRoot.querySelector('#toggleInternal').checked;

    const logItems = this.shadowRoot.querySelectorAll('.logItem');
    const messageItems = this.shadowRoot.querySelectorAll('.messageItem');

    logItems.forEach(item => {
      item.style.display = showDataLayer ? 'block' : 'none';
    });

    messageItems.forEach(item => {
      item.style.display = showInternal ? 'block' : 'none';
    });
  }
}

customElements.define('datalayer-logger', dataLayerLogger);
