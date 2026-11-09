(() => {
  "use strict";
  const RD = window.RaceDay;
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const message = document.getElementById("authMessage");
  function say(text, success = false) {
    if (!message) return;
    message.textContent = text;
    message.className = `form-message${success ? " success" : ""}`;
  }
  function destinationAfterAuth() {
    const requested = new URLSearchParams(location.search).get("returnTo");
    if (!requested) return "/portal.html";
    try {
      const target = new URL(requested, location.origin);
      if (target.origin === location.origin && target.pathname.startsWith("/")) return `${target.pathname}${target.search}${target.hash}`;
    } catch { }
    return "/portal.html";
  }
  if (loginForm) {
    const signUpLink = document.querySelector('.auth-foot a[href="signup.html"]');
    const requested = new URLSearchParams(location.search).get("returnTo");
    if (signUpLink && requested) signUpLink.href = `/signup.html?returnTo=${encodeURIComponent(requested)}`;
  }
  document.querySelectorAll("[data-password-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
      button.textContent = input.type === "password" ? "Show" : "Hide";
    });
  });
  document.getElementById("showPasswordCheck")?.addEventListener("change", event => {
    const input = document.getElementById("password");
    if (input) input.type = event.target.checked ? "text" : "password";
  });

  if (loginForm) {
    if (RD.getSession()) location.replace(destinationAfterAuth());
    loginForm.addEventListener("submit", async event => {
      event.preventDefault();
      say("Signing you in…");
      const button = loginForm.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        const response = await RD.api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value
          })
        });
        RD.saveSession(response);
        location.href = destinationAfterAuth();
      } catch (error) {
        say(error.message);
      } finally { button.disabled = false; }
    });
  }

  if (signupForm) {
    if (RD.getSession()) location.replace(destinationAfterAuth());
    signupForm.addEventListener("submit", async event => {
      event.preventDefault();
      const password = document.getElementById("password").value;
      const confirm = document.getElementById("confirmPassword").value;
      if (password !== confirm) { say("The passwords do not match."); return; }
      if (password.length < 8) { say("Use a password with at least 8 characters."); return; }
      say("Creating your account…");
      const button = signupForm.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        const response = await RD.api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            firstName: document.getElementById("firstName").value.trim(),
            lastName: document.getElementById("lastName").value.trim(),
            email: document.getElementById("email").value.trim(),
            password
          })
        });
        RD.saveSession(response);
        location.href = destinationAfterAuth();
      } catch (error) {
        say(error.message);
      } finally { button.disabled = false; }
    });
  }
})();