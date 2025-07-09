document.addEventListener("DOMContentLoaded", () => {

    const formState = new WeakMap();
    
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    
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
            formState.set(e.target, e.target.value);
        });
        div.appendChild(input);
        form.appendChild(div);
    });

    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";
    submitButton.addEventListener("click", async (e) => {
        e.preventDefault();
        // Collect form data from WeakMap using input elements
        const formData = {};
        form.querySelectorAll('input').forEach(input => {
            const value = formState.get(input);
            if (value) {
                formData[input.name] = value;
            }
        });
        
        try {
            // Define all crypto functions inside the click handler
            const publicKeyPem = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuXUc7Jd6Smg1yjKA4jVe
60zMVmqkr0VOxjvYeWJJzNXw8a7H8qNZ9kFFQE3+wqC6fIQ9tGMdlvOTXz1xq1Ex
Vq6ZlCWZFLFqyV0w9hKJ+a4dh7wKuNOVguVJQYgUKP6T1QUhm1PvXskJKAX2Qfnq
BC4pK0/AUqS6uwR2QiJ+gv5g9rOOQvQoV6g6KN3KLHvIYkUK9BNg1w4pKhHPZR/7
xf0XcpEyFRUz7TGDTjhFUQGWJdIIz4Mbf7ev1TDvzw+GuAnGJ/hNP7QH0+E8Y26T
0xKWAEPD9jqHPKqHGqR2iQzlKQeo72QVtI4YQOZNvzxGUIhAI+LXhqK4TLEt7g8m
AQIDAQAB
-----END PUBLIC KEY-----`;

            // Process the public key
            const strippedPemPublicKey = publicKeyPem
                .replace('-----END PUBLIC KEY-----', '')
                .replace('-----BEGIN PUBLIC KEY-----', '')
                .replaceAll('\n', '')
                .trim();

            const binaryDerString = atob(strippedPemPublicKey);
            const binaryDer = new Uint8Array(binaryDerString.length);
            for (let i = 0; i < binaryDerString.length; i++) {
                if (i >= 0 && i < binaryDer.length) {
                    binaryDer[i] = binaryDerString.charCodeAt(i);
                }
            }

            const publicKey = await window.crypto.subtle.importKey(
                'spki',
                binaryDer.buffer,
                {
                    name: 'RSA-OAEP',
                    hash: 'SHA-256',
                },
                true,
                ['encrypt']
            );

            // Generate AES key
            const aesKey = await window.crypto.subtle.generateKey(
                {
                    name: 'AES-GCM',
                    length: 256,
                },
                true,
                ['encrypt', 'decrypt']
            );

            // Encrypt data with AES
            const encoder = new TextEncoder();
            const encodedData = encoder.encode(JSON.stringify(formData));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            const encryptedContent = await window.crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                    tagLength: 128,
                },
                aesKey,
                encodedData
            );

            const encryptedData = encryptedContent.slice(0, encryptedContent.byteLength - 16);
            const authTag = encryptedContent.slice(encryptedContent.byteLength - 16);

            // Encrypt AES key with RSA
            const exportedKey = await window.crypto.subtle.exportKey('raw', aesKey);
            const encryptedAESKey = await window.crypto.subtle.encrypt(
                {
                    name: 'RSA-OAEP',
                },
                publicKey,
                exportedKey
            );

            // Prepare and send payload
            const payload = {
                encryptedData: Array.from(new Uint8Array(encryptedData)),
                iv: Array.from(iv),
                authTag: Array.from(new Uint8Array(authTag)),
                encryptedKey: Array.from(new Uint8Array(encryptedAESKey)),
            };

            const response = await fetch("https://httpbin.org/post", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Server returned error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error("Failed to submit encrypted form data:", error);
        }
    });
    
    form.appendChild(submitButton);
    shadow.appendChild(form);

    // Add the host element to the container
    const container = document.getElementById("container");
    container.appendChild(host);
});