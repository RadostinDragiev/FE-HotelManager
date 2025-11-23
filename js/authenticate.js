$(function () {
  App.initLayout();

  if (App.getToken()) {
    window.location.href = "/dashboard.html";
    return;
  }

  const $form = $("#loginForm");
  const $message = $("#loginMessage");
  const $submit = $("#loginSubmit");

  $form.on("submit", async function (e) {
    e.preventDefault();
    $message.text("").removeClass("error success").hide();
    $submit.prop("disabled", true).text("Signing in...");

    const payload = {
      username: $("#username").val(),
      password: $("#password").val(),
    };

    try {
      const data = await fetch(`${App.getApiBase()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (resp) => {
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.message || "Unable to log in");
        }
        return resp.json();
      });

      App.saveAuth(data.token, data.user);
      window.location.href = "/dashboard.html";
    } catch (err) {
      $message.text(err.message || "Login failed.").addClass("message error").show();
    } finally {
      $submit.prop("disabled", false).text("Sign in");
    }
  });
});
