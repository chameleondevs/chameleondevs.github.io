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
            { label: 'Production EU', value: 'production.eu' },
            { label: 'Feature', value: 'feature' }
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
                <div id="featureRow" hidden>
                    <zui-label>Feature:</zui-label>
                    <zui-input name="feature" id="feature"></zui-input>
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
                <div>
                    <zui-copy-to-clipboard id="clipboard" value="" hidden></zui-copy-to-clipboard>
                </div>
            </div>
             <div slot="footer">
                    <div class="footerSlot">
                        <zui-button id="toggleHistory" label="history" width="100%" version="primary"></zui-button>
                        <zui-button id="share" label="share" width="100%" version="primary"></zui-button>
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
            env: 'staging',
            theme: 'chameleon',
            formId: '',
            featureFlags: null,
            isConsentStatementAboveNavigation: false,
            isDynamicHeight: true,
            autoScroll: true,
            feature: '',
        }

        this.formHistory = [];
    }

    getChameleonFrontEndHostForEnv = (env, feature) => {
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
            case 'feature':
                return `https://${feature}.chameleon.staging.mvfglobal.com`;
            default:
                return 'https://chameleon-frontend-staging.mvfglobal.com';
        }
    }

    getCaptureHostForEnv = (env) => {
        switch (env) {
            case 'dev':
                // return 'https://capture.localhost';
                return 'https://capture-a.ecs.stg9.eu-west-1.mvfglobal.net';
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
                return 'https://capture-na.mvfglobal.com';
            default:
                return 'https://capture-a.ecs.stg9.eu-west-1.mvfglobal.net';
        }
    }

    getEnvShortName(env, feature) {
        switch(env) {
            case 'dev':
                return 'dev';
            case 'staging':
                return 'stg';
            case 'a1.staging':
                return 'a1';
            case 'a2.staging':
                return 'a2';
            case 'a3.staging':
                return 'a3';
            case 'a4.staging':
                return 'a4';
            case 'a5.staging':
                return 'a5';
            case 'a6.staging':
                return 'a6';
            case 'b1.staging':
                return 'b1';
            case 'production.eu':
                return 'eu';
            case 'production.na':
                return 'na';
            case 'feature':
                return `${feature}`;
            default:
                return '?';
        }
    }

    formatEnvForConfig = (env, feature) => {
        if (env === 'feature') {
            return `staging/${feature}`;
        }
        return env;
    }

    getTagColorForEnv = (env) => {
        switch (env) {
            case 'dev':
                return 'success';
            case 'production.eu':
                return 'error';
            case 'production.na':
                return 'error';
            case 'staging':
                return 'warning';
            default:
                return 'warning';
        }
    }

    connectedCallback() {
        this.loadConfig();
        this.shadowRoot.getElementById('formId').setAttribute('value', this.config.formId);
        this.shadowRoot.getElementById('env').setAttribute('value', this.config.env);
        this.shadowRoot.getElementById('theme').setAttribute('value', this.config.theme);
        this.shadowRoot.getElementById('feature').setAttribute('value', this.config.feature);
        window.addEventListener('message', (e) => { this.handlePostMessage(e) });
        this.shadowRoot.getElementById('loadForm').addEventListener('click', () => { this.loadForm() });
        this.shadowRoot.getElementById('formId').addEventListener('zui-change', (e) => {
            this.config.formId = e.detail.value;
        });
        this.shadowRoot.getElementById('env').addEventListener('zui-change', (e) => {
            this.config.env = e.detail.value;
            if (e.detail.value === 'feature') {
                this.shadowRoot.getElementById('featureRow').removeAttribute('hidden');
            } else {
                this.shadowRoot.getElementById('featureRow').setAttribute('hidden', 'true');
            }
        });
        this.shadowRoot.getElementById('feature').addEventListener('zui-change', (e) => {
            this.config.feature = e.detail.value;
        });
        this.shadowRoot.getElementById('theme').addEventListener('zui-change', (e) => {
            this.config.theme = e.detail.value;
        });
        this.shadowRoot.getElementById('toggleHistory').addEventListener('click', (e) => {
            e.stopPropagation();
            this.shadowRoot.getElementById('formHistoryDropdown').setAttribute('open', 'true');
        });
        this.shadowRoot.getElementById('share').addEventListener('click', (e) => {
            this.generateSharableUrl();
            this.shadowRoot.getElementById('clipboard').toggleAttribute('hidden');
        });
        window.addEventListener('click', (e) => {
            if (!e.composedPath().includes(this.shadowRoot.getElementById('formHistoryDropdown'))) {
                this.shadowRoot.getElementById('formHistoryDropdown').setAttribute('open', 'false');
            }
        });
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
        if (this.config.formId && this.config.env && this.config.theme) {
            if (this.config.env === 'feature') {
                this.shadowRoot.getElementById('featureRow').removeAttribute('hidden');
            }
            this.loadForm();
            this.clearUrlParams();
        }
    }

    generateSharableUrl() {
        const url = new URL(window.location.href);
        url.searchParams.set('formId', this.config.formId);
        url.searchParams.set('env', this.config.env);
        url.searchParams.set('theme', this.config.theme);
        url.searchParams.set('feature', this.config.feature);
        if (this.config.featureFlags) {
            url.searchParams.set('featureFlags', this.config.featureFlags);
        }
        url.searchParams.set('isConsentStatementAboveNavigation', this.config.isConsentStatementAboveNavigation);
        url.searchParams.set('isDynamicHeight', this.config.isDynamicHeight);

        this.shadowRoot.getElementById('clipboard').setAttribute('value', url.href);
    }

    clearUrlParams() {
        const url = new URL(window.location.href);
        url.searchParams.delete('formId');
        url.searchParams.delete('env');
        url.searchParams.delete('theme');
        url.searchParams.delete('featureFlags');
        url.searchParams.delete('isConsentStatementAboveNavigation');
        url.searchParams.delete('isDynamicHeight');
        url.searchParams.delete('feature');
        window.history.pushState({}, '', url.href);
    }

    getConfigFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const config = {};
        if (urlParams.get('featureFlags')) {
            config.featureFlags = urlParams.get('featureFlags');
            this.saveConfig('featureFlags', urlParams.get('featureFlags'));
        }
        if (urlParams.get('feature')) {
            config.feature = urlParams.get('feature');
            this.saveConfig('feature', urlParams.get('feature'));
        }
        if (urlParams.get('isConsentStatementAboveNavigation')) {
            config.isConsentStatementAboveNavigation = urlParams.get('isConsentStatementAboveNavigation') === 'true';
            this.saveConfig('isConsentStatementAboveNavigation', urlParams.get('isConsentStatementAboveNavigation') === 'true');
        }
        if (urlParams.get('isDynamicHeight')) {
            config.isDynamicHeight = urlParams.get('isDynamicHeight') === 'true';
            this.saveConfig('isDynamicHeight', urlParams.get('isDynamicHeight') === 'true');
        }
        if (urlParams.get('formId') && !isNaN(urlParams.get('formId'))) {
            config.formId = urlParams.get('formId');
            this.saveConfig('formId', urlParams.get('formId'));
        }
        if (urlParams.get('env') && this.envOptions.map(option => option.value).includes(urlParams.get('env'))) {
            config.env = urlParams.get('env');
            this.saveConfig('env', urlParams.get('env'));
        }
        if (urlParams.get('theme') && this.themeOptions.map(option => option.value).includes(urlParams.get('theme'))) {
            config.theme = urlParams.get('theme');
            this.saveConfig('theme', urlParams.get('theme'));
        }
        return config;
    }

    getLatestFormConfigFromHistory() {
        this.formHistory = JSON.parse(localStorage.getItem('formHistory')) || [];
        const orderedFormHistory = this.formHistory.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
        if (orderedFormHistory.length > 0) {
            return {
                formId: this.formHistory[0].formId,
                env: this.formHistory[0].env,
                theme: this.formHistory[0].theme,
                feature: this.formHistory[0].feature
            }
        }
        return {};
    }

    loadConfig() {
        const configFromLocalStorage = localStorage.getItem('chameleonFormManagerConfig') || '{}';
        const parsedConfig =  JSON.parse(configFromLocalStorage);
        const configFromHistory = this.getLatestFormConfigFromHistory();
        const configFromUrl = this.getConfigFromUrl();
        this.config = {
            ...this.config,
            ...parsedConfig,
            ...configFromHistory,
            ...configFromUrl
        };
    }

    saveConfig = (fieldName, value) => {
        this.configFromLocalStorage = JSON.parse(localStorage.getItem('chameleonFormManagerConfig')) || {};
        this.configFromLocalStorage[fieldName] = value;
        localStorage.setItem('chameleonFormManagerConfig', JSON.stringify(this.configFromLocalStorage));
    }

    pushFormIdToHistory(formId, env, theme, metadata, feature) {
        if (this.formHistory.some(form => (form.formId === formId && form.env === env && form.theme === theme))) {
            this.formHistory = this.formHistory.filter(form => (form.formId !== formId || form.env !== env || form.theme !== theme));
        }
        this.formHistory.push({
            formId: formId,
            env: env,
            theme: theme,
            lastUsed: new Date().toISOString(),
            subcategoryName: metadata?.subcategoryName,
            locale: metadata?.locale,
            feature: feature
        });

        localStorage.setItem('formHistory', JSON.stringify(this.formHistory));
    }

    loadForm = async () => {
        this.shadowRoot.getElementById('loadForm').setAttribute('loading', 'true');
        this.shadowRoot.getElementById('statusLight').setAttribute('status', 'loading');
        try {
            const metadata = await this.getFormMetaDataFromCapture(this.config.formId, this.config.env);
            this.loadChameleonScript(this.config.env, this.config.formId, this.config.theme, this.config.feature);
            this.pushFormIdToHistory(
                this.config.formId,
                this.config.env,
                this.config.theme,
                metadata,
                this.config.feature
            );
            this.generateSharableUrl();
            window.dispatchEvent(new CustomEvent('cleardatalayerlogs'));
        } catch (e) {
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
            if (env === 'dev') {
                console.log('Failed to fetch form metadata from capture, ignoring as it\'s a local environment');
                return;
            }
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
            const item = document.createElement('zui-dropdown-item');
            item.innerHTML = `<div style="display: flex; align-items: center; justify-content: flex-start; gap: 5px;">
                <zui-tag type="${this.getTagColorForEnv(form.env)}">${this.getEnvShortName(form.env, form.feature)}</zui-tag>
                <pre>${form.formId}</pre>
                <div>${form.subcategoryName || 'metadata unkown'}&nbsp; ${form.locale ? `<small>(${form.locale})</small>` : ''}</div>
                </div>`;
            item.addEventListener('click', (e) => {
                this.config.formId = form.formId;
                this.config.env = form.env;
                this.config.theme = form.theme;
                this.config.feature = form.feature;
                this.shadowRoot.getElementById('formId').setAttribute('value', form.formId);
                this.shadowRoot.getElementById('env').setAttribute('value', form.env);
                this.shadowRoot.getElementById('theme').setAttribute('value', form.theme);
                this.shadowRoot.getElementById('feature').setAttribute('value', form.feature);
                this.shadowRoot.getElementById('formHistoryDropdown').setAttribute('open', 'false');
                if (form.env === 'feature') {
                    this.shadowRoot.getElementById('featureRow').removeAttribute('hidden');
                } else {
                    this.shadowRoot.getElementById('featureRow').setAttribute('hidden', 'true');
                }
                this.populateFormHistory();
                this.clearUrlParams();
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

    loadChameleonScript = async (env, formId, themeName, feature) => {
        const jsHost = this.getChameleonFrontEndHostForEnv(env, feature);
        const container = document.getElementById('chameleonContainer');
        container.innerHTML = "";
        window.chameleon = undefined;
        window.chameleonSettings = undefined;
        window.chameleonTestSettings = undefined;

        // load the translation layer
        const translationLayer = document.createElement('script');
        translationLayer.src = `${jsHost}/mvfGtmTranslationLayer.min.js`;
        container.appendChild(translationLayer);
        const formConfigTag = document.createElement('script');
        formConfigTag.innerHTML = `
            window.chameleonTestSettings = {
                features: ${JSON.stringify((this.config.featureFlags || '').split(',').map(flag => flag.trim()))},
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
                env: '${this.formatEnvForConfig(env, feature)}',
                formId: '${formId}',
                dynamicHeight: ${dynamicHeight},
                autoScroll: true,
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
});