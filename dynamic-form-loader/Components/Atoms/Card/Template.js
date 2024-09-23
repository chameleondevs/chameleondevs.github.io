const template = document.createElement('template');
template.innerHTML = `
<div class="container">
    <div id="header">
        <div><slot name="header"></slot></div>
        <div role="button" id="toggleCollapsed">
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 10l5 5 5-5z"></path>
            </svg>
        </div>
    </div>
    <div id="content"><slot name="content"></slot></div>
    <div id="footer"><slot name="footer"></slot></div>
</div>
<style>
    .container {
        display: block;
        padding: 10px;
        margin: 10px auto;
        border-radius: var(--button-border-radius);
        box-shadow: 0 2px 6px 0 #0000003a, 0 1px 3px 0 #00000014;
        background-color: var(--color-off-white);
        color: var(--color-text);
    }
    
    svg {
        stroke: currentColor;
        fill: currentColor;
    }
    
    .container #content {
        padding: 10px;
    }
    .container #footer {
        padding: 0 10px 10px 10px;
    }
    .container.collapsed #content {
        display: none;
    }
    
    .container.collapsed #footer {
        display: none;
    }
    
    #header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    #toggleCollapsed {
        display-role: button;
        cursor: pointer;
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(180deg);
        transition: transform 200ms ease-in-out
    }
    
    .container.collapsed #toggleCollapsed {
        transform: rotate(0deg);
    }
    
</style>`;

export { template };
