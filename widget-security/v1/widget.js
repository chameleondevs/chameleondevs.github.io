
document.addEventListener("DOMContentLoaded", () => {
    window.formState = new Map();
    const container = document.getElementById("container");
    const fields = [
        {
            label: "Email",
            name: "email",
        },
        {
            label: "First Name",
            name: "firstName",
        },
        {
            label: "Last Name",
            name: "lastName",
        },
    ];
    const form = document.createElement("form");
    fields.forEach((field) => {
        const div = document.createElement("div");
        const label = document.createElement("label");
        label.textContent = field.label;
        div.appendChild(label);
        const input = document.createElement("input");
        input.type = "text";
        input.name = field.name;
        input.placeholder = field.label;
        input.addEventListener("change", (e) => {
            window.formState.set(field.name, e.target.value);
        });
        div.appendChild(input);
        form.appendChild(div);
    });
    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";
    submitButton.addEventListener("click", async (e) => {
        e.preventDefault();
        const formData = Object.fromEntries(window.formState);
        const response = await fetch("https://httpbin.org/post", {
            method: "POST",
            body: JSON.stringify(formData),
        });
        const data = await response.json();
        console.log(data);
    });
    form.appendChild(submitButton);
    container.appendChild(form);
});