customElements.define('chameleon-form-manager', class ChameleonFormManager extends HTMLElement {
    constructor() {
        super();

        this.envOptions = [
            { label: 'Local', value: 'dev' },
            { label: 'Staging', value: 'staging' },
            { label: 'Staging A1', value: 'a1.staging' },
            { label: 'Staging A2', value: 'a2.staging' },
            { label: 'Staging A3', value: 'a3.staging' },
            { label: 'Staging A4', value: 'a4.staging' },
            { label: 'Staging A5', value: 'a5.staging' },
            { label: 'Staging A6', value: 'a6.staging' },
            { label: 'Staging B1', value: 'b1.staging' },
            { label: 'Production NA', value: 'production.na' },
            { label: 'Production EU', value: 'production.eu' }
        ];

        this.themeOptions = [
            { label: 'Chameleon', value: 'chameleon' },
            { label: 'Rhubarb', value: 'rhubarb' },
            { label: 'Atlantic', value: 'atlantic' },
            { label: 'Indigo', value: 'indigo' },
            { label: 'GoWizard', value: 'gowizard' },
            { label: 'Custom', value: 'custom' }
        ];

        this.attachShadow({mode: 'open'});
        this.shadowRoot.innerHTML = `
        <zui-card collapsed="false">
            <div slot="header" class="headerslot">
                <zui-status-light status="disabled" id="statusLight"></zui-status-light>Chameleon Form Manager
            </div>
            <div slot="content">
                <div>
                    <zui-label>Env:</zui-label>
                    <zui-select name="env" id="env" options='${JSON.stringify(this.envOptions)}'>
                    </zui-select>
                </div>
                <div>
                    <zui-label>Form Id:</zui-label>
                    <zui-input name="formId" id="formId"></zui-input>
                </div>
                <div>
                    <zui-label>Theme:</zui-label>
                    <zui-select name="theme" id="theme" options='${JSON.stringify(this.themeOptions)}'>
                </div>
                <div>
                    <zui-label>Feature flags:</zui-label>
                    <zui-input name="featureFlags" id="featureFlags"></zui-input>
                </div>
                <div>
                    <zui-toggle name="isConsentStatementAboveNavigation" id="isConsentStatementAboveNavigation" label="Consent statement above navigation"><div slot="label">Consent statement above navigation</div></zui-toggle>
                    <zui-toggle name="isDynamicHeight" id="isDynamicHeight" label="Dynamic height"><div slot="label">Dynamic height</div></zui-toggle>
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

        this.config = {
            env: null,
            theme: null,
            formId: null,
            featureFlags: null,
            isConsentStatementAboveNavigation: false,
            isDynamicHeight: true
        }

        this.formHistory = [];
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
        this.loadConfig();
        this.shadowRoot.getElementById('featureFlags').setAttribute('value', this.config.featureFlags || '');
        this.shadowRoot.getElementById('featureFlags').addEventListener('zui-change', (e) => {
            this.config.featureFlags = e.detail.value;
            this.saveConfig('featureFlags', e.detail.value);
        });
        this.shadowRoot.getElementById('isConsentStatementAboveNavigation').addEventListener('zui-toggle-change', (e) => {
            this.config.isConsentStatementAboveNavigation = e.detail.checked;
            this.saveConfig('isConsentStatementAboveNavigation', e.detail.checked);
        });
        this.shadowRoot.getElementById('isDynamicHeight').addEventListener('zui-toggle-change', (e) => {
            this.config.isDynamicHeight = e.detail.checked;
            this.saveConfig('isDynamicHeight', e.detail.checked);
        });
        this.populateFormHistory();
    }

    loadConfig() {
        const configFromLocalStorage = localStorage.getItem('chameleonFormManagerConfig') || '{}';
        if (configFromLocalStorage) {
            const parsedConfig =  JSON.parse(configFromLocalStorage);
            this.config = {
                ...this.config,
                ...parsedConfig
            };
        }

    }

    saveConfig = (fieldName, value) => {
        this.configFromLocalStorage = JSON.parse(localStorage.getItem('chameleonFormManagerConfig')) || {};
        this.configFromLocalStorage[fieldName] = value;
        localStorage.setItem('chameleonFormManagerConfig', JSON.stringify(this.configFromLocalStorage));
    }

    pushFormIdToHistory(formId, env, theme, metadata) {
        if (this.formHistory.some(form => (form.formId === formId && form.env === env && form.theme === theme))) {
            console.log('MATCH FOUND');
            this.formHistory = this.formHistory.filter(form => (form.formId !== formId || form.env !== env || form.theme !== theme));
        }
        this.formHistory.push({
            formId: formId,
            env: env,
            theme: theme,
            lastUsed: new Date().toISOString(),
            label: `${formId} - ${env} ${theme} - (${metadata.subcategoryName}, ${metadata.locale})`
        });

        localStorage.setItem('formHistory', JSON.stringify(this.formHistory));
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
            throw new Error('Failed to find form');
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
        if (this.config.isConsentStatementAboveNavigation) {
            this.shadowRoot.getElementById('isConsentStatementAboveNavigation').setAttribute('checked', 'true');
        }
        if (this.config.isDynamicHeight) {
            this.shadowRoot.getElementById('isDynamicHeight').setAttribute('checked', 'true');
        }
    }

    loadChameleonScript = async (env, formId, themeName) => {
        const jsHost = this.getChameleonFrontEndHostForEnv(env);
        const container = document.getElementById('chameleonContainer');
        container.innerHTML = "";
        // load the translation layer
        const translationLayer = document.createElement('script');
        translationLayer.src = `${jsHost}/mvfGtmTranslationLayer.min.js`;

        container.appendChild(translationLayer);

            const formConfigTag = document.createElement('script');
            formConfigTag.innerHTML = `
                window.chameleonTestSettings = {
                    features: ${JSON.stringify((this.config.featureFlags || 'default').split(',').map(flag => flag.trim()))},
                }`;
            container.appendChild(formConfigTag);

        // Load the form loader
        const formLoader = document.createElement('script');
        formLoader.src = `${jsHost}/formLoader.min.js`;
        container.appendChild(formLoader);

        await new Promise((resolve) => { setTimeout(resolve, 1000) });

        const scriptTag = document.createElement('script');

        const dynamicHeight = this.config.isDynamicHeight ? 'true' : 'false';
        const isConsentStatementAboveNavigation = this.config.isConsentStatementAboveNavigation ? 'true' : 'false';



        scriptTag.innerHTML = `
            var inputData = {
                domain: 'eu',
                env: '${env}',
                formId: '${formId}',
                dynamicHeight: ${dynamicHeight},
                height: 450,
                themeName: '${themeName}',
                isConsentStatementAboveNavigation: ${isConsentStatementAboveNavigation},
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