const template = document.createElement('template');
template.innerHTML = `
<div class="statuslight"></div>
<style>
    .statuslight {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin: 10px;
        background-color: grey;
        transition: background-color 0.3s, box-shadow 0.3s;
        /*background-image: radial-gradient(circle, #ffffff88, #00000066);*/
        /*background-blend-mode: hard-light;*/
    }
    
    @keyframes loadingBlink {
        0% {
            background-color: greenyellow;
            box-shadow: 0 0 10px greenyellow;
        }
        30% {
            background-color: grey;
            box-shadow: 0 0 8px transparent;
        }
        70% {
            background-color: grey;
            box-shadow: 0 0 8px transparent;
        }
        100% {
            box-shadow: 0 0 10px greenyellow;
            background-color: greenyellow;
        }
    
    }
    
    .statuslight.loading {
        background-color: greenyellow;
        box-shadow: 0 0 10px greenyellow;
        animation: loadingBlink 800ms infinite
    }
    
    .statuslight.success {
        background-color: greenyellow;
        box-shadow: 0 0 10px greenyellow;
        animation: none;
    }
    
    .statuslight.error {
        background-color: red;
        box-shadow: 0 0 10px red;
        animation: none;
    }
    
    .statuslight.warning {
        background-color: yellow;
        box-shadow: 0 0 10px yellow;
        animation: none;
    }
</style>`;

export { template };
