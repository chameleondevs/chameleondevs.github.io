const template = document.createElement('template');
template.innerHTML = `
<div class="container">
    <input type="text">
</div>
<style>
    .container {
        display: flex;
        margin: 10px 0;
    }
    input {
        all: unset;
        display: block;
        font-size: var(--font-size);
        color: inherit;
        border-radius: var(--input-border-radius);
        flex: 1 1 auto;
        background-color: transparent;
        border: var(--input-border-width) solid var(--color-grey);
        width: 100%;
        line-height: 2;
        padding: 5px 10px;
    }
    
    input:focus, input:active {
        outline: 4px solid var(--color-ui-opaque);
    }
</style>`;

export { template };
