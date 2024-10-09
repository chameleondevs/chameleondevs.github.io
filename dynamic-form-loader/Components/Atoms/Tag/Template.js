const template = document.createElement('template');
template.innerHTML = `
<span class="tag">
    <slot></slot>
</span>
<style>
    .tag {
        display: inline-block;
        padding: 2px 5px;
        background-color: var(--color-ui);
        font-size: smaller;
        border-radius: var(--input-border-radius);
        color: var(--color-white);
    }
    
    .tag.success {
        background-color: var(--color-success);
    }
    
    .tag.error {
        background-color: var(--color-alert);
    }
    
    .tag.warning {
        background-color: var(--color-warning);
    }
</style>`;

export { template };
