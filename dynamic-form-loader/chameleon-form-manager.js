customElements.define('chameleon-form-manager', class ChameleonFormManager extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.shadowRoot.innerHTML = `
        <zui-card collapsed="false">
            <div slot="header" class="headerslot">
                <zui-status-light status="disabled" id="statusLight"></zui-status-light>Chameleon Form Manager
            </div>
            <div slot="content">
                <div>
                    <zui-label>Env:</zui-label>
                    <zui-input name="env" id="env"></zui-input>
                </div>
                <div>
                    <zui-label>Form Id:</zui-label>
                    <zui-input name="formId" id="formId"></zui-input>
                </div>
                <div>
                    <zui-label>Theme:</zui-label>
                    <zui-input name="theme" id="theme"></zui-input>
                </div>
                <div>
                    <zui-label>Feature flags:</zui-label>
                    <zui-input name="featureFlags" id="featureFlags"></zui-input>
                </div> 
            </div>
             <div slot="footer">
                    <div class="footerSlot">
                        <zui-button id="toggleHistory" label="history" width="100%" version="primary"></zui-button>
                        <zui-button id="loadForm" label="Load form" width="100%"></zui-button>
                    </div>
                    <zui-dropdown id="formHistoryDropdown" open="false"></zui-dropdown>
            </div>
        </zui-card>
        <style>
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
            
            .footerSlot #loadForm {
                flex: 1 1 auto;
            }
        </style>
        `;

        this.envOptions = [
            { label: 'Development', value: 'dev' },
            { label: 'Staging', value: 'staging' },
            { label: 'Production', value: 'prod' }
        ];

        this.themeOptions = [
            { label: 'Default', value: 'default' },
            { label: 'Dark', value: 'dark' },
            { label: 'Light', value: 'light' }
        ];

        this.config = {
            env: null,
            theme: null,
            formId: null
        }

        this.formHistory= [];
    }

    getChameleonFrontEndHostForEnv = (env) => {
        switch (env) {
            case 'dev':
                return 'http://chameleon.localhost:2000';
            case 'staging':
                return 'https://chameleon-frontend-staging.mvfglobal.com';
            case 'a1.staging':
                return 'https://chameleon-frontend-a1.staging.mvfglobal.com';
            case 'a2.staging':
                return 'https://chameleon-frontend-a2.staging.mvfglobal.com';
            case 'a3.staging':
                return 'https://chameleon-frontend-a3.staging.mvfglobal.com';
            case 'a4.staging':
                return 'https://chameleon-frontend-a4.staging.mvfglobal.com';
            case 'a5.staging':
                return 'https://chameleon-frontend-a5.staging.mvfglobal.com';
            case 'a6.staging':
                return 'https://chameleon-frontend-a6.staging.mvfglobal.com';
            case 'b1.staging':
                return 'https://chameleon-frontend-b1.staging.mvfglobal.com';
            case 'production.eu':
                return 'https://chameleon-frontend-eu.mvfglobal.com';
            case 'production.na':
                return 'https://chameleon-frontend-na.mvfglobal.com';
            default:
                return 'https://chameleon-frontend-staging.mvfglobal.com';
        }
    }

    getCaptureHostForEnv = (env) => {
        switch (env) {
            case 'dev':
                return 'https://capture.localhost';
            case 'staging':
                return 'https://capture-a.ecs.stg9.eu-west-1.mvfglobal.net';
            case 'a1.staging':
                return 'https://capture-a.ecs.stg9.eu-west-1.mvfglobal.net';
            case 'a2.staging':
                return 'https://capture-a.ecs.stg9.eu-west-1.mvfglobal.net';
            case 'a3.staging':
                return 'https://capture-a.ecs.stg9.eu-west-1.mvfglobal.net';
            case 'a4.staging':
                return 'https://capture-a.ecs.stg9.eu-west-1.mvfglobal.net';
            case 'a5.staging':
                return 'https://capture-a.ecs.stg9.eu-west-1.mvfglobal.net';
            case 'a6.staging':
                return 'https://capture-a.ecs.stg9.eu-west-1.mvfglobal.net';
            case 'b1.staging':
                return 'https://capture-b.ecs.stg9.eu-west-1.mvfglobal.net';
            case 'production.eu':
                return 'https://capture-eu.mvfglobal.com';
            case 'production.na':
                return 'https://capture-na.mvfglobal.com/';
            default:
                return 'https://capture-a.ecs.stg9.eu-west-1.mvfglobal.net';
        }
    }

    connectedCallback() {
        window.addEventListener('message', (e) => { this.handlePostMessage(e) });
        this.shadowRoot.getElementById('loadForm').addEventListener('click', () => { this.loadForm() });
        this.shadowRoot.getElementById('formId').addEventListener('zui-change', (e) => {
            this.config.formId = e.detail.value;
        });
        this.shadowRoot.getElementById('env').addEventListener('zui-change', (e) => {
            this.config.env = e.detail.value;
        });
        this.shadowRoot.getElementById('theme').addEventListener('zui-change', (e) => {
            this.config.theme = e.detail.value;
        });
        this.shadowRoot.getElementById('toggleHistory').addEventListener('click', (e) => {
            e.stopPropagation();
            this.shadowRoot.getElementById('formHistoryDropdown').setAttribute('open', 'true');
        });
        window.addEventListener('click', (e) => {
            if (!e.composedPath().includes(this.shadowRoot.getElementById('formHistoryDropdown'))) {
                this.shadowRoot.getElementById('formHistoryDropdown').setAttribute('open', 'false');
            }
        });
        this.populateFormHistory();
    }

    pushFormIdToHistory(formId, env, theme, metadata) {
        let formHistory = JSON.parse(localStorage.getItem('formHistory')) || [];
        if (formHistory.some(form => form.formId === formId)) {
            formHistory = formHistory.filter(form => form.formId !== formId);
        }

        formHistory.push({
            formId: formId,
            env: env,
            theme: theme,
            lastUsed: new Date().toISOString(),
            label: `${formId} - ${env} (${metadata.subcategoryName}, ${metadata.locale})`
        });
        localStorage.setItem('formHistory', JSON.stringify(formHistory));
    }

    loadForm = async () => {
        this.shadowRoot.getElementById('loadForm').setAttribute('loading', 'true');
        this.shadowRoot.getElementById('statusLight').setAttribute('status', 'loading');
        try {
            const metadata = await this.getFormMetaDataFromCapture(this.config.formId, this.config.env);
            this.loadChameleonScript(this.config.env, this.config.formId, this.config.theme);
            this.pushFormIdToHistory(
                this.config.formId,
                this.config.env,
                this.config.theme,
                metadata,
            );
        } catch (e) {
            console.error(e);
            this.shadowRoot.getElementById('loadForm').setAttribute('loading', 'false');
            this.shadowRoot.getElementById('statusLight').setAttribute('status', 'error');
        }
    }

    getFormMetaDataFromCapture = async (formId, env) => {
        try {
            const host = this.getCaptureHostForEnv(env);
            const res = await fetch(`${host}/api/v1/${formId}/settings`);
            const data = await res.json();
            return {
                defaultCampaignId: data.forms[formId].metadata.default_campaign_id,
                subcategoryName: data.forms[formId].metadata.subcategoryName,
                locale: data.forms[formId].metadata.locale_code
            };
        } catch (e) {
            throw new Error('Failed to find form')
        }
    }

    getValueFromLocalStorageOrQueryStringParams = (key) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(key) || localStorage.getItem(key);
    }

    orderFormHistory = () => {
        this.formHistory = this.formHistory.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
    }

    populateFormHistory() {
        this.formHistory = JSON.parse(localStorage.getItem('formHistory')) || [];
        this.orderFormHistory();
        this.shadowRoot.getElementById('formHistoryDropdown').innerHTML = "";
        this.formHistory.map((form, index) => {
            if (index === 0 && !this.config.formId) {
                this.config.formId = form.formId;
                this.config.env = form.env;
                this.config.theme = form.theme;
                this.shadowRoot.getElementById('formId').setAttribute('value', form.formId);
                this.shadowRoot.getElementById('env').setAttribute('value', form.env);
                this.shadowRoot.getElementById('theme').setAttribute('value', form.theme);
                this.loadForm();
            }
            const item = document.createElement('zui-dropdown-item');
            item.innerHTML = `<div>${form.label}</div>`;
            item.addEventListener('click', (e) => {
                this.config.formId = form.formId;
                this.config.env = form.env;
                this.config.theme = form.theme;
                this.shadowRoot.getElementById('formId').setAttribute('value', form.formId);
                this.shadowRoot.getElementById('env').setAttribute('value', form.env);
                this.shadowRoot.getElementById('theme').setAttribute('value', form.theme);
                this.shadowRoot.getElementById('formHistoryDropdown').setAttribute('open', 'false');
                this.populateFormHistory();
                this.loadForm();
            });
            this.shadowRoot.getElementById('formHistoryDropdown').appendChild(item);
        });
    }

    loadChameleonScript = async (env, formId, themeName) => {
        const jsHost = this.getChameleonFrontEndHostForEnv(env);
        const container = document.getElementById('chameleonContainer');
        container.innerHTML = "";
        // load the translation layer
        const translationLayer = document.createElement('script');
        translationLayer.src = `${jsHost}/mvfGtmTranslationLayer.min.js`;
        container.appendChild(translationLayer);

        // Load the form loader
        const formLoader = document.createElement('script');
        formLoader.src = `${jsHost}/formLoader.min.js`;
        container.appendChild(formLoader);

        await new Promise((resolve) => { setTimeout(resolve, 1000) });

        const scriptTag = document.createElement('script');
        scriptTag.innerHTML = `
            var inputData = {
                domain: 'eu',
                env: '${env}',
                formId: '${formId}',
                dynamicHeight: true,
                height: 450,
                themeName: '${themeName}',
                isConsentStatementAboveNavigation: false
            };
            var formWidgetInfoObject = runFormWidgetLoader(inputData);
        `;
        container.appendChild(scriptTag);

    }

    handlePostMessage = (e) => {
        if (e?.data?.source === 'react-devtools-content-script') {
            return;
        }

        if (typeof e?.data === 'string' && e.data.startsWith('initialWidgetLoad')) {
            this.shadowRoot.getElementById('loadForm').setAttribute('loading', 'false');
            this.shadowRoot.getElementById('statusLight').setAttribute('status', 'success');
        }

        if (typeof e?.data === 'string' && e.data.startsWith('formError')) {
            this.shadowRoot.getElementById('loadForm').setAttribute('loading', 'false');
            this.shadowRoot.getElementById('statusLight').setAttribute('status', 'warning');
        }

    }


    getFormSettings = async () => {

    }
});