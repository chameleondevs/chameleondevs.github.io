customElements.define('lytics-manager', class LyticsManager extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
        <zui-card collapsed="true">
            <div slot="header" class="headerslot">
                <zui-status-light status="disabled" id="statusLight"></zui-status-light>Lytics Manager
            </div>
            <div slot="content">
                <div>
                    <zui-label>Lytics UID:</zui-label>
                    <zui-copy-to-clipboard id="clipboard" value=""></zui-copy-to-clipboard>
                </div>
                <div>
                    <zui-label>Audiences:</zui-label>
                    <div id="audiences"></div>
                </div>
            </div>
            <div slot="footer">
                <div class="footerSlot">
                    <zui-button class="footerbutton" id="reloadEntity" label="Reload entity" width="100%" version="cta"></zui-button>
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
        </style>
        `;
    }

    async connectedCallback() {
       await this.addLyticsScriptToPage();
       this.populateClipboard();
       this.updateAudiences();
       this.shadowRoot.getElementById('reloadEntity').addEventListener('click', (e) => { this.reloadEntity(); });
    }

    addLyticsScriptToPage = async () => {
        this.shadowRoot.getElementById('statusLight').setAttribute('status', 'loading');
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.innerHTML = ` !function(){"use strict";var o=window.jstag||(window.jstag={}),r=[];function n(e){o[e]=function(){for(var n=arguments.length,t=new Array(n),i=0;i<n;i++)t[i]=arguments[i];r.push([e,t])}}n("send"),n("mock"),n("identify"),n("pageView"),n("unblock"),n("getid"),n("setid"),n("loadEntity"),n("getEntity"),n("on"),n("once"),n("call"),o.loadScript=function(n,t,i){var e=document.createElement("script");e.async=!0,e.src=n,e.onload=t,e.onerror=i;var o=document.getElementsByTagName("script")[0],r=o&&o.parentNode||document.head||document.body,c=o||r.lastChild;return null!=c?r.insertBefore(e,c):r.appendChild(e),this},o.init=function n(t){return this.config=t,this.loadScript(t.src,function(){if(o.init===n)throw new Error("Load error!");o.init(o.config),function(){for(var n=0;n<r.length;n++){var t=r[n][0],i=r[n][1];o[t].apply(o,i)}r=void 0}()}),this}}();`;
        document.head.appendChild(script);
        await new Promise((resolve) => { setTimeout(resolve, 1000) });
        jstag.init({
            src: 'https://c.lytics.io/api/tag/ff6c1a41af8f70f2335c7e501f2cbc4e/latest.min.js',
            pageAnalysis: {
                dataLayerPull: {
                    disabled: true
                }
            }
        })
        jstag.pageView();

        await new Promise((resolve) => { setTimeout(resolve, 1000) });

        const version = jstag.config.version;
        if (version) {
            this.shadowRoot.getElementById('statusLight').setAttribute('status', 'success');
        } else {
            this.shadowRoot.getElementById('statusLight').setAttribute('status', 'alert');
        }
    }

    populateClipboard = () => {
        const lyticsUid = jstag.getCookieValue();
        const clipboard = this.shadowRoot.querySelector('#clipboard');
        if (!lyticsUid) {
            clipboard.setAttribute('value', 'No Lytics UID found');
            return false;
        }
        clipboard.setAttribute('value', lyticsUid);
        return true;
    }



    updateAudiences = () => {
        const audiences = jstag.getSegments();
        const audienceContainer = this.shadowRoot.querySelector('#audiences');
        audienceContainer.innerHTML = audiences.map(audience => `<span>${audience}</span>`).join(', ');
    }

    generateUUID = () => {
        const crypto = window.crypto || window.msCrypto;
        if (!crypto) {
            console.error('crypto API not available');
            return;
        }
        return crypto.randomUUID();
    }

    reloadEntity = async () => {
        this.shadowRoot.getElementById('reloadEntity').setAttribute('loading', 'true');
        this.shadowRoot.getElementById('statusLight').setAttribute('status', 'loading');
        jstag.setid(this.generateUUID());
        jstag.loadEntity('user', jstag.getid(),  (err, entity) => {
            if (err) {
                console.error(err);
            }
        });
        await new Promise((resolve) => { setTimeout(resolve, 1000) });
        this.updateAudiences();
        const clipboardPopulated = this.populateClipboard();
        if (!clipboardPopulated) {
            this.shadowRoot.getElementById('statusLight').setAttribute('status', 'error');
        } else {
            this.shadowRoot.getElementById('statusLight').setAttribute('status', 'success');
        }
        this.shadowRoot.getElementById('reloadEntity').setAttribute('loading', 'false');
    }
});