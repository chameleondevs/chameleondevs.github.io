const template = document.createElement('template');
template.innerHTML = `
<div class="container">
    <input type="text">
    <button id="openDropdown" type="button">Select</button>
    <zui-dropdown open="false">></zui-dropdown>
</div>
<style>
    .container {
        position: relative;
        width: 100%;
    }
    input {
        display: none;
    }
    button {
        box-sizing: border-box;
        text-align: left;
        display: block;
        font-size: var(--font-size);
        color: inherit;
        border-radius: var(--input-border-radius);
        flex: 1 1 auto;
        background-color: transparent;
        border: var(--input-border-width) solid var(--color-ui);
        width: 100%;
        line-height: 2;
        padding: 5px 10px;
        background-image: url('data:image/svg+xml;utf8,<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"></path></svg>');
        background-repeat: no-repeat;
        background-position: right 10px center;
    }
    button:hover {
        background-color: var(--color-ui-extra-opaque);
    }
    
    button:focus, button:active {
        outline: 4px solid var(--color-ui-opaque);
    }
</style>`;

export { template };
