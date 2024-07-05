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
          background-color: #140423;
          font-family: monospace;
          overflow: hidden;
          overflow-y: scroll;
          height: 600px;
        }
        .logItem {
            padding: 5px;
            margin: 5px 0;;
            font-size: 10px;
            background: #2d1147;
            overflow: hidden;
        }
        .messageItem {
            padding: 5px;
            margin: 5px 0;;
            font-size: 10px;
            background: #890978;
            overflow: hidden;
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
    this.writeMessage(e.data);
  }

  writeDataLayerPush(data) {
    const logContainer = this.shadowRoot.querySelector('.logContainer');
    const logItem = document.createElement('div');
    logItem.classList.add('logItem');
    logItem.innerHTML = this.formatMessage(data.event, data);
    logContainer.appendChild(logItem);
  }


  writeMessage(data) {
    const logContainer = this.shadowRoot.querySelector('.logContainer');
    const messageItem = document.createElement('div');
    messageItem.classList.add('messageItem');
    const eventInfoArray = data.split(/:(.+)/);
    const eventType = eventInfoArray[0];
    const parsedData = JSON.parse(eventInfoArray[1]);
    messageItem.innerHTML = this.formatMessage(eventType, parsedData);
    logContainer.appendChild(messageItem);
  }

  formatMessage(eventType, data) {
    let html = `<h3>${eventType}</h3>`;
    html += this.formatData(data);
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