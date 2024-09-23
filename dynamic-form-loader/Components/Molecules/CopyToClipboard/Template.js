const template = document.createElement('template');
template.innerHTML = `
<div class="container">
    <div id="value"></div>
    <zui-button id="copyButton" label="Copy" version="primary"></zui-button>
</div>
<style>
    .container {
        display: flex;
        align-items: stretch;
        justify-content: stretch;
    }
    #value {
        flex: 1 1 auto;
        padding: 5px;
        display: block;
        background-color: transparent;
        border: var(--input-border-width) solid var(--color-grey);
        border-radius: var(--input-border-radius);
        margin-right: 10px;
        font-size: var(--font-size); 
        white-space: nowrap;
        overflow: hidden;
        min-width: 0;
        line-height: 2;
    }
</style>`;

export { template };
