customElements.define('survicate-manager', class SurvicateManager extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
        <zui-card collapsed="true">
            <div slot="header" class="headerslot">
                <zui-status-light status="disabled" id="statusLight"></zui-status-light>Survicate Manager
            </div>
            <div slot="content">
                <div>
                    <zui-label>Workspace ID:</zui-label>
                    <zui-input name="workspaceId" id="workspaceId" value="29e48a862a073ee0a0a9f821d49f1da3"></zui-input>
                </div>
                <div>
                    <zui-label>Manual Event:</zui-label>
                    <div class="manualEventContainer">
                        <zui-input name="manualEventName" id="manualEventName" value="thankYouPageReached" placeholder="Enter event name"></zui-input>
                        <zui-button id="triggerManualEvent" label="Trigger Event" version="primary"></zui-button>
                    </div>
                </div>
                <div>
                    <zui-label>Events:</zui-label>
                    <zui-log-screen class="logContainer"></zui-log-screen>
                </div>
            </div>
            <div slot="footer">
                <div class="footerSlot">
                    <zui-button class="footerbutton" id="loadSurvicate" label="Load Survicate" width="100%" version="cta"></zui-button>
                </div>
            </div>
        </zui-card>
        <style>
            .headerslot {
                display: flex;
                align-items: center;
                justify-content: flex-start;
            }
            .footerSlot {
                width: 100%;
                display: flex;
                flex-direction: row;
                gap: 10px;
            }
            .footerbutton {
                flex: 1 1 auto;
            }
            .manualEventContainer {
                display: flex;
                flex-direction: row;
                gap: 10px;
                align-items: center;
            }
            .manualEventContainer zui-input {
                flex: 1 1 auto;
            }
            .manualEventContainer zui-button {
                flex: 0 0 auto;
            }
            .logItem {
                padding: 5px;
                margin: 5px 0;
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
        </style>
        `;
    }

    connectedCallback() {
        this.shadowRoot.getElementById('loadSurvicate').addEventListener('click', () => { 
            this.loadSurvicateScript(); 
        });
        this.shadowRoot.getElementById('workspaceId').addEventListener('zui-change', (e) => {
            this.workspaceId = e.detail.value;
        });
        this.shadowRoot.getElementById('triggerManualEvent').addEventListener('click', () => {
            this.triggerManualEvent();
        });
        this.workspaceId = this.shadowRoot.getElementById('workspaceId').getAttribute('value');
    }

    loadSurvicateScript = async () => {
        // Check if script is already loaded
        if (window._sva) {
            const workspaceIdInput = this.shadowRoot.getElementById('workspaceId');
            const workspaceId = workspaceIdInput.shadowRoot?.querySelector('input')?.value || 
                               workspaceIdInput.getAttribute('value') || 
                               this.workspaceId;
            this.logEvent('SurvicateReady', { workspaceId: workspaceId, alreadyLoaded: true });
            this.shadowRoot.getElementById('statusLight').setAttribute('status', 'success');
            this.setupEventListeners();
            return;
        }

        this.shadowRoot.getElementById('loadSurvicate').setAttribute('loading', 'true');
        this.shadowRoot.getElementById('statusLight').setAttribute('status', 'loading');

        // Get workspace ID from input element
        const workspaceIdInput = this.shadowRoot.getElementById('workspaceId');
        const workspaceId = workspaceIdInput.shadowRoot?.querySelector('input')?.value || 
                           workspaceIdInput.getAttribute('value') || 
                           this.workspaceId;
        
        // Listen for SurvicateReady event (window event, not _sva)
        const readyHandler = () => {
            this.logEvent('SurvicateReady', { workspaceId: workspaceId });
            this.shadowRoot.getElementById('statusLight').setAttribute('status', 'success');
            this.shadowRoot.getElementById('loadSurvicate').setAttribute('loading', 'false');
            this.setupEventListeners();
            window.removeEventListener('SurvicateReady', readyHandler);
        };
        window.addEventListener('SurvicateReady', readyHandler);

        // Create and load the script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = `https://survey.survicate.com/workspaces/${workspaceId}/web_surveys.js`;
        script.async = true;
        script.onerror = () => {
            this.shadowRoot.getElementById('statusLight').setAttribute('status', 'error');
            this.shadowRoot.getElementById('loadSurvicate').setAttribute('loading', 'false');
            window.removeEventListener('SurvicateReady', readyHandler);
        };
        
        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
            firstScript.parentNode.insertBefore(script, firstScript);
        } else {
            document.head.appendChild(script);
        }
    }

    setupEventListeners = () => {
        if (!window._sva) {
            console.warn('Survicate _sva object not available');
            return;
        }

        // Remove existing listeners if any
        if (this.eventListeners) {
            this.eventListeners.forEach(({ event, listener }) => {
                try {
                    window._sva.removeEventListener(event, listener);
                } catch (e) {
                    // Ignore errors when removing listeners
                }
            });
        }

        this.eventListeners = [];

        // List of Survicate events to listen for
        const events = [
            'survey_displayed',
            'question_answered',
            'survey_completed',
            'survey_closed'
        ];

        events.forEach(eventName => {
            const listener = (data) => {
                this.logEvent(eventName, data);
            };
            
            try {
                window._sva.addEventListener(eventName, listener);
                this.eventListeners.push({ event: eventName, listener });
            } catch (e) {
                console.error(`Failed to add listener for ${eventName}:`, e);
            }
        });

        // Setup Chameleon event integration
        this.setupChameleonEvents();
    }

    setupChameleonEvents = () => {
        const setUpChameleonEvents = () => {
            if (typeof window._sva === 'undefined' || typeof window.formWidgetInfoObject === 'undefined') {
                return;
            }

            window.formWidgetInfoObject.registerEventHandler('thankYouPageReached', function() {
                if (window._sva && typeof window._sva.invokeEvent === 'function') {
                    window._sva.invokeEvent('thankYouPageReached');
                    this.logEvent('ChameleonEventTriggered', { event: 'thankYouPageReached' });
                }
            }.bind(this));
        };

        // Check if both are already available
        if (typeof window.formWidgetInfoObject !== 'undefined' && typeof window._sva !== 'undefined') {
            setUpChameleonEvents();
        } else {
            // Poll for both to be available
            let intervals = 20;
            const interval = setInterval(() => {
                intervals--;
                if (typeof window.formWidgetInfoObject !== 'undefined' && typeof window._sva !== 'undefined') {
                    clearInterval(interval);
                    setUpChameleonEvents();
                }
                if (intervals === 0) {
                    clearInterval(interval);
                }
            }, 500);
        }
    }

    logEvent = (eventType, data) => {
        const logContainer = this.shadowRoot.querySelector('.logContainer');
        const logItem = document.createElement('details');
        logItem.classList.add('logItem');
        logItem.innerHTML = this.formatMessage(eventType, data);
        logContainer.appendChild(logItem);
    }

    formatMessage = (eventType, data) => {
        let html = `<summary>${eventType} <small>survicate</small></summary>`;
        html += `${this.formatData(data)}`;
        html += `<div class="timestamp">timestamp: ${Date.now()}</div>`;
        return html;
    }

    formatData = (data) => {
        if (!data || typeof data !== 'object') {
            return `<div>No data available</div>`;
        }
        return Object.keys(data).map(key => {
            const value = data[key];
            if (value === null || value === undefined) {
                return `<strong>${key}</strong>: null`;
            }
            return `<strong>${key}</strong>: ${typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)}`;
        }).join('<br>');
    }

    triggerManualEvent = () => {
        if (!window._sva) {
            this.logEvent('ManualEventError', { error: 'Survicate _sva object not available. Please load Survicate first.' });
            return;
        }

        if (typeof window._sva.invokeEvent !== 'function') {
            this.logEvent('ManualEventError', { error: 'invokeEvent function not available on _sva object' });
            return;
        }

        const eventNameInput = this.shadowRoot.getElementById('manualEventName');
        const eventName = eventNameInput.shadowRoot?.querySelector('input')?.value?.trim() || 
                         eventNameInput.getAttribute('value')?.trim();

        if (!eventName) {
            this.logEvent('ManualEventError', { error: 'Event name is required' });
            return;
        }

        try {
            window._sva.invokeEvent(eventName);
            this.logEvent('ManualEventTriggered', { event: eventName });
        } catch (error) {
            this.logEvent('ManualEventError', { error: error.message, event: eventName });
        }
    }
});

