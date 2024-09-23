const template = document.createElement('template');
template.innerHTML = `
<div class="container">
    <input type="checkbox" id="toggle"/>
    <div class="toggle"></div>
    <div class="label"><slot name="label"></slot></div>
</div>
<style>

.container {
    display: flex;
    margin: 10px 0;
    align-items: center;
    cursor: pointer;
}

input {
    display: none;
}

.toggle {
    width: 25px;
    height: 15px;
    border-radius: 15px;
    background-color: var(--color-cream);
    position: relative;
    transition: background-color 200ms;
    /*box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.2)*/
}

.toggle:before {
    content: '';
    position: absolute;
    width: 11px;
    height: 11px;
    margin: 2px;
    border-radius: 50%;
    background-color: white;
    left: 0;
    transition: left 200ms;
    /*box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);*/
}

input:checked + .toggle {
    background-color: var(--color-cta-light);
}

input:checked + .toggle:before {
    left: 10px;
}

.label {
    margin-left: 10px;
}

.container:hover .label {
    color: var(--color-ui);
}

</style>`;

export { template };
