const template = document.createElement('template');
template.innerHTML = `
<div class="container">
    <input type="text">
</div>
<style>
    .container {
        display: flex;
    }
    input {
        all: unset;
        display: block;
        font-size: var(--font-size);
        color: inherit;
        border-radius: var(--input-border-radius);
        flex: 1 1 auto;
        padding: 5px;
        background-color: transparent;
        border: var(--input-border-width) solid var(--color-grey);
    }
</style>`;

export { template };
