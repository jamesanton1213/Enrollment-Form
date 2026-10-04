let publicKey;
let privateKey;
let keysReady = false;

const rsaConfig = {
  name: "RSA-OAEP",
  hash: "SHA-256",
};

// Convert text into bytes
function textToBuffer(text) {
  return new TextEncoder().encode(text);
}

// Convert bytes back into text
function bufferToText(buffer) {
  return new TextDecoder().decode(buffer);
}

// Convert encrypted bytes to Base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 back to bytes
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

function showMessage(id, text, color = "black") {
  const msg = document.getElementById(id);

  if (msg) {
    msg.textContent = text;
    msg.style.color = color;
  }
}

async function generateRSAKeys() {
  try {
    // Check Web Crypto API
    if (!window.crypto) {
      throw new Error("Web Crypto API is not available.");
    }

    // Check crypto.subtle
    if (!window.crypto.subtle) {
      throw new Error(
        "crypto.subtle is unavailable. Open this page using localhost or HTTPS.",
      );
    }

    console.log("Generating RSA 3072-bit keys...");

    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 3072,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    );

    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;
    keysReady = true;

    console.log("RSA 3072-bit keys generated successfully.");

    // Enable Sign Up button
    const button = document.getElementById("signupButton");

    if (button) {
      button.disabled = false;
      button.textContent = "Sign Up";
    }

    showMessage("signup-message", "RSA 3072-bit keys are ready.", "green");
  } catch (error) {
    console.error("RSA KEY GENERATION ERROR:", error);

    showMessage(
      "signup-message",
      "RSA key generation failed: " + error.message,
      "red",
    );
  }
}

async function rsaEncrypt(text) {
  if (!publicKey) {
    throw new Error("RSA public key is not available.");
  }

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    textToBuffer(text),
  );

  return arrayBufferToBase64(encrypted);
}

async function rsaDecrypt(encryptedText) {
  if (!privateKey) {
    throw new Error("RSA private key is not available.");
  }

  const encryptedBuffer = base64ToArrayBuffer(encryptedText);
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encryptedBuffer,
  );

  return bufferToText(decrypted);
}

async function signUp() {
  // Make sure RSA keys are ready
  if (!keysReady) {
    showMessage(
      "signup-message",
      "Please wait for RSA 3072-bit keys to finish generating.",
      "red",
    );

    return;
  }

  const fullname = document.getElementById("signupName").value.trim();
  const username = document.getElementById("signupUname").value.trim();
  const birthday = document.getElementById("signupBday").value.trim();
  const yearLevel = document.getElementById("signupYear").value;
  const gender = document.getElementById("signupGender").value;
  const password = document.getElementById("signupPword").value.trim();

  if (
    !fullname ||
    !username ||
    !birthday ||
    !yearLevel ||
    !gender ||
    !password
  ) {
    showMessage("signup-message", "Please fill in all fields.", "red");

    return;
  }

  try {
    showMessage("signup-message", "Encrypting information...", "blue");
    const encName = await rsaEncrypt(fullname);
    const encUser = await rsaEncrypt(username);
    const encBirthday = await rsaEncrypt(birthday);
    const encYear = await rsaEncrypt(yearLevel);
    const encGender = await rsaEncrypt(gender);
    const encPassword = await rsaEncrypt(password);

    const encryptedUser = {
      encName,
      encUser,
      encBirthday,
      encYear,
      encGender,
      encPassword,
    };

    localStorage.setItem("rsa3072User", JSON.stringify(encryptedUser));

    document.getElementById("encryptedData").textContent = `${encName}
      ${encUser}
      ${encBirthday}
      ${encYear}
      ${encGender}
      ${encPassword}`;

    const decName = await rsaDecrypt(encName);
    const decUser = await rsaDecrypt(encUser);
    const decBirthday = await rsaDecrypt(encBirthday);
    const decYear = await rsaDecrypt(encYear);
    const decGender = await rsaDecrypt(encGender);
    const decPassword = await rsaDecrypt(encPassword);

    document.getElementById("decryptedData").textContent =
      `Full Name      : ${decName}
Username       : ${decUser}
Date of Birth  : ${decBirthday}
Year Level     : ${decYear}
Gender         : ${decGender}
Password       : ${decPassword}`;

    showMessage(
      "signup-message",
      "Signup and RSA 3072-bit encryption successful!",
      "green",
    );
  } catch (error) {
    console.error("RSA ENCRYPTION/DECRYPTION ERROR:", error);

    console.error("Error name:", error.name);

    console.error("Error message:", error.message);

    showMessage(
      "signup-message",
      "RSA encryption failed: " + error.message,
      "red",
    );
  }
}

window.addEventListener("DOMContentLoaded", () => {
  generateRSAKeys();
});