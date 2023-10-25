/* eslint no-console: ["error", { allow: ["info", "warn", "error"] }] */
/**
 * NOTE: This script is compiled into ES5 syntax to ensure compatibility with older
 * browsers such as IE9+, see https://www.w3schools.com/js/js_versions.asp and
 * https://www.w3schools.com/js/js_es5.asp
 */

// FEATURES
const APP_FEATURES = ['persistent_keyboard'];
const FORM_LOADER_ONLY_FEATURES = ['canary'];

// HEIGHT
const MINIMUM_HEIGHT = 450;
const MAXIMUM_HEIGHT = 950;
const DEFAULT_HEIGHT = 575;

// INPUT PARAMETERS
const DEPRECATED_PARAMETER_MAP = {
  formIdentifier: 'formId',
  betaDynamicHeight: 'dynamicHeight',
  betaAutoScroll: 'autoScroll',
  betaFontOverride: 'fontOverride',
};

/**
 * Polyfill support for old browser String startsWith method such as ios13/ios14
 * required by https://github.com/google/closure-compiler/wiki/Supported-features#:~:text=String.prototype.startsWith
 */
if (!String.prototype.startsWith) {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(String.prototype, 'startsWith', {
    value(search, rawPos) {
      const pos = rawPos && rawPos >= 0 ? rawPos : 0;
      return this.substring(pos, pos + search.length) === search;
    },
  });
}

/**
 * Polyfill support for Array.prototype.includes()
 * required by https://github.com/google/closure-compiler/wiki/Supported-features#:~:text=Array.prototype.includes
 */
if (!Array.prototype.includes) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.includes = (search, start = 0) => {
    if (search instanceof RegExp) {
      throw TypeError('first argument must not be a RegExp');
    }
    return this.indexOf(search, start) !== -1;
  };
}

// formWidgetInfoObject functions: These must be bound to the formWidgetInfoObject in order to work correctly.

/**
 * This predicate function instructs the app to navigate back a page if the form is not already on the first page.
 * It returns false if no argument or any invalid argument (i.e. anything but the string 'back') got passed in.
 * It also returns false if the form is on page 1 at the point of invocation.
 * It returns true if the form is on pages 2 and beyond (pre-submission) and will attempt to perform back-navigation by sending an instruction to the app to do so.
 * The assumption is that only a single embed (specifically, a single snippet) can call this function at a time.
 */
function navigatePage(direction) {
  if (typeof direction !== 'string' || direction !== 'back') {
    return false;
  }
  if (
    !window.__private__?.paging ||
    !window.__private__.paging[this.iFrameId]?.currentPage ||
    window.__private__.paging[this.iFrameId]?.currentPage === 1 ||
    window.__private__.paging[this.iFrameId].formSubmitted === true
  ) {
    return false;
  }
  const iFrameElement = document.getElementById(this.iFrameId);
  iFrameElement?.contentWindow?.postMessage('navigation:back', '*');
  return true;
}

function sendSessionDataToMvfFormWidget(externalSessionData) {
  if (this.mvfFormWidgetLoaded) {
    if (
      !externalSessionData ||
      typeof externalSessionData !== 'object' ||
      Array.isArray(externalSessionData)
    ) {
      // Invalid input data - Wrong data type
      console.info(
        `MVF Form Loader Error - Invalid or missing input argument\n${externalSessionData}\n. Please pass in a JS object to the 'formWidgetInfoObject.sendSessionDataToMvfFormWidget()' function call or contact your MVF support team, alternatively.`
      );
      this.loadingErrors.push(
        `MVF Form Loader Error - Invalid or missing input argument\n${externalSessionData}\n. Please pass in a JS object to the 'formWidgetInfoObject.sendSessionDataToMvfFormWidget()' function call or contact your MVF support team, alternatively.`
      );
    } else if (Object.keys(externalSessionData).length === 0) {
      // Invalid input data - No key-value pairs
      console.info(
        `MVF Form Loader Error - Invalid input argument\n${JSON.stringify(
          externalSessionData
        )}\n. Please pass in a JS object with at least one key-value pair data item to the 'formWidgetInfoObject.sendSessionDataToMvfFormWidget()' function call or contact your MVF support team, alternatively.`
      );
      this.loadingErrors.push(
        `MVF Form Loader Error - Invalid input argument\n${externalSessionData}\n. Please pass in a JS object with at least one key-value pair data item to the 'formWidgetInfoObject.sendSessionDataToMvfFormWidget()' function call or contact your MVF support team, alternatively.`
      );
    } else {
      // Valid input data
      // Send the dynamically passed in externalSessionData down to Chameleon
      const formIframe = document.getElementById(this.iFrameId);
      formIframe.contentWindow.postMessage(
        `externalSessionData:${JSON.stringify(externalSessionData)}`,
        '*'
      );
    }
  } else if (
    this.__private__.commandBuffer &&
    Array.isArray(this.__private__.commandBuffer)
  ) {
    this.__private__.commandBuffer.push({
      function: this.sendSessionDataToMvfFormWidget,
      arguments: [externalSessionData],
    });
  } else {
    this.__private__.commandBuffer = [
      {
        function: this.sendSessionDataToMvfFormWidget,
        arguments: [externalSessionData],
      },
    ];
  }
}

// Other functions

function isFeatureEnabled(feature, testSettings) {
  if (
    !testSettings ||
    !testSettings.features ||
    testSettings.features.length === 0
  ) {
    return false;
  }
  return testSettings.features.includes(feature);
}

/**
 * inferDomainFromScriptSourceUrl
 * This function obtains its own script source URL in order to examine which
 * domain it contains ('eu' or 'ca'). If the URL is inconclusive or
 * inaccessible, the default return value is 'eu'.
 */
function inferDomainFromScriptSourceUrl() {
  const allScripts = document.getElementsByTagName('script');
  let domainFromSourceUrl = 'eu'; // default
  for (let i = 0; i < allScripts.length; i += 1) {
    if (
      allScripts[i].src &&
      /formLoader\.min\.js/.exec(allScripts[i].src) &&
      /mvfglobal\.com/.exec(allScripts[i].src) &&
      /-ca\./.exec(allScripts[i].src)
    ) {
      domainFromSourceUrl = 'ca';
    }
  }
  return domainFromSourceUrl;
}

/**
 * sanitiseEnvironmentAndDomain
 * Normaliser function which returns the passed in env if it is a valid 'staging variant' (see circle ci config for options), or defaults to staging.
 * If the env does not contain staging, the default of 'prod' takes place, which is to examine the domain and return either 'eu' or 'ca'.
 * If no domain is provided, the default is 'eu'.
 * @param {string} env - The provided environment string (defaults to prod)
 * @param {string} domain - The provided domain string (defaults to the domain
 *                          that is present in the script source URL)
 */
function sanitiseEnvironmentAndDomain(env, domain) {
  // STAGING
  if (env && env.indexOf('staging') > -1) {
    const isKnownStagingEnv =
      /a[1-3]\.staging/.exec(env) || /[a-g]1\.staging/.exec(env);

    if (isKnownStagingEnv) {
      return env;
    }
    return 'staging'; // if staging, but unknown variant
  }

  // PROD
  if (domain === 'ca' || domain === 'eu') {
    return domain; // default prod domain
  }

  return inferDomainFromScriptSourceUrl(); // default of 'eu'
}

function getHost(inputParameters, testSettings) {
  if (inputParameters.env === 'dev') {
    return 'http://chameleon.localhost:2000';
  }

  const envAndDomain = sanitiseEnvironmentAndDomain(
    inputParameters.env,
    inputParameters.domain
  );

  if (isFeatureEnabled('canary', testSettings)) {
    return `https://chameleon-frontend-canary-${envAndDomain}.ecs.prd9.eu-west-1.mvfglobal.net`;
  }

  return `https://chameleon-frontend-${envAndDomain}.mvfglobal.com`;
}

/**
 * Main function / ENTRY POINT - runFormWidgetLoader
 * To ensure browser support in IE, const, let, template strings and other modern
 * features of ES6+ are not used in this script.
 * @param {object} partnerSiteConfig - The provided argument object of this script
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function runFormWidgetLoader(partnerSiteConfig) {
  const DEFAULT_FEATURE_FLAG_PATH = 'default';

  /**
   * sanitiseThemeName
   * Normaliser function which returns the passed in value if it is among the
   * valid theme names. If it is not, the theme name "default" gets returned.
   * @param {string} themeName - The provided themeName string
   */
  function sanitiseThemeName(themeName) {
    if (typeof themeName !== 'string') {
      return 'chameleon';
    }
    const themeNamesMap = {
      chameleon: 'chameleon',
      rhubarb: 'rhubarb',
      indigo: 'indigo',
      custom: 'custom',
      default: 'chameleon',
      techco: 'rhubarb',
      startups: 'indigo',
      base: 'custom',
      atlantic: 'atlantic',
      gowizard: 'gowizard',
    };
    const mappedThemeName = themeNamesMap[themeName.toLowerCase()];
    // TODO: After MVP: Replace this hardcoded map variable with an API integration
    return mappedThemeName !== undefined ? mappedThemeName : 'chameleon';
  }

  /**
   * getUpdatedPartnerSiteConfigFields
   * Updates deprecated field names in the partnerSiteConfig object for backward compatibility.
   * Copies values from deprecated fields to their preferred counterparts.
   * @param {Object} inputParameters - The configuration object for the partner site.
   * @returns {void}
   */
  function getUpdatedPartnerSiteConfigFields(inputParameters) {
    const updatedConfig = { ...inputParameters };

    Object.keys(DEPRECATED_PARAMETER_MAP).forEach((deprecatedFieldName) => {
      if (
        Object.prototype.hasOwnProperty.call(
          inputParameters,
          deprecatedFieldName
        )
      ) {
        const newFieldName = DEPRECATED_PARAMETER_MAP[deprecatedFieldName];
        console.warn(
          `WARNING: The field name '${deprecatedFieldName}' is now '${newFieldName}'. Your form should still work but please update this value.`
        );
        updatedConfig[newFieldName] = inputParameters[deprecatedFieldName];
        // NOTE: In the logic of the validateInputArgument() function, any bad input data that users have assigned to a deprecated field name
        //       will get flagged as bad input data to the new field. Be prepared to explain this when facing a support issue.
      }
    });

    return updatedConfig;
  }

  function isIOS() {
    return (
      [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod',
      ].indexOf(navigator.platform) !== -1 ||
      // iPad on iOS 13 detection
      (navigator.userAgent.indexOf('Mac') !== -1 && 'ontouchend' in document)
    );
  }

  function isMacOS() {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  }

  /**
   * This function produces a unique HTML ID string by combining two nearly unique
   * numbers together - context: partners want to have the ability to embed
   * multiple iframes of Chameleon on to the web page by invoking this formLoader
   * script multiple times from many snippets (which may or may not be a
   * parallelised operation).
   */
  function produceUniqueIdString() {
    const uniquifierSuffix = `${Date.now()}-${Math.random()}`.replace('.', '');
    // Math.random() creates a floating-point, pseudo-random number between 0 (inclusive) and 1 (exclusive) The chance of it producing the same number across multiple invocations is slim but not impossible
    // Date.now() returns the number of milliseconds elapsed since UNIX EPOCH (January 1, 1970). If two invocations of this script have been parallelised by the partner site, this could return an identical number
    return `mvfFormWidget-${uniquifierSuffix}`.slice(0, 40);
  }

  function getUniqueId() {
    let uniqueId = produceUniqueIdString();
    while (document.querySelector(`#${uniqueId}`)) {
      uniqueId = produceUniqueIdString();
    }
    return uniqueId;
  }

  function getReferrer() {
    // For redirected optimizely variants document.referrer may end up recording the non variant url instead of the
    // referrer. Therefore we should use optimizely tooling to access the original parent. See
    // https://support.optimizely.com/hc/en-us/articles/4410283531021-Redirect-experiments-Test-two-URLs-in-Optimizely#h_01H8YWYSFGYX49BHA0A32CFWJS
    const preOptimizelyRedirectReferrer = window.optimizelyEdge?.get ? window.optimizelyEdge
      ?.get('state')
      ?.getRedirectInfo()?.referrer : undefined;

    return preOptimizelyRedirectReferrer || document.referrer;
  }

  function getCookieValue(name) {
    const match = window.document.cookie.match(
      new RegExp(`(^| )${name}=([^;]+)`)
    );
    if (match) return match[2];
  }

  function sendOneTrustCookieConsentData(formIframe) {
    const OneTrustConsentCookies = [
      'OptanonConsent',
      'OptanonAlertBoxClosed',
      'usprivacy',
      'euconsent-v2',
      'eupubconsent-v2',
    ];
    const consentCookies = {};

    OneTrustConsentCookies.forEach((cookieName) => {
      const cookieValue = getCookieValue(cookieName);
      if (cookieValue) {
        consentCookies[cookieName] = cookieValue;
      }
    });

    if (Object.values(consentCookies).length > 0) {
      formIframe.contentWindow.postMessage(
        `setCookies:${JSON.stringify(consentCookies)}`,
        '*'
      );
    }
  }

  function sendOneTrustLocaleData(formIframe) {
    if (window.OneTrust) {
      const country =
        window.OneTrust.getGeolocationData()?.country?.toUpperCase();
      const state = window.OneTrust.getGeolocationData()?.state?.toUpperCase();

      formIframe.contentWindow.postMessage(
        `oneTrustLocale:${JSON.stringify({ country, state })}`,
        '*'
      );
    }
  }

  /**
   * getAppFeatures
   * This function will return only the features which apply changes to the app itself
   * excluding any formLoader only or unsupported features.
   */
  function getAppFeatures(testSettings, areTestSettingsValid) {
    if (
      !areTestSettingsValid ||
      !testSettings ||
      !testSettings.features ||
      testSettings.features.length === 0
    ) {
      return [];
    }

    const appFeatures = testSettings.features.filter((feature) => {
      if (APP_FEATURES.includes(feature)) {
        return true;
      }
      if (!FORM_LOADER_ONLY_FEATURES.includes(feature)) {
        console.warn(
          `Feature ${feature} is not supported. Please contact your MVF support team if you cannot resolve this issue.`
        );
      }
      return false;
    });

    return appFeatures;
  }

  /**
   * getFeatureFlagPath
   * This function will return a string of all the features marked as active
   * in test settings. The features are joined by periods in alphabetical order.
   */
  function getFeatureFlagPath(features) {
    if (!features || features.length === 0) {
      return DEFAULT_FEATURE_FLAG_PATH;
    }

    const featuresCopy = features.map((x) => {
      return x;
    });
    featuresCopy.sort();

    return featuresCopy.join('.');
  }

  function produceUuidv4() {
    const cryptoArray = new Uint8Array(16);
    crypto.getRandomValues(cryptoArray);

    const hexDigits = '0123456789abcdef';
    let uuid = '';

    for (let i = 0; i < 16; i += 1) {
      if (i === 4 || i === 6 || i === 8 || i === 10) {
        uuid += '-';
      }
      const byteValue = cryptoArray[i];
      uuid += hexDigits[Math.floor(byteValue / 16)] + hexDigits[byteValue % 16];
    }

    return uuid;
  }

  function getIframeErrorSourceUrl(inputParameters) {
    if (inputParameters.env === 'dev') {
      return 'http://chameleon.localhost:2000/formLoaderError';
    }

    const envAndDomain = sanitiseEnvironmentAndDomain(
      inputParameters.env,
      inputParameters.domain
    );

    return `https://chameleon-frontend-${envAndDomain}.mvfglobal.com/formLoaderError`;
  }

  /**
   * Display an error page with minimal dependencies on the partner site config
   * We cannot trust the partnerSiteConfig to be valid, so ensure fallbacks exist
   */
  function displayErrorPage(inputParameters, message) {
    const uniqueId = getUniqueId();
    const isLogRocketSessionRecordingInUse =
      window.LogRocket && !!document.getElementById('mvf-chameleon-logrocket');
    const originSetting =
      isLogRocketSessionRecordingInUse === true ? 'allow-same-origin ' : '';

    const initialIframeAttributes = {
      id: uniqueId,
      width: '100%',
      style: `overflow: hidden; border: 0; transition: 110ms ease height; min-width: 300px; height: 250px; max-width: 800px;`,
      loading: 'lazy',
      sandbox: `${originSetting}allow-forms allow-modals allow-popups allow-scripts allow-top-navigation allow-presentation`,
      title: 'MVF GLOBAL WEBFORM EMBED',
    };

    const iFrameErrorSourceUrl = getIframeErrorSourceUrl(inputParameters);
    const formIframe = document.createElement('iframe');

    let parentContainerOfIframeWidget = document.createElement('div');
    if (inputParameters.containerId) {
      const container = document.getElementById(inputParameters.containerId);

      if (container) {
        parentContainerOfIframeWidget = container;
      }
    }

    const currentSnippetScriptElement = document.currentScript; // Not supported on IE (a small price to pay)
    const parentNodeOfSnippetScript = currentSnippetScriptElement.parentNode;
    parentNodeOfSnippetScript.insertBefore(
      parentContainerOfIframeWidget,
      currentSnippetScriptElement
    );

    const supportId = produceUuidv4();
    const queryString = `?supportId=${supportId}&message=${encodeURIComponent(
      message
    )}`;

    formIframe.src = iFrameErrorSourceUrl + queryString;
    parentContainerOfIframeWidget.appendChild(formIframe);

    Object.keys(initialIframeAttributes).forEach((attribute) => {
      const value = initialIframeAttributes[attribute];
      formIframe.setAttribute(attribute, value);
    });
  }

  /**
   * addVisibilityWatcher
   * Calling this function will create a watcher which will trigger the widgetVisible event the first time that the iframe (75% of it) enters a users viewport.
   */
  function addVisibilityWatcher(eventCallback, widgetLabel, container) {
    const eventInfo = { widgetLabel, iFrameId: container.id };
    if (window.IntersectionObserver) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting === true) {
            if (window.chameleon.shouldLogEventsToConsole) {
              console.info('MVF EMBED EVENT INFO');
              console.info('MVF EMBED EVENT Type: widgetVisible');
              console.info(
                'MVF EMBED EVENT DETAILS: widgetLabel: ',
                widgetLabel
              );
              console.info(
                'MVF EMBED IFRAMEID OF EVENT ORIGIN: ',
                container.id
              );
            }

            eventCallback(eventInfo);
            observer.unobserve(container);
          }
        },
        { threshold: [0.75] } // if 75% of the widget is visible in the viewport
      );

      observer.observe(container);
    } else {
      // Polyfill for some older browsers which do not have IntersectionObserver
      const threshold = 0.75 * container.offsetHeight;
      const onScrollCallback = () => {
        const position = container.getBoundingClientRect();
        if (
          position.top < window.innerHeight - threshold &&
          position.bottom >= threshold
        ) {
          eventCallback(eventInfo);
          window.removeEventListener('scroll', onScrollCallback);
        }
      };
      window.addEventListener('scroll', onScrollCallback);
    }
  }

  function boundedHeight(height) {
    return Math.min(Math.max(height, MINIMUM_HEIGHT), MAXIMUM_HEIGHT);
  }

  /**
   * validateTestSettings
   * Predicate function which returns true if all validations pass and returns
   * false along with error log messages being printed onto the console if any
   * validation fails
   * @param {object} testSettings - AB Test settings
   */
  function validateTestSettings(testSettings) {
    const isTestSettingsObjectPresent =
      typeof testSettings === 'object' && Array.isArray(testSettings);
    if (!isTestSettingsObjectPresent) {
      // Since test settings are optional this guard prevents further validations if none were provided
      return true;
    }

    function isString(x) {
      return typeof x === 'string';
    }

    function isNumeric(x) {
      return typeof x === 'number' || (isString(x) && /^-?\d+$/.test(x));
    }

    function isArrayOfStrings(array) {
      return Array.isArray(array) && array.every(isString);
    }

    const testSettingsValidationDetails = {
      formId: {
        validationFunction: isNumeric,
        errorMessage: 'formId should be a number',
      },
      features: {
        validationFunction: isArrayOfStrings,
        errorMessage: 'features should be an array of strings',
      },
    };

    const errors = [];
    const testSettingKeys = Object.keys(testSettings);
    testSettingKeys.forEach((testSettingKey) => {
      if (
        Object.prototype.hasOwnProperty.call(
          testSettingsValidationDetails,
          testSettingKey
        )
      ) {
        const validationDetails = testSettingsValidationDetails[testSettingKey];
        if (
          !validationDetails.validationFunction(testSettings[testSettingKey])
        ) {
          errors.push(
            `Invalid data type for the value of nested key-value pair: ${validationDetails.errorMessage}`
          );
        }
      } else {
        errors.push(
          `Invalid key name for the key-value pair: ${testSettingKey}' => '${testSettings[testSettingKey]}`
        );
      }
    });
    if (errors.length !== 0) {
      console.info(
        `MVF Test Setting Error(s) below:\n${errors.join(
          '\n'
        )}\n\nPlease contact your MVF support team if you cannot resolve these via the provided suggestions.`
      );
      return false;
    }
    return true;
  }

  /**
   * getTestFormId
   * This function overrides the form id provided in input arguments with an A/B
   * test version if it exists.
   */
  function getTestFormId(formId, testSettings) {
    if (testSettings.formId) {
      return testSettings.formId;
    }
    return formId;
  }

  /**
   * getIframeSourceUrl
   * Produces a Url which points to the correct form with the appropriate features and theme requested.
   */
  function getIframeSourceUrl(
    inputParameters,
    testSettings,
    themeName,
    iFrameId
  ) {
    // In order to AB test the performance of forms, test settings can be added to the window
    // in the form of an object via an Optimizely script or equivalent.
    // If the test settings are in the correct format, those settings will be overwritten in the displayed form.
    // If any settings are incorrect then the form will be based solely on inputValues.
    let formId;

    const isValidTestSettings = validateTestSettings(testSettings);

    const appFeatures = getAppFeatures(testSettings, isValidTestSettings);

    const featureFlagPath = getFeatureFlagPath(appFeatures);

    if (!!testSettings && isValidTestSettings) {
      formId = getTestFormId(inputParameters.formId, testSettings);
    } else {
      formId = inputParameters.formId;
    }

    return `${getHost(
      inputParameters,
      testSettings
    )}/forms/${formId}/${featureFlagPath}/${themeName}#iFrameId=${iFrameId}`;
  }

  /**
   * This function extracts the primary and secondary colours of the progress bar from the
   * settings for every theme. They can be inferred in part from theme-specific settings
   * in the mvf-external-components repo code for each theme and need to be in part
   * calculated via Material UI's helper functions.
   */
  function extractColourFromTheme(inputParameters) {
    // NOTE: Any changes to the colour values in the themes (defined in the External components repo) will need
    //       to be reapplied here and are not inferred programmatically. This keeps the loading bar fast to render.
    //       Please keep the rgb values or hex codes in here aligned to the value set specifically in the `primary.main`
    //       object of the various palettes, in here:
    //       https://bitbucket.org/mvfglobal/mvf-external-components/src/master/src/Themes/chameleonTheme.ts &
    //       https://bitbucket.org/mvfglobal/mvf-external-components/src/master/src/Themes/indigoTheme.ts &
    //       https://bitbucket.org/mvfglobal/mvf-external-components/src/master/src/Themes/rhubarbTheme.ts &
    //       https://bitbucket.org/mvfglobal/mvf-external-components/src/master/src/Themes/atlanticTheme.ts &
    //       https://bitbucket.org/mvfglobal/mvf-external-components/src/master/src/Themes/gowizardTheme.ts &

    let customThemePrimaryColour = 'rgb(134, 134, 134)'; // Depends on the palette overrides input
    if (
      inputParameters.paletteOverrides &&
      inputParameters.paletteOverrides.progressBarFilledColor
    ) {
      customThemePrimaryColour =
        inputParameters.paletteOverrides.progressBarFilledColor;
    } else if (
      inputParameters.paletteOverrides &&
      inputParameters.paletteOverrides.answerSelectedColor
    ) {
      customThemePrimaryColour =
        inputParameters.paletteOverrides.answerSelectedColor;
    }

    const chameleonThemePrimaryColour = 'rgb(26, 155, 219)'; // Depends on theme colour value in the External components repo
    const indigoThemePrimaryColour = 'rgb(0, 181, 155)'; // Depends on theme colour value in the External components repo
    const rhubarbThemePrimaryColour = 'rgb(30, 188, 216)'; // Depends on theme colour value in the External components repo
    const atlanticThemePrimaryColour = 'rgb(18, 189, 156)'; // Depends on theme colour value in the External components repo
    const gowizardThemePrimaryColour = 'rgb(85, 191, 229)'; // Depends on theme colour value in the External components repo

    const secondaryColour = 'rgb(247,247, 247)';

    const themeNameBarColoursMap = {
      custom: {
        primaryColour: customThemePrimaryColour,
        secondaryColour,
      }, // ExpertMarket theme
      chameleon: {
        primaryColour: chameleonThemePrimaryColour,
        secondaryColour,
      },
      indigo: {
        primaryColour: indigoThemePrimaryColour,
        secondaryColour,
      },
      rhubarb: {
        primaryColour: rhubarbThemePrimaryColour,
        secondaryColour,
      },
      atlantic: {
        primaryColour: atlanticThemePrimaryColour,
        secondaryColour,
      },
      gowizard: {
        primaryColour: gowizardThemePrimaryColour,
        secondaryColour,
      },
    };

    // TODO: Replace this hardcoded map variable with an API integration
    return themeNameBarColoursMap[sanitiseThemeName(inputParameters.themeName)];
  }

  /**
   * This function uses CSS and basic HTML elements to create a loading bar
   * through CSS animations. This is a preferred approach to loading a premade
   * remote JS/React/Material UI component due to significant latency savings.
   * It is much faster and more light weight to render CSS.
   */
  function createAnimatedLoadingBar(formWidget, colours, inputParameters) {
    const formWidgetWidth = formWidget.clientWidth;
    const formWidgetHeight = formWidget.clientHeight;
    const loadingBar = document.createElement('div');
    const slider = document.createElement('div');
    const line = document.createElement('div');
    const increasingSubline = document.createElement('div');
    const decreasingSubline = document.createElement('div');
    const themeName = sanitiseThemeName(inputParameters.themeName);
    let borderStyle;
    const dimensions = `width: ${formWidgetWidth}px; height: ${formWidgetHeight}px`;
    if (themeName !== 'gowizard') {
      if (inputParameters.containerId) {
        borderStyle =
          inputParameters.borderEnabled ||
          inputParameters.borderEnabled === undefined
            ? 'border-radius: 4px; border-style: none;'
            : 'border-radius: inherit; border-style: none;';
      } else {
        borderStyle =
          inputParameters.borderEnabled ||
          inputParameters.borderEnabled === undefined
            ? 'border-radius: 4px; border-style: none;'
            : 'border: none;';
      }
    } else {
      borderStyle =
        inputParameters.borderEnabled ||
        inputParameters.borderEnabled === undefined
          ? 'border-radius: 13px; border-style: none;'
          : 'border-radius: inherit; border-style: none;';
    }

    loadingBar.setAttribute(
      'style',
      `${borderStyle}overflow: hidden; position: absolute; ${dimensions}`
    );

    // NOTE: In order to achieve this hydration animation, nesting of CSS classes is needed
    //       But in the case of multiple embeds, each widget and their loadingBars need to be
    //       uniquely identified. Therefore, we'll create unique class names.
    const uniquifierSuffix = `${Date.now()}-${Math.random()}`.replace('.', '');
    const sliderClass = `mvf-loading-slider-${uniquifierSuffix}`;
    const lineClass = `mvf-loading-line-${uniquifierSuffix}`;
    const sublineClass = `mvf-loading-subline-${uniquifierSuffix}`;
    const incClass = 'mvf-loading-inc-';
    const decClass = 'mvf-loading-dec-';
    slider.setAttribute('class', sliderClass);
    line.setAttribute('class', lineClass);
    increasingSubline.setAttribute('class', `${sublineClass} ${incClass}`);
    decreasingSubline.setAttribute('class', `${sublineClass} ${decClass}`);
    const cssAnimation = document.createElement('style');
    cssAnimation.setAttribute('type', 'text/css');
    const loaderHeight = 25;

    const rules = document.createTextNode(
      `.${sliderClass} {\n` +
        `box-sizing: border-box; position: relative; width:${formWidgetWidth}px; height:${loaderHeight}px; overflow-x: hidden\n}\n` +
        `.${lineClass} {\nbox-sizing: border-box; position: absolute; background:${colours.secondaryColour};` +
        `width:100%; height:${loaderHeight}px;\n}\n.${sublineClass} {\nbox-sizing: border-box; position:absolute; background:${colours.primaryColour};height:${loaderHeight}px;\n}\n.${incClass} {\nanimation: increase 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;` +
        `\n}\n.${decClass} {animation: decrease 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;\n}@keyframes increase {\n` +
        ` from { left: -5%; width: 5%; }\n to { left: 130%; width: 100%; }\n}\n` +
        `@keyframes decrease {\n from { left: -80%; width: 80%; }\nto { left: 110%; width: 10%;}\n}`
    );
    cssAnimation.appendChild(rules);
    document.getElementsByTagName('head')[0].appendChild(cssAnimation);
    slider.appendChild(line);
    slider.appendChild(increasingSubline);
    slider.appendChild(decreasingSubline);
    loadingBar.appendChild(slider);

    return loadingBar;
  }

  const formWidgetInfoObject = {};
  // The overarching info object
  // hides implementation details about how error messages from the formWidget
  // iFrame arrive and get processed and presents a simple
  // single informational interface to the partner site code
  formWidgetInfoObject.loadingErrors = [];

  // This command buffer will store incoming function calls that get invoked by
  // customer code prior to the widget having fully loaded. It then remembers
  // those command invocation attempts and replays them in order as soon as the
  // widget is ready
  formWidgetInfoObject.__private__ = {
    commandBuffer: [],
  };

  // These paging variables will ensure that the repositioning logic encapsulated within
  // the autoScroll feature only kicks in where it doesn't worsen page speed insights
  if (!window.__private__) {
    window.__private__ = {
      paging: {},
    };
  }
  if (!window.__private__.paging) {
    window.__private__.paging = {};
  }

  if (window.__private__.autoZoom === undefined) {
    window.__private__.autoZoom = { isSetupComplete: false };
  }

  const minimumWidgetHeight = partnerSiteConfig.height
    ? `${boundedHeight(partnerSiteConfig.height)}px`
    : `${MINIMUM_HEIGHT}px`;
  const maximumWidgetHeight = '950px';
  // This minimum height value will be enforced as the hard limit when partners
  // enable the 'dynamicHeight' feature by passing a value of true into this optional
  // input config.
  // NOTE: If this value changes, also update it in Chameleon (helpers/autoScroll.js), alternatively, send it in via browserMessages and keep/access it in state.

  /**
   * Workaround for iOS auto-zoom issue (WF-4074)
   * This temporarily disables the parent page's ability to change zoom whilst any of the MVF embeds is focused on by the user
   */
  if (isIOS() && !window.__private__.autoZoom.isSetupComplete) {
    window.__private__.autoZoom.viewport = document.querySelector(
      'meta[name=viewport]'
    );
    if (window.__private__.autoZoom.viewport?.content) {
      // Clone (copy by value) the original viewport settings on the parent page as a separate reference
      // in order to be able to restore them again after user interactions with the widget are finished
      window.__private__.autoZoom.originalParentPageViewport = JSON.parse(
        JSON.stringify(window.__private__.autoZoom.viewport.content)
      );
    }
    if (
      !window.__private__.autoZoom.widgets ||
      !Array.isArray(window.__private__.autoZoom.widgets)
    ) {
      window.__private__.autoZoom.widgets = [];
    }

    window.focus();
    window.__private__.autoZoom.hasAWidgetBeenSelected = false;
    window.__private__.autoZoom.widgetInteractionListener =
      window.addEventListener('blur', () => {
        if (
          window.__private__.autoZoom.widgets.some(
            (widget) => document.activeElement === widget
          )
        ) {
          window.__private__.autoZoom.hasAWidgetBeenSelected = true;

          if (window.__private__.autoZoom.viewport?.content) {
            if (
              window.__private__.autoZoom.originalParentPageViewport?.match(
                /user-scalable *= *(no|yes|0.*|1.*)/
              )
            ) {
              window.__private__.autoZoom.viewport.setAttribute(
                'content',
                window.__private__.autoZoom.originalParentPageViewport.replaceAll(
                  /user-scalable *= *(no|yes|0[^,]*|1[^,]*)/g,
                  'user-scalable=no'
                )
              );
            } else {
              window.__private__.autoZoom.viewport.setAttribute(
                'content',
                `${window.__private__.autoZoom.originalParentPageViewport}, user-scalable=no`
              );
            }
          } else {
            window.__private__.autoZoom.metaTag =
              document.createElement('meta');
            window.__private__.autoZoom.metaTag.name = 'viewport';
            window.__private__.autoZoom.metaTag.content =
              'width=device-width, initial-scale=1, maximum-scale=10, user-scalable=no'; // Setting default values for most of these except for the necessary value of 'no' for the zoom control property 'user-scalable' and width (which has no default value according to https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag)
            document
              .getElementsByTagName('head')[0]
              .appendChild(window.__private__.autoZoom.metaTag);
          }
        }
        window.removeEventListener(
          'blur',
          window.__private__.autoZoom.widgetInteractionListener
        );
      });

    window.__private__.autoZoom.widgetBlurListener = window.addEventListener(
      'focus',
      () => {
        if (
          window.__private__.autoZoom.hasAWidgetBeenSelected === true &&
          window.__private__.autoZoom.widgets.every(
            (widget) => document.activeElement !== widget
          )
        ) {
          window.__private__.autoZoom.hasAWidgetBeenSelected = false;

          if (window.__private__.autoZoom.originalParentPageViewport) {
            // Restore the original viewport settings of the parent page now that the user's focus has shifted away from the widget
            window.__private__.autoZoom.viewport.setAttribute(
              'content',
              JSON.parse(
                JSON.stringify(
                  window.__private__.autoZoom.originalParentPageViewport
                )
              )
            );
          } else {
            // Re-enable the user's ability to zoom
            window.__private__.autoZoom.viewport.setAttribute(
              'content',
              'width=device-width, initial-scale=1, maximum-scale=10, user-scalable=yes' // Setting default values for most of these except for width (which has no default value according to https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag)
            );
          }
        }
        window.removeEventListener(
          'focus',
          window.__private__.autoZoom.widgetBlurListener
        );
      }
    );
    window.__private__.autoZoom.isSetupComplete = true;
  }

  /**
   * validateInputArgument
   * Predicate function which returns true if all validations pass and returns
   * false along with error log messages being printed onto the console if any
   * validation fails
   * @param {object} inputArgument - The provided argument object of this script
   */
  function validateInputArgument(inputArgument) {
    if (inputArgument) {
      if (typeof inputArgument === 'object' && !Array.isArray(inputArgument)) {
        const validTypesMap = {
          formId: 'string',
          themeName: 'string',
          campaignId: 'string',
          widgetLabel: 'string',
          testMode: 'boolean',
          containerId: 'string',
          height: 'number',
          maxWidth: 'number',
          isConsentStatementAboveNavigation: 'boolean',
          borderEnabled: 'boolean',
          headerEnabled: 'boolean',
          paletteOverrides: 'object',
          eventHandlers: 'object',
          env: 'string',
          domain: 'string',
          belowFold: 'boolean',
          dynamicHeight: 'boolean',
          autoScroll: 'boolean',
          fontOverride: 'string',
          useCidFromURL: 'boolean',
          // Deprecated parameters remain here for backwards compatibility - see the comment below about 'CAPTURE naming conventions'
          formIdentifier: 'string',
          betaDynamicHeight: 'boolean',
          betaAutoScroll: 'boolean',
          betaFontOverride: 'string',
        };
        const validEventNameTypesMap = {
          initialWidgetLoad: 'function',
          initialWidgetInteraction: 'function',
          widgetVisible: 'function',
          pageChanged: 'function',
          questionAnswered: 'function',
          finalSubmission: 'function', // Deprecated in favour of formSubmit but required for backwards compatibility with old snippets
          formSubmit: 'function',
          submissionStatusUpdated: 'function',
          formError: 'function',
          failedForwardPageNavigation: 'function',
        };
        const validPaletteOverrideNames = [
          'answerSelectedColor',
          'widgetBackgroundColor',
          'secondaryBackgroundColor',
          'answerBackgroundColor',
          'answerUnselectedColor',
          'continueButtonColor',
          'continueButtonHoverColor',
          'scrollIndicatorColor',
          'backButtonColor',
          'backButtonHoverColor',
          'primaryTextColor',
          'secondaryTextColor',
          'continueButtonTextColor',
          'progressBarFilledColor',
        ];
        const mandatoryInputKeysPresenceMap = {
          formId: false,
        };
        const inputKeys = Object.keys(inputArgument);
        const inputEventNames =
          inputArgument.eventHandlers &&
          typeof inputArgument.eventHandlers === 'object' &&
          !Array.isArray(inputArgument.eventHandlers)
            ? Object.keys(inputArgument.eventHandlers)
            : [];
        const paletteOverridesNames =
          inputArgument.paletteOverrides &&
          typeof inputArgument.paletteOverrides === 'object' &&
          !Array.isArray(inputArgument.paletteOverrides)
            ? Object.keys(inputArgument.paletteOverrides)
            : [];
        const errors = [];
        inputKeys.forEach((inputKey) => {
          if (Object.prototype.hasOwnProperty.call(validTypesMap, inputKey)) {
            if (
              // eslint-disable-next-line valid-typeof
              typeof inputArgument[inputKey] !== validTypesMap[inputKey] ||
              (inputKey === 'eventHandlers' &&
                Array.isArray(inputArgument[inputKey])) ||
              (inputKey === 'campaignId' &&
                !inputArgument[inputKey].match(/^[0-9a-fA-F]{13}$/))
            ) {
              const formatErrorMessageInfix =
                inputKey === 'campaignId'
                  ? "string with a format of 13 hex characters, e.g. '0123456abcdef'"
                  : validTypesMap[inputKey];
              errors.push(
                `Invalid data type for the value of key-value pair: '${inputKey}' => '${inputArgument[inputKey]}'. Please change this value to be a ${formatErrorMessageInfix}.`
              );
            }
            mandatoryInputKeysPresenceMap[inputKey] = true;
          } else {
            errors.push(
              `Invalid key name for the key-value pair: '${inputKey}' => '${
                inputArgument[inputKey]
              }'. Please check the spelling and make use of the following key names only: ${Object.keys(
                validTypesMap
              )}`
            );
          }
        });
        Object.keys(mandatoryInputKeysPresenceMap).forEach((inputKey) => {
          const present = mandatoryInputKeysPresenceMap[inputKey];
          if (present === false) {
            errors.push(
              `Missing mandatory key-value pair for the key: '${inputKey}'. Please add this into your inputConfig data for calling the 'runFormWidgetLoader()' function of this loader script.`
            );
          }
        });
        inputEventNames.forEach((inputEventName) => {
          if (
            Object.prototype.hasOwnProperty.call(
              validEventNameTypesMap,
              inputEventName
            )
          ) {
            if (
              typeof inputArgument.eventHandlers[inputEventName] !==
              // eslint-disable-next-line valid-typeof
              validEventNameTypesMap[inputEventName]
            ) {
              errors.push(
                `Invalid data type for the value of nested key-value pair: eventHandlers.${inputEventName} => '${inputArgument.eventHandlers[inputEventName]}'. Please change this value to be a function.`
              );
            }
          } else {
            errors.push(
              `Invalid key name for the nested key-value pair: eventHandlers.${inputEventName} => '${
                inputArgument.eventHandlers[inputEventName]
              }'. Please check the spelling and make use of the following event names only: ${Object.keys(
                validEventNameTypesMap
              )}.`
            );
          }
        });
        const isValidColor = (colorString) => {
          const hexWithAlphaColorMatch = /^(#)((?:[A-Fa-f0-9]{3,4}){1,2})$/;
          const rgbaColorMatch =
            /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/;
          return (
            typeof colorString === 'string' &&
            (hexWithAlphaColorMatch.exec(colorString) !== null ||
              rgbaColorMatch.exec(colorString) !== null)
          );
        };
        paletteOverridesNames.forEach((paletteOverrideName) => {
          const paletteOverrideString =
            inputArgument.paletteOverrides[paletteOverrideName];
          if (!validPaletteOverrideNames.indexOf(paletteOverrideName) >= 0) {
            if (!isValidColor(paletteOverrideString)) {
              errors.push(
                `Invalid data type for the value of nested key-value pair: eventHandlers.${paletteOverrideName} => '${paletteOverrideString}'. Please change this value to be an RGB/RGBA/Hex/Hex+A color code string.`
              );
            }
          } else {
            errors.push(
              `Invalid key name for the nested key-value pair: paletteOverrides.${paletteOverrideName} => '${
                inputArgument.paletteOverrides[paletteOverrideName]
              }'. Please check the spelling and make use of the following event names only: ${Object.keys(
                validPaletteOverrideNames
              )}.`
            );
          }
        });

        if (errors.length === 0) {
          if (inputArgument.containerId) {
            const parentContainerOfIframeWidget = document.getElementById(
              inputArgument.containerId
            );
            if (parentContainerOfIframeWidget) {
              // ALL VALIDATIONS PASSED
              return true;
            }
            const errorMessage = `MVF Form Loader Error - Container element of your provided id '${inputArgument.containerId}' for mvfFormWidget cannot be found. Please check the spelling and make sure that the HTML element is present on the page and is positioned above the loader scripts in the body section. Alternatively, please contact your MVF support team.`;
            console.info(errorMessage);
            formWidgetInfoObject.loadingErrors.push(errorMessage);
            // Don't display error page as we don't want to break the page if we don't know where to put the widget
            return false;
          }
          // ALL VALIDATIONS PASSED
          return true;
        }
        const errorMessage = `MVF Form Loader Error(s) below:\n${errors.join(
          '\n'
        )}\n\nPlease contact your MVF support team if you cannot resolve these via the provided suggestions.`;
        console.info(errorMessage);
        formWidgetInfoObject.loadingErrors.push(errorMessage);
        displayErrorPage(inputArgument, errorMessage);
        return false;
      }
      const errorMessage = `MVF Form Loader Error - Invalid input argument\n${inputArgument}\n. Please pass in a JS object to the 'runFormWidgetLoader()' function call or contact your MVF support team, alternatively.`;
      console.info(errorMessage);
      formWidgetInfoObject.loadingErrors.push(errorMessage);
      displayErrorPage(inputArgument, errorMessage);
      return false;
    }
    const errorMessage =
      "MVF Form Loader Error - Missing input argument. Please pass in a JS object to the 'runFormWidgetLoader()' function call or contact your MVF support team, alternatively.";
    console.info(errorMessage);
    formWidgetInfoObject.loadingErrors.push(errorMessage);
    displayErrorPage(inputArgument, errorMessage);
    return false;
  }

  formWidgetInfoObject.navigatePage = navigatePage.bind(formWidgetInfoObject);

  /**
   * This function auto-moves the user's viewport such that it places the widget at the top of the visible area
   * (without affecting zoom levels). Should the webpage contain a fixed header bar or multiple thereof, this
   * code will identify it/them and take its/their height as an extra offset to place the widget just under
   * all fixed headers.
   * This code triggers after any CSS transition on the parent div ends. For the purposes of this loader script,
   * that is at the end of every dynamic height adjustment, which happens on page navigation.
   */
  function repositionWidgetWithAutoScroll(
    formIframe,
    parentContainer,
    invokeAutoScrollImmediately = false
  ) {
    const parentContainerOfIframeWidget =
      parentContainer || formIframe?.parentNode;
    function autoScrollWidget(checkPaging = true) {
      if (
        checkPaging &&
        window.__private__.paging[formIframe.id].currentPage === 1 &&
        window.__private__.paging[formIframe.id].previousPage === undefined
      ) {
        // Only if we are not loading the initial page, autoScroll should kick in immediately after a dynamic resize
        return undefined;
      }

      /*
       * This function iterates up along the DOM parentNodes of the provided HTML
       * element and either reaches the top-level document node and returns
       * false or returns one of its descendants which fulfills all criteria
       * of being vertically user-scrollable, visible & taller & wider than 0.
       */
      const findFirstVerticallyScrollableNonWindowAncestorContainer = (
        element
      ) => {
        if (
          typeof element !== 'object' ||
          !element.parentNode ||
          element === document ||
          element === window
        ) {
          return false;
        }
        let ancestor = element.parentNode;
        while (
          ancestor &&
          typeof ancestor === 'object' &&
          ancestor !== document &&
          ancestor !== window
        ) {
          const ancestorStyles = window.getComputedStyle(ancestor, null);
          const ancestorIsVerticallyScrollable =
            ancestorStyles.overflowY === 'auto' ||
            ancestorStyles.overflowY === 'scroll';
          const ancestorIsTallerThanZero =
            parseInt(ancestorStyles.height, 10) > 0;
          const ancestorIsWiderThanZero =
            parseInt(ancestorStyles.width, 10) > 0;
          const ancestorIsVisible =
            ancestorStyles.display !== 'none' &&
            ancestorStyles.opacity !== '0' &&
            ancestorStyles.transparency !== '1';
          const ancestorIsTopLevelDocument = ancestor.parentNode === null;

          if (ancestorIsTopLevelDocument) {
            return false;
          }
          if (
            ancestorIsVisible &&
            ancestorIsVerticallyScrollable &&
            ancestorIsTallerThanZero &&
            ancestorIsWiderThanZero
          ) {
            // Return identified custom ancestor scroll container
            console.log("MVF Form Loader Info - Custom scroll container identified")
            return ancestor;
          }
          ancestor = ancestor.parentNode;
        }
        return false;
      };
      const scrollableAncestorContainer =
        findFirstVerticallyScrollableNonWindowAncestorContainer(formIframe) ||
        window;
      // Step 1 of 2 - Identifying the presence of all fixed elements which restrict the visible window area and calculating any additional vertical offset
      let heightOfAllFixedHeaderBars = 0;
      let heightOfAllFixedFooterBars = 0;
      const elements = document.body.getElementsByTagName('*');
      /* NOTE: This code may impede performance and the auto-scroll may seem delayed (if the web page contains many
       *       (e.g. > 100000 elements) since it iterates over each one in search for a potential fixed/sticky headerbar
       */

      for (let i = 0; i < elements.length; i += 1) {
        const computedStyleOfElement = window.getComputedStyle(
          elements[i],
          null
        );
        if (
          (computedStyleOfElement.getPropertyValue('position') === 'fixed' ||
            computedStyleOfElement.getPropertyValue('position') === 'sticky') &&
          elements[i].clientWidth === document.body.clientWidth &&
          computedStyleOfElement.getPropertyValue('display') !== 'none' &&
          computedStyleOfElement.getPropertyValue('opacity') !== '0'
        ) {
          if (
            elements[i].getBoundingClientRect().top <=
            formIframe.getBoundingClientRect().top
          ) {
            heightOfAllFixedHeaderBars += elements[i].clientHeight;
          } else {
            heightOfAllFixedFooterBars += elements[i].clientHeight;
          }
        }
      }
      const heightOfAllFixedElements =
        heightOfAllFixedHeaderBars + heightOfAllFixedFooterBars;
      const scrollContainerHeight =
        scrollableAncestorContainer === window
          ? scrollableAncestorContainer.innerHeight
          : parseInt(getComputedStyle(scrollableAncestorContainer).height, 10);
      const heightOfVisibleWindowArea =
        scrollableAncestorContainer === window
          ? scrollContainerHeight - heightOfAllFixedElements
          : scrollContainerHeight;
      const heightDifferenceBetweenWidgetAndVisibleWindowArea =
        heightOfVisibleWindowArea - formIframe.clientHeight;
      const yOffsetForVerticalCentering =
        heightDifferenceBetweenWidgetAndVisibleWindowArea > 0
          ? heightDifferenceBetweenWidgetAndVisibleWindowArea / 2
          : 0;

      // Step 2 of 2 - Shifting the position of the widget (excl. all sticky, fixed header bars)
      const currentWidgetPositionY = formIframe.getBoundingClientRect().y;

      if (scrollableAncestorContainer === window) {
        scrollableAncestorContainer.scroll({
          top:
            currentWidgetPositionY +
            scrollableAncestorContainer.pageYOffset -
            heightOfAllFixedHeaderBars -
            yOffsetForVerticalCentering,
          behavior: 'smooth',
        });
        window.__private__.isAutoScrollInitiated = false;
      } else {
        // Ignore all fixed header bars if the scroll container is not the top-level window
        // TODO: An improvement (currently de-scoped by the team) would be to only take header bars into account that lie within this custom scroll container
        scrollableAncestorContainer.scroll({
          top:
            currentWidgetPositionY +
            scrollableAncestorContainer.scrollTop -
            yOffsetForVerticalCentering,
          behavior: 'smooth',
        });
        window.__private__.isAutoScrollInitiated = false;
      }
    }
    if (invokeAutoScrollImmediately) {
      autoScrollWidget(true);
    } else {
      // Invoke auto scroll after the widget resize completes. Its transition duration is governed by
      const defaultResizeDuration = 500;
      const numericWidgetResizeDuration =
        window.__private__.variableHeightTransitionStyle.match(/\d+/);
      const delayUntilWidgetResizeIsDone = numericWidgetResizeDuration
        ? parseInt(numericWidgetResizeDuration[0], 10)
        : defaultResizeDuration;
      parentContainerOfIframeWidget.addEventListener('transitionstart', () => {
        if (!window.__private__.isAutoScrollInitiated) {
          setTimeout(autoScrollWidget, delayUntilWidgetResizeIsDone)
          window.__private__.isAutoScrollInitiated = true;
        }
      });
    }
  }

  //
  // Step 1 of 4 - Validate argument object (keys and data types of all values)
  //
  const sanitisedPartnerSiteConfigFields =
    getUpdatedPartnerSiteConfigFields(partnerSiteConfig);

  // Google accepted font mapping to font family string
  const fontMappings = {
    publicsans: {
      name: 'Public Sans',
      fontFamily: "'Public Sans', sans-serif",
    },
    inter: {
      name: 'Inter',
      fontFamily: "'Inter', sans-serif",
    },
    barlow: {
      name: 'Barlow',
      fontFamily: "'Barlow', sans-serif",
    },
    montserrat: {
      name: 'Montserrat',
      fontFamily: "'Montserrat', sans-serif",
    },
    lato: {
      name: 'Lato',
      fontFamily: "'Lato', sans-serif",
    },
    opensans: {
      name: 'Open Sans',
      fontFamily: "'Open Sans', sans-serif",
    },
    bevietnampro: {
      name: 'Be Vietnam Pro',
      fontFamily: "'Be Vietnam Pro', sans-serif",
    },
  };

  function extractParamsFromParentUrl() {
    // TODO use URLSearchParams to neaten this up if compatable/polyfill available.
    const [, paramsSuffix] = window.location.href.split('?');
    if (!paramsSuffix) {
      return undefined; // No params are present in the url
    }
    const paramStrings = paramsSuffix.split('&');
    const params = {};
    paramStrings.forEach((paramString) => {
      const paramAndValue = paramString.split('=');
      if (paramAndValue.length === 2) {
        const key = paramAndValue[0];
        const value = paramAndValue[1];
        params[key] = value;
      }
    });
    return params;
  }

  // Validate entered font name against accepted list
  function validateFontOverride(font, mappings = fontMappings) {
    const acceptedFonts = Object.keys(mappings);

    return acceptedFonts.indexOf(font.toLowerCase().replace(/\s+/g, '')) !== -1;
  }

  if (validateInputArgument(sanitisedPartnerSiteConfigFields)) {
    //
    // Step 2 of 4 - Construct the iFrame and mount it to the page
    //
    const themeName = sanitiseThemeName(
      sanitisedPartnerSiteConfigFields.themeName
    );
    let borderStyleSettings;
    if (themeName !== 'gowizard') {
      borderStyleSettings =
        sanitisedPartnerSiteConfigFields.borderEnabled ||
        sanitisedPartnerSiteConfigFields.borderEnabled === undefined
          ? 'box-shadow: rgba(45, 51, 80, 0.3) 1px 3px 10px 1px; border-radius: 6px; border-style: none;'
          : 'border-radius: inherit; border-style: none;';
    } else {
      borderStyleSettings =
        sanitisedPartnerSiteConfigFields.borderEnabled ||
        sanitisedPartnerSiteConfigFields.borderEnabled === undefined
          ? 'border-radius: 13px; border-style: none;'
          : 'border: none;';
    }

    const heightStyleSettings = sanitisedPartnerSiteConfigFields.height
      ? `height: ${boundedHeight(sanitisedPartnerSiteConfigFields.height)}px;`
      : `height: ${DEFAULT_HEIGHT}px;`;
    const maxWidthStyleSettings = sanitisedPartnerSiteConfigFields.maxWidth
      ? `max-width: ${sanitisedPartnerSiteConfigFields.maxWidth}px;`
      : 'max-width: 800px;';

    const uniqueId = getUniqueId();

    // If the eventTranslation layer is present add its functionality to the input provided event handlers.
    if (window.chameleon && window.chameleon.mvfGtmTranslationLayer) {
      sanitisedPartnerSiteConfigFields.eventHandlers =
        window.chameleon.mvfGtmTranslationLayer.addTranslationLayer({
          iFrameId: uniqueId,
          widgetLabel: sanitisedPartnerSiteConfigFields.widgetLabel,
          eventHandlers: sanitisedPartnerSiteConfigFields.eventHandlers,
        });
    }

    const resizeDuration = '500ms';
    const variableHeightTransitionStyle = `transition: ${resizeDuration} ease height;`;
    /* NOTE: In order to ensure a widget resize that is synchronised with the page transition,
     *       keep the transition duration value of variableHeightTransitionStyle in sync with the app value
     *       'transitionContainer.style.animationDuration' in the activateSynchronisedEnterAnimation function
     *       in src/Components/Transition/transition.helpers.js. Refer to its comment at the top.
     */
    const isLogRocketSessionRecordingInUse =
      window.LogRocket && !!document.getElementById('mvf-chameleon-logrocket');
    const originSetting =
      isLogRocketSessionRecordingInUse === true ? 'allow-same-origin ' : '';
    const initialIframeAttributes = {
      id: uniqueId,
      width: '100%',
      style: `overflow: hidden; ${variableHeightTransitionStyle} min-width: 300px;${borderStyleSettings}${heightStyleSettings}${maxWidthStyleSettings}`,
      loading:
        'lazy' /*  Supported by EDGE 79+ & Chrome 77+, not supported on IE,
                             Firefox or Safari (to be supported by Safari in future,
                             see Safari Technology Preview)). Workaround is in place.
                          */,
      sandbox: `${originSetting}allow-forms allow-modals allow-popups allow-scripts allow-top-navigation allow-presentation`,
      /* Used for security (supported by IE10+ and all other main browsers)
         "If absolutely required, you can add permissions back one by one (inside
         the sandbox="" attribute value) - see the sandbox reference entry
         (https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox)
         for all the available options. One important note is that you should never
         add both allow-scripts and allow-same-origin to your sandbox attribute -
         in that case, the embedded content could bypass the Same-origin policy
         that stops sites from executing scripts, and use JavaScript to turn off
         sandboxing altogether."
         Source: https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Other_embedding_technologies
      */
      title: 'MVF GLOBAL WEBFORM EMBED',
    };
    window.__private__.variableHeightTransitionStyle =
      variableHeightTransitionStyle;
    formWidgetInfoObject.iFrameId = initialIframeAttributes.id;
    if (window.__private__) {
      window.__private__.paging[initialIframeAttributes.id] = {
        currentPage: 1,
        previousPage: undefined,
      };
    }

    const iFrameSourceUrl = getIframeSourceUrl(
      sanitisedPartnerSiteConfigFields,
      window.chameleonTestSettings,
      themeName,
      formWidgetInfoObject.iFrameId
    );

    const formIframe = document.createElement('iframe');
    let parentContainerOfIframeWidget;
    if (sanitisedPartnerSiteConfigFields.containerId) {
      parentContainerOfIframeWidget = document.getElementById(
        sanitisedPartnerSiteConfigFields.containerId
      );

      if (
        parentContainerOfIframeWidget.style.height &&
        parseInt(parentContainerOfIframeWidget.style.height, 10) <
          parseInt(minimumWidgetHeight, 10)
      ) {
        parentContainerOfIframeWidget.style.height = minimumWidgetHeight;
      }

      // Set the widget resize transition style to a smooth ease animation
      parentContainerOfIframeWidget.style.transition = `${resizeDuration} ease height;`;
      if (
        parentContainerOfIframeWidget.style.transition !==
        `${resizeDuration} ease height`
      ) {
        // NOTE: The transition style of the external div may not be directly settable/overwritable
        const widgetResizeStyle =
          document.createTextNode(`#${sanitisedPartnerSiteConfigFields.containerId} {
          transition: ${resizeDuration} ease height;
        }`);
        const widgetResizeStyleSheet = document.createElement('style');
        widgetResizeStyleSheet.setAttribute('type', 'text/css');
        widgetResizeStyleSheet.appendChild(widgetResizeStyle);
        if (document.getElementsByTagName('head')[0]) {
          document
            .getElementsByTagName('head')[0]
            .appendChild(widgetResizeStyleSheet);
        }
      }
    } else {
      // Create a DOM wrapper element and mount it right above the passed in snippet script tag
      parentContainerOfIframeWidget = document.createElement('div');
      const horizontalCentering = ' margin: auto;';
      let themeBackgroundColor;
      if (themeName === 'custom') {
        themeBackgroundColor = 'transparent';
      } else if (themeName === 'gowizard') {
        themeBackgroundColor = 'rgb(255, 255, 255)';
      } else {
        themeBackgroundColor = 'rgb(253, 253, 253)';
      }

      const parentContainerBackgroundColour =
        sanitisedPartnerSiteConfigFields.paletteOverrides &&
        sanitisedPartnerSiteConfigFields.paletteOverrides.widgetBackgroundColor
          ? sanitisedPartnerSiteConfigFields.paletteOverrides
              .widgetBackgroundColor
          : themeBackgroundColor;
      const opacityAndBackgroundSettings = `opacity: 1; background: ${parentContainerBackgroundColour};`;
      let parentBorderStyleSettings;
      if (themeName !== 'gowizard') {
        parentBorderStyleSettings =
          sanitisedPartnerSiteConfigFields.borderEnabled ||
          sanitisedPartnerSiteConfigFields.borderEnabled === undefined
            ? 'border-radius: 6px; border-style: none;'
            : 'border: none;';
      } else {
        parentBorderStyleSettings =
          sanitisedPartnerSiteConfigFields.borderEnabled ||
          sanitisedPartnerSiteConfigFields.borderEnabled === undefined
            ? 'box-shadow: rgba(170, 144, 211, 0.75) 0.75rem 0.75rem 0px; border-radius: 13px; border-style: none; border: 2px solid rgb(86, 33, 137); box-sizing: content-box; margin: auto; overflow: hidden;'
            : 'border: none;';
      }
      parentContainerOfIframeWidget.setAttribute(
        'style',
        opacityAndBackgroundSettings +
          heightStyleSettings +
          maxWidthStyleSettings +
          horizontalCentering +
          parentBorderStyleSettings +
          variableHeightTransitionStyle
      );

      const currentSnippetScriptElement = document.currentScript; // Not supported on IE (a small price to pay)
      const parentNodeOfSnippetScript = currentSnippetScriptElement.parentNode;
      parentNodeOfSnippetScript.insertBefore(
        parentContainerOfIframeWidget,
        currentSnippetScriptElement
      );
    }

    if (sanitisedPartnerSiteConfigFields.dynamicHeight) {
      if (sanitisedPartnerSiteConfigFields.autoScroll) {
        repositionWidgetWithAutoScroll(
          formIframe,
          parentContainerOfIframeWidget
        );
        // NOTE: The parentContainer needs to be explicitly passed in because it still is a separate div and not yet linked as an HTML parent to formIframe
      }
    }

    const loadingBar = createAnimatedLoadingBar(
      parentContainerOfIframeWidget,
      extractColourFromTheme(sanitisedPartnerSiteConfigFields),
      sanitisedPartnerSiteConfigFields
    );
    formIframe.setAttribute('position', 'relative');
    formIframe.setAttribute('z-index', '9998');

    if (sanitisedPartnerSiteConfigFields.belowFold === false) {
      formIframe.src = iFrameSourceUrl;
    }
    // Assigning the HTML attributes as a 2nd arg of createElement is not
    // supported by IE. Hence, setAttribute() is used
    Object.keys(initialIframeAttributes).forEach((attribute) => {
      const value = initialIframeAttributes[attribute];
      formIframe.setAttribute(attribute, value);
    });

    const parentUrlParams = extractParamsFromParentUrl();
    if (!window.chameleon) {
      window.chameleon = {};
    }
    window.chameleon.shouldLogEventsToConsole =
      parentUrlParams && parentUrlParams.eventLog === 'true';
    const pageUrl = window.location.href;

    const sendInitialMessagesToChameleon = () => {
      // Send the partner page url, campaignId, widgetLabel, headerEnabled and paletteOverrides state down to Chameleon
      if (isLogRocketSessionRecordingInUse) {
        formIframe.contentWindow.postMessage(
          `isLogRocketSessionRecordingRequired:true`,
          '*'
        );
      }
      formIframe.contentWindow.postMessage(`pageUrl:${pageUrl}`, '*');
      const referrerUrl = getReferrer();
      if (referrerUrl) {
        formIframe.contentWindow.postMessage(`referrerUrl:${referrerUrl}`, '*');
      }

      if (sanitisedPartnerSiteConfigFields.campaignId) {
        formIframe.contentWindow.postMessage(
          `campaignId:${sanitisedPartnerSiteConfigFields.campaignId}`,
          '*'
        );
      }

      // Inform Chameleon about the widgetLabel
      if (
        Object.prototype.hasOwnProperty.call(
          sanitisedPartnerSiteConfigFields,
          'widgetLabel'
        )
      ) {
        formIframe.contentWindow.postMessage(
          `widgetLabel:${sanitisedPartnerSiteConfigFields.widgetLabel}`,
          '*'
        );
      }
      // Inform Chameleon about the iFrameId of the widget (essential to help correlate future events to the right iFrame)
      if (formWidgetInfoObject.iFrameId) {
        formIframe.contentWindow.postMessage(
          `iFrameId:${formWidgetInfoObject.iFrameId}`,
          '*'
        );
      }
      if (
        Object.prototype.hasOwnProperty.call(
          sanitisedPartnerSiteConfigFields,
          'useCidFromURL'
        )
      ) {
        formIframe.contentWindow.postMessage(
          `useCidFromURL:${sanitisedPartnerSiteConfigFields.useCidFromURL}`,
          '*'
        );
      }
      if (sanitisedPartnerSiteConfigFields.dynamicHeight) {
        const defaultResizeDuration = 500;
        const numericWidgetResizeDuration =
          window.__private__.variableHeightTransitionStyle.match(/\d+/); // get digits from animation
        const widgetResizeDuration = numericWidgetResizeDuration
          ? parseInt(numericWidgetResizeDuration[0], 10)
          : defaultResizeDuration;

        formIframe.contentWindow.postMessage(
          `widgetResizeDuration:${widgetResizeDuration}`,
          '*'
        );
        formIframe.contentWindow.postMessage(
          `dynamicHeight:${sanitisedPartnerSiteConfigFields.dynamicHeight}`,
          '*'
        );
        formIframe.contentWindow.postMessage(
          `minimumWidgetHeight:${parseInt(minimumWidgetHeight, 10)}`,
          '*'
        );
        formIframe.contentWindow.postMessage(
          `maximumWidgetHeight:${parseInt(maximumWidgetHeight, 10)}`,
          '*'
        );
        if (window.ResizeObserver) {
          // Set up a dimensions listener on the iframe to notify the React app of any changes in width
          new ResizeObserver(() => {
            formIframe.contentWindow.postMessage(
              'recalculateRequiredWidgetHeightDueToWidthChange',
              '*'
            );
          }).observe(formIframe); // listens efficiently to widget dimension changes (width is what we're interested in)
        } else {
          // This workaround (for unsupported browsers) is not exactly a polyfill but it successfully detects
          // widget width changes whenever they are caused by mobile screen orientation changes or by window resizing
          // Expect this code to kick in for browsers excluded here: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver#browser_compatibility
          let formIframeWidth = formIframe.clientWidth;
          window.addEventListener('orientationchange', () => {
            if (formIframe.clientWidth !== formIframeWidth) {
              formIframeWidth = formIframe.clientWidth;
              formIframe.contentWindow.postMessage(
                'recalculateRequiredWidgetHeightDueToWidthChange',
                '*'
              );
            }
          });
          window.addEventListener('resize', () => {
            if (formIframe.clientWidth !== formIframeWidth) {
              formIframeWidth = formIframe.clientWidth;
              formIframe.contentWindow.postMessage(
                'recalculateRequiredWidgetHeightDueToWidthChange',
                '*'
              );
            }
          });
        }
      }
      // Inform Chameleon about testMode
      if (
        Object.prototype.hasOwnProperty.call(
          sanitisedPartnerSiteConfigFields,
          'testMode'
        )
      ) {
        formIframe.contentWindow.postMessage(
          `testMode:${sanitisedPartnerSiteConfigFields.testMode}`,
          '*'
        );
      }
      // Inform Chameleon about whether to show or hide the header
      if (
        Object.prototype.hasOwnProperty.call(
          sanitisedPartnerSiteConfigFields,
          'headerEnabled'
        )
      ) {
        formIframe.contentWindow.postMessage(
          `headerEnabled:${sanitisedPartnerSiteConfigFields.headerEnabled}`,
          '*'
        );
      }
      // Inform Chameleon about the position of the consent statement
      if (
        Object.prototype.hasOwnProperty.call(
          sanitisedPartnerSiteConfigFields,
          'isConsentStatementAboveNavigation'
        )
      ) {
        formIframe.contentWindow.postMessage(
          `isConsentStatementAboveNavigation:${sanitisedPartnerSiteConfigFields.isConsentStatementAboveNavigation}`,
          '*'
        );
      }
      // Inform Chameleon about the optional autoScroll value of the widget
      if (
        Object.prototype.hasOwnProperty.call(
          sanitisedPartnerSiteConfigFields,
          'autoScroll'
        )
      ) {
        formIframe.contentWindow.postMessage(
          `autoScroll:${sanitisedPartnerSiteConfigFields.autoScroll}`,
          '*'
        );
      }
      // Inform Chameleon about whether to override any palette values
      if (
        Object.prototype.hasOwnProperty.call(
          sanitisedPartnerSiteConfigFields,
          'paletteOverrides'
        )
      ) {
        const paletteOverridesJSON = JSON.stringify(
          sanitisedPartnerSiteConfigFields.paletteOverrides
        );
        formIframe.contentWindow.postMessage(
          `paletteOverrides:${paletteOverridesJSON}`,
          '*'
        );
      }
      // Inform Chameleon about whether to override the default font
      if (
        Object.prototype.hasOwnProperty.call(
          sanitisedPartnerSiteConfigFields,
          'fontOverride'
        )
      ) {
        const isFontValid = validateFontOverride(
          sanitisedPartnerSiteConfigFields.fontOverride
        );
        if (isFontValid) {
          const fontObject =
            fontMappings[
              sanitisedPartnerSiteConfigFields.fontOverride
                .toLowerCase()
                .replace(/\s+/g, '')
            ];
          const fontOverrideJSON = JSON.stringify(fontObject);
          formIframe.contentWindow.postMessage(
            `fontOverride:${fontOverrideJSON}`,
            '*'
          );
        } else {
          console.info(
            'MVF Form Loader Error - invalid or unsupported font selected'
          );
        }
      }
      // Inform Chameleon not to expect further render-critical messages as part of the initial load
      formIframe.contentWindow.postMessage(
        'allInitialMessagesArrived:true',
        '*'
      );

      if (sanitisedPartnerSiteConfigFields.eventHandlers) {
        const registeredEventHandlers = Object.getOwnPropertyNames(
          sanitisedPartnerSiteConfigFields.eventHandlers
        );
        formIframe.contentWindow.postMessage(
          `registeredEventHandlers:${JSON.stringify(registeredEventHandlers)}`,
          '*'
        );
      }
    };

    formIframe.onload = () => {
      // formIframe.onload fires twice to keep the customer page's PageSpeed
      // score high (see the 'SEO' comment in the onLoadHandlerFunction).
      // As a result, a second condition needs to be checked before considering
      // the form widget 'loaded'.
      if (formIframe.src) {
        // Remove the loading bar as soon as the form widget has appeared and fully loaded
        parentContainerOfIframeWidget.removeChild(loadingBar);

        /**
         * Send input data to the app via browser message
         *
         * In the case of Apple browsers we cannot send this data until we receive a message from the application - which confirms that the app is ready.
         */
        if (!isIOS() && !isMacOS()) {
          if (sanitisedPartnerSiteConfigFields.env === 'dev') {
            setTimeout(() => {
              // In development in linux the application does not load before the messages are sent, this is not currently an issues in staging / prod
              console.info(
                'DEV ONLY: ARTIFICIAL DELAY for application to be ready to receive messages'
              );
              sendInitialMessagesToChameleon();
            }, 2000);
          } else {
            sendInitialMessagesToChameleon();
          }
        }

        if (sanitisedPartnerSiteConfigFields.eventHandlers) {
          if (sanitisedPartnerSiteConfigFields.eventHandlers.widgetVisible) {
            addVisibilityWatcher(
              sanitisedPartnerSiteConfigFields.eventHandlers.widgetVisible,
              sanitisedPartnerSiteConfigFields.widgetLabel,
              formIframe
            );
          }
        }
      }
    };

    // Insert the iFrame of the Chameleon form widget
    parentContainerOfIframeWidget.appendChild(loadingBar);
    parentContainerOfIframeWidget.appendChild(formIframe);

    if (isIOS() && Array.isArray(window?.__private__?.autoZoom?.widgets)) {
      window.__private__.autoZoom.widgets.push(formIframe);
    }

    //
    // Step 3 of 4 - Set up event handlers (including form errors)
    //

    if (
      window.partnerSiteConfigs &&
      typeof window.partnerSiteConfigs === 'object' &&
      !Array.isArray(window.partnerSiteConfigs)
    ) {
      // This formLoader script may run as part of a batch of invocations from
      // multiple snippets to load multiple iFrames onto the page. Hence, when
      // it comes to hooking up the eventListeners from any one snippet to the
      // common global window object (and its onmessage trigger handler), each
      // partnerSiteConfig that relates to an individual loader snippet needs to
      // be collated into a map object that correlates iFrameId to partnerSiteConfig
      // for the window object to be aware of and listen to in order to
      // prevent messages from any iFrame from being ignored by the window or
      // rather not getting passed through to the eventListeners of the
      // partnerSiteConfig of that specific iFrame's loader snippet
      window.partnerSiteConfigs[formWidgetInfoObject.iFrameId] =
        sanitisedPartnerSiteConfigFields;
    } else {
      window.partnerSiteConfigs = {};
      window.partnerSiteConfigs[formWidgetInfoObject.iFrameId] =
        sanitisedPartnerSiteConfigFields;
    }

    // Handle form-related events by invoking partner's pre-specified callback logic
    window.addEventListener('message', (event) => {
      if (typeof event.data.startsWith === 'function') {
        // Guard clause to prevent unrelated messages to trigger this logic (more efficient)
        if (
          event.data.startsWith('questionAnswered') ||
          event.data.startsWith('pageChanged') ||
          event.data.startsWith('finalSubmission') ||
          event.data.startsWith('formSubmit') ||
          event.data.startsWith('formError') ||
          event.data.startsWith('failedForwardPageNavigation') ||
          event.data.startsWith('resizeWidget') ||
          event.data.startsWith('invokeAutoScroll') ||
          event.data.startsWith('submissionStatusUpdated') ||
          event.data.startsWith('initialWidgetInteraction') ||
          event.data.startsWith('initialWidgetLoad') ||
          event.data.startsWith('cookiesRequested')
        ) {
          const eventInfoArray = event.data.split(/:(.+)/); // splits the string on the first occurrence of the separator ':'
          const eventType = eventInfoArray[0];
          const eventInfoObject = JSON.parse(eventInfoArray[1]);
          const iFrameIdOfEventOrigin = eventInfoObject.iFrameId;
          const isSubmissionEvent =
            event.data.startsWith('finalSubmission') ||
            event.data.startsWith('formSubmit');

          if (eventInfoObject.iFrameId !== formWidgetInfoObject.iFrameId) {
            return;
          }

          const iFrameElement = document.getElementById(iFrameIdOfEventOrigin);

          if (event.data.startsWith('cookiesRequested')) {
            // Inform Chameleon about OneTrust cookie and add handler for any cookie changes.
            sendOneTrustCookieConsentData(iFrameElement);
            if (window.OneTrust) {
              sendOneTrustLocaleData(iFrameElement);
              window.OneTrust.OnConsentChanged(() => {
                sendOneTrustCookieConsentData(iFrameElement);
                sendOneTrustLocaleData(iFrameElement);
              });
            }
            return;
          }

          if (
            event.data.startsWith('initialWidgetInteraction') &&
            typeof window.chameleon?.setupBrowserIntercept === 'function'
          ) {
            window.chameleon.setupBrowserIntercept();
          }

          if (window.chameleon.shouldLogEventsToConsole) {
            console.info('MVF EMBED EVENT INFO');
            console.info('MVF EMBED EVENT Type: ', eventType);
            console.info('MVF EMBED EVENT DETAILS: ', eventInfoObject);
            console.info(
              'MVF EMBED IFRAMEID OF EVENT ORIGIN: ',
              iFrameIdOfEventOrigin
            );
          }
          // Chameleon form-related user progress / error message listener to
          // bubble either form-related user progress or interaction errors up
          // to the partner-site by invoking their specified event response
          // logic of their passed in callback function

          const snippetSpecificConfig =
            window.partnerSiteConfigs[iFrameIdOfEventOrigin];
          // Any widget related event from any one iFrame gets communicated to
          // its original loader snippet (that has the corresponding eventHandler
          // function implemented). None of the other unrelated snippets will be
          // notified in a multi-snippet / multi-iFrame page scenario.
          if (
            snippetSpecificConfig &&
            snippetSpecificConfig.eventHandlers &&
            snippetSpecificConfig.eventHandlers[eventType] &&
            typeof snippetSpecificConfig.eventHandlers[eventType] ===
              'function' &&
            isSubmissionEvent === false
          ) {
            snippetSpecificConfig.eventHandlers[eventType](eventInfoObject);
          }

          // If it's a submission event, prioritise calling the formSubmit event handler if it exists
          // If it doesn't, call the legacy finalSubmission event handler instead
          if (
            snippetSpecificConfig &&
            snippetSpecificConfig.eventHandlers &&
            isSubmissionEvent === true
          ) {
            if (
              snippetSpecificConfig.eventHandlers.formSubmit &&
              typeof snippetSpecificConfig.eventHandlers.formSubmit ===
                'function'
            ) {
              snippetSpecificConfig.eventHandlers.formSubmit(eventInfoObject);
            } else {
              snippetSpecificConfig.eventHandlers.finalSubmission(
                eventInfoObject
              );
            }
          }

          const currentWidgetHeight = iFrameElement
            ? window.getComputedStyle(iFrameElement, null).height
            : '';
          if (
            event.data.startsWith('invokeAutoScroll') &&
            snippetSpecificConfig &&
            sanitisedPartnerSiteConfigFields.autoScroll
          ) {
            repositionWidgetWithAutoScroll(iFrameElement, undefined, true);
          }

          if (isSubmissionEvent && window.__private__?.paging) {
            window.__private__.paging[
              iFrameIdOfEventOrigin
            ].formSubmitted = true;
          }

          if (
            event.data.startsWith('pageChanged') &&
            window.__private__?.paging
          ) {
            const destinationPageMatchObject = event.data.match(
              /["|']destinationPage["|']:(\d+),/
            );
            const fromPageMatchObject = event.data.match(
              /["|']fromPage["|']:(\d+),/
            );
            if (
              destinationPageMatchObject &&
              Array.isArray(destinationPageMatchObject) &&
              typeof parseInt(destinationPageMatchObject[1], 10) === 'number'
            ) {
              window.__private__.paging[iFrameIdOfEventOrigin].currentPage =
                parseInt(destinationPageMatchObject[1], 10);
            }
            if (
              fromPageMatchObject &&
              Array.isArray(fromPageMatchObject) &&
              typeof parseInt(fromPageMatchObject[1], 10) === 'number'
            ) {
              window.__private__.paging[iFrameIdOfEventOrigin].previousPage =
                parseInt(fromPageMatchObject[1], 10);
            }
          }
          // Dynamic iframe height based on incoming requiredWidgetHeight data on every "resizeWidget" event
          if (
            iFrameIdOfEventOrigin &&
            snippetSpecificConfig.dynamicHeight &&
            event.data.startsWith('resizeWidget')
          ) {
            let newWidgetHeight = eventInfoObject.requiredWidgetHeight;

            if (
              parseInt(newWidgetHeight, 10) < parseInt(minimumWidgetHeight, 10)
            ) {
              newWidgetHeight = minimumWidgetHeight;
            }

            if (
              parseInt(newWidgetHeight, 10) > parseInt(maximumWidgetHeight, 10)
            ) {
              newWidgetHeight = maximumWidgetHeight;
            }

            if (newWidgetHeight !== currentWidgetHeight) {
              iFrameElement.style.height = newWidgetHeight;
              const parentContainer = iFrameElement.parentNode;
              parentContainer.style.height = newWidgetHeight;
            }
          }
        }

        /**
         * Chameleon will send a browserMessagesRegistered event when it's ready to receive browser messages, as we noticed issues with iOS onload event firing before Chameleon was ready, so we replay the initial messages when we receive this event to ensure Chameleon has all the required data
         */
        if (event.data.startsWith('browserMessagesRegistered')) {
          if (isIOS() || isMacOS()) {
            sendInitialMessagesToChameleon();

            // TODO not sure about this - is updateCampaignId still present
            if (formWidgetInfoObject.campaignIdOverride) {
              /**
               * If we have previously received an updateCampaignId event that was not buffered, then sendInitialMessagesToChameleon would overwrite the campaign ID to be the one in this snippet and the one in the snippet would be resent
               */
              formWidgetInfoObject.updateCampaignId(
                formWidgetInfoObject.campaignIdOverride
              );
            }
          }

          formWidgetInfoObject.mvfFormWidgetLoaded = true;
          // Incoming commands will no longer need buffering after this
          formWidgetInfoObject.__private__.commandBuffer.forEach(
            (commandAndArgs) => {
              if (commandAndArgs.function) {
                commandAndArgs.function(...commandAndArgs.arguments);
                // Executing all previously buffered commands that have come in
              }
            }
          );
          // Clear commandBuffer after all commands were executed
          formWidgetInfoObject.__private__.commandBuffer = [];
        }
      }
    });

    const onLoadHandlerFunction = () => {
      if (sanitisedPartnerSiteConfigFields.belowFold !== false) {
        formIframe.src = iFrameSourceUrl;
        /*
          Reasoning for delaying source url assignment:
          In order to improve page speed, it's a good idea to set the iframe's
          src attribute with JavaScript after the main content is done with
          loading. This makes your page usable sooner and decreases your official
          page load time (an important SEO metric.)
          Source: https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Other_embedding_technologies
          This works for all browsers and works around the native lazy loading
          incompatibility of some browsers (Safari, Firefox & IE). See here for
          implementation suggestions: https://webmasters.stackexchange.com/questions/39511/when-is-a-page-considered-loaded-by-search-engines-so-i-can-enhance-it-without-a
        */
      }
    };

    if (
      window.functionsToRunOnLoad &&
      Array.isArray(window.functionsToRunOnLoad)
    ) {
      // This formLoader script may run as part of a batch of invocations from
      // multiple snippets to load multiple iFrames onto the page. Hence, the
      // event handlers that apply to the common global window object need to be
      // collated into an array to prevent overrides that impact all other iFrames
      window.functionsToRunOnLoad.push(onLoadHandlerFunction);
    } else {
      window.functionsToRunOnLoad = [onLoadHandlerFunction];
    }

    let pollingId = setInterval(() => {
      const navData = window.performance.getEntriesByType('navigation');
      let windowLoadEventHasFired =
        navData.length > 0 && navData[0].loadEventEnd > 0;

      if (windowLoadEventHasFired === false && navData.length === 0) {
        // ios 13/14 fix for performance API inconsistencies:
        // https://stackoverflow.com/questions/61731563/performace-api-not-supported-in-safari-browser
        // https://bugs.webkit.org/show_bug.cgi?id=184363
        if (
          typeof window.performance.timing !== 'undefined' &&
          typeof window.performance.timing.loadEventEnd !== 'undefined'
        ) {
          windowLoadEventHasFired = window.performance.timing.loadEventEnd > 0;
        }
      }

      if (windowLoadEventHasFired) {
        // page is fully loaded from an SEO perspective
        clearInterval(pollingId); // Prevent this code from running more than once
        pollingId = null; // Release pollingId from the variable
        window.functionsToRunOnLoad.forEach((loadFunction) => {
          // Each function corresponds to a different iFrame
          loadFunction();
        });
      }
    }, 10);

    // Assign a handler function to the infoObject allowing external customer
    // code to send key-value pairs of session data into the formWidget
    formWidgetInfoObject.sendSessionDataToMvfFormWidget =
      sendSessionDataToMvfFormWidget.bind(formWidgetInfoObject);

    /**
     * TODO: remove the use of updateCampaignId in pinnacle, then remove the function here, to prevent errors in pinnacle.
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    formWidgetInfoObject.updateCampaignId = () => {};

    // Assign a handler function to the infoObject allowing external customer code to resubmit
    formWidgetInfoObject.resubmitMvfFormWidget = ({
      replaceAncestorSid = false,
    } = {}) => {
      const data = {
        shouldResubmit: true,
        replaceAncestorSid,
      };
      formIframe.contentWindow.postMessage(
        `resubmit:${JSON.stringify(data)}`,
        '*'
      );
    };

    //
    // Step 4 of 4 - Return iFrame infoObject
    //
    return formWidgetInfoObject;
  }
  return formWidgetInfoObject;
}
