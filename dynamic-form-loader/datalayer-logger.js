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
        summary {
            cursor: pointer;
            font-weight: bold;
            font-size: 12px;
            padding: 5px 0;
        }
      </style>
     <div class="logContainer">
     </div>
    `;
  }

  connectedCallback() {
    window.addEventListener('datalayerpush', this.handlePush.bind(this));
    window.addEventListener('cleardatalayerlogs', this.clearLogs.bind(this));

    window.addEventListener('message', this.handlePostMessage.bind(this));

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
    logItem.classList.add('logItem');
    logItem.innerHTML = this.formatMessage(data.event, data, 'dataLayer');
    logContainer.appendChild(logItem);
  }


  writeMessage(data) {
    const logContainer = this.shadowRoot.querySelector('.logContainer');
    const messageItem = document.createElement('details');
    messageItem.classList.add('messageItem');
    try {
      const eventInfoArray = data.split(/:(.+)/);
      const eventType = eventInfoArray[0];
      const parsedData = JSON.parse(eventInfoArray[1]);
      messageItem.innerHTML = this.formatMessage(eventType, parsedData, 'internal');
      logContainer.appendChild(messageItem);
    } catch (e) {
      console.error(`Could not parse message ${JSON.stringify(data)}`);
    }
  }

  formatMessage(eventType, data, source) {
    let html = `<summary>${eventType} <small>${source}</small></summary>`;
    html += `${this.formatData(data)};`
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
}

customElements.define('datalayer-logger', dataLayerLogger);