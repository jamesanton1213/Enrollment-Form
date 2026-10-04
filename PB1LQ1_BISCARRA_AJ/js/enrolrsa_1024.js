let publicKey;
let privateKey;
let keysReady = false;

const rsaConfig = {
  name: "RSA-OAEP",
  hash: "SHA-256",
};

function textToBuffer(text) {
  return new TextEncoder().encode(text);
}

function bufferToText(buffer) {
  return new TextDecoder().decode(buffer);
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function generateRSAKeys() {
  try {
    console.log("Generating RSA 1024-bit keys...");

    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 1024,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    );

    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;
    keysReady = true;

    console.log("RSA 1024-bit keys generated successfully.");

    const button = document.getElementById("suButton");

    if (button) {
      button.disabled = false;
      button.textContent = "Sign Up";
    }

    showMessage("signup-message", "RSA 1024-bit keys are ready.", "green");
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

  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
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
  const decrypted = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedBuffer,
  );
  return bufferToText(decrypted);
}

function showMessage(id, text, color = "black") {
  const msg = document.getElementById(id);

  if (msg) {
    msg.textContent = text;
    msg.style.color = color;
  }
}

async function signUp() {
  if (!keysReady) {
    showMessage(
      "signup-message",
      "Please wait for the RSA keys to finish generating.",
      "red",
    );
    return;
  }

  const fullname = document.getElementById("suName").value.trim();
  const username = document.getElementById("suUname").value.trim();
  const birthday = document.getElementById("suBday").value.trim();
  const yearLevel = document.getElementById("suYear").value;
  const gender = document.getElementById("suGender").value;
  const password = document.getElementById("suPword").value.trim();

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
    //encrypt each inputs
    const encName = await rsaEncrypt(fullname);
    const encUser = await rsaEncrypt(username);
    const encBirthday = await rsaEncrypt(birthday);
    const encYear = await rsaEncrypt(yearLevel);
    const encGender = await rsaEncrypt(gender);
    const encPassword = await rsaEncrypt(password);

    const encryptedUser = {
      encName: encName,
      encUser: encUser,
      encBirthday: encBirthday,
      encYear: encYear,
      encGender: encGender,
      encPassword: encPassword,
    };

    localStorage.setItem("rsa1024User", JSON.stringify(encryptedUser));

    document.getElementById("encryptedData").textContent = JSON.stringify(
      encryptedUser,
      null,
      2,
    );

    const decName = await rsaDecrypt(encName);
    const decUser = await rsaDecrypt(encUser);
    const decBirthday = await rsaDecrypt(encBirthday);
    const decYear = await rsaDecrypt(encYear);
    const decGender = await rsaDecrypt(encGender);
    const decPassword = await rsaDecrypt(encPassword);

    document.getElementById("decryptedData").textContent =
      `Full Name: ${decName}
      Username: ${decUser}
      Date of Birth: ${decBirthday}
      Year Level: ${decYear}
      Gender: ${decGender}
      Password: ${decPassword}`;

    showMessage(
      "signup-message",
      "Signup and RSA encryption successful!",
      "green",
    );
  } catch (error) {
    console.error("RSA ENCRYPTION/DECRYPTION ERROR:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    showMessage("signup-message", "Encryption failed: " + error.message, "red");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  generateRSAKeys();
});
