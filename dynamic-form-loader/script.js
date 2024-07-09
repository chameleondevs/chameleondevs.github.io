const storeFormValuesInLocalStorage = () => {
    const formId = document.getElementById('formId').value;
    const env = document.getElementById('env').value;
    const themeName = document.getElementById('themeName').value;
    const featureFlags = document.getElementById('featureFlags').value;
    localStorage.setItem('formId', formId);
    localStorage.setItem('env', env);
    localStorage.setItem('themeName', themeName);
    localStorage.setItem('featureFlags', featureFlags);
}

const getValueFromLocalStorageOrQueryStringParams = (key) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(key) || localStorage.getItem(key);
}

const loadFormValuesFromLocalStorageOrQueryStringParams = () => {
    document.getElementById('formId').value = getValueFromLocalStorageOrQueryStringParams('formId');
    document.getElementById('env').value = getValueFromLocalStorageOrQueryStringParams('env');
    document.getElementById('themeName').value = getValueFromLocalStorageOrQueryStringParams('themeName');
    document.getElementById('featureFlags').value = getValueFromLocalStorageOrQueryStringParams('featureFlags');

    // if all values are present, load the form
    if (document.getElementById('formId').value && document.getElementById('env').value && document.getElementById('themeName').value) {
        loadForm();
    }
}

const loadForm = async () => {
    try {
        window.dispatchEvent(new CustomEvent('cleardatalayerlogs'));
        const container = document.getElementById('chameleonContainer')
        const formId = document.getElementById('formId').value;
        const env = document.getElementById('env').value;
        const themeName = document.getElementById('themeName').value;
        const featureFlags = document.getElementById('featureFlags').value;
        if (featureFlags) {
            const configTag = document.createElement('script');
            configTag.innerHTML = `
                window.chameleonTestSettings = {
                    features: ${JSON.stringify(featureFlags.split(',').map(flag => flag.trim()))},
                }`;
            container.appendChild(configTag);
        }
        container.innerHTML = "";
        const jsHost = getJsHost(env);

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
                isConsentStatementAboveNavigation: true,
            };
            var formWidgetInfoObject = runFormWidgetLoader(inputData);
        `;
        container.appendChild(scriptTag);
        storeFormValuesInLocalStorage();
    } catch (e) {
        console.error(e);
    }
}

const getJsHost = (env) => {
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
        case 'production':
            return 'https://chameleon-frontend-eu.mvfglobal.com';
        default:
            return 'https://chameleon-frontend-staging.mvfglobal.com';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadFormValuesFromLocalStorageOrQueryStringParams();
});
