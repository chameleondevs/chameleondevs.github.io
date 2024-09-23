const template = document.createElement('template');
template.innerHTML = `
<div class="container">
    <label id="label">
    <slot></slot>
</label>
</div>
<style>
    .container {
        display: block;
        margin: 5px 0;
    }
    
    label {
        font-weight: bold;
    }
</style>`;

export { template };
