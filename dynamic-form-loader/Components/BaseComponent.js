export class BaseComponent extends HTMLElement {

    constructor(template) {
        super();
        this.importTemplateAndShadowDOM(template)
    }

    importTemplateAndShadowDOM = (template) => {
        this.attachShadow({ mode: 'open' });
        const templateOverrideId = this.getAttribute('templateId')
        if (templateOverrideId) {
            const templateOverride = document.querySelector('template#'+templateOverrideId);
            if (templateOverride) {
                this.shadowRoot.appendChild(templateOverride.content.cloneNode(true));
                return;
            }
        }
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
}