const template = document.createElement('template');
template.innerHTML = `
<button id="button" class="cta">
    <div class="rippleLayer"></div>
        <div id="buttonLabel"></div>
        <div id="loader">
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
                <path style="fill:inherit;" d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z">
                    <animateTransform attributeName="transform" type="rotate" dur="0.75s" values="0 12 12;360 12 12" repeatCount="indefinite"/>
                </path>
            </svg>
        </div>
</button>
<style>
    * {
        box-sizing: border-box;
    }
    button {
        position: relative;
        display: block;
        padding: 0 10px;
        border-radius: var(--button-border-radius);
        border: none;
        cursor: pointer;
        font-size: 16px;
        line-height: 36px;
        font-weight: bold;
        transition:
          background-color 0.2s ease-in-out,
          opacity 0.2s ease-in-out,
          transform 0.2s ease-in-out,
          box-shadow 0.2s ease-in-out;
        overflow: hidden;
    }
    button.cta {
        background-color: var(--color-cta);
        box-shadow: var(--button-box-shadow-offset-x) var(--button-box-shadow-offset-y) var(--button-box-shadow-blur) var(--button-box-shadow-spread-radius) var(--color-cta-dark);
        color: var(--button-front-color-cta, white);
        fill: var(--button-front-color-cta, white);
        border-top: 1px solid var(--color-cta-light);
    }
    button.secondary {
        background-color: var(--color-light-grey);
        box-shadow: var(--button-box-shadow-offset-x) var(--button-box-shadow-offset-y) var(--button-box-shadow-blur) var(--button-box-shadow-spread-radius) var(--color-grey);
        color: var(--button-front-color-grey, black);
        fill: var(--button-front-color-grey, black);
        border-top: 1px solid #ffffff33;
    }
    button.primary {
        background-color: var(--color-ui);
        box-shadow: var(--button-box-shadow-offset-x) var(--button-box-shadow-offset-y) var(--button-box-shadow-blur) var(--button-box-shadow-spread-radius) var(--color-ui-dark);
        color: var(--button-front-color-ui, white);
        fill: var(--button-front-color-ui, white);
    }
    #buttonLabel {
        display: block;
        text-align: center;
        font-family: var(--font-family-heading), "sans-serif";
    }
    button:focus:not(:active) {
        /*outline: 4px solid var(--color-ui-opaque);*/
    }
    
    button.primary:hover {
        background-color: var(--color-ui-light);
    }
    
    button.cta:hover {
        background-color: var(--color-cta-light);
        background-image: linear-gradient(180deg, var(--color-cta-light) 0%, var(--color-cta-light) 10%);
    }
    button.secondary:hover {
        background-color: var(--color-grey-medium);
    }
    button.cta:active {
        transform: translate(0, 4px);
        box-shadow: 0 0 var(--button-box-shadow-blur) var(--button-box-shadow-spread-radius) var(--color-cta-dark);
    }
    button.secondary:active {
        transform: translate(0, 4px);
        box-shadow: 0 0 var(--button-box-shadow-blur) var(--button-box-shadow-spread-radius) var(--color-grey-medium);
    }
    button.primary:active {
        transform: translate(0, 4px);
        box-shadow: 0 0 var(--button-box-shadow-blur) var(--button-box-shadow-spread-radius) var(--color-ui-dark);
    }
    button:disabled {
        pointer-events: none;
        cursor: not-allowed;
    }
    button:disabled #buttonLabel {
        opacity: 0.5;
    }
    #loader {
        position: absolute;
        top: 7px;
        transform: translate(50%, 0);
        width: 24px;
        height: 24px;
        right: 50%;
        visibility: hidden;
    }
   
    .rippleLayer {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
    }
    span.ripple {
      position: absolute;
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 800ms ease-in-out;
      background-color: rgba(255, 255, 255, 0.2);
      filter: blur(6px);
    }
    
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
        filter: blur(12px);
      }
    }
    
</style>`;

export { template };
