$(function () {
  App.requireAuth();
  App.initLayout("profile");

  const $status = $("#profileStatus");
  const $passwordForm = $("#passwordForm");
  const $newPassword = $("#newPassword");
  const $currentPassword = $("#currentPassword");
  const $confirmPassword = $("#confirmPassword");
  const $card = $("#profileCard");
  const $loader = $("#profileLoader");

  const stored = App.getStoredUser();
  const userId = stored && (stored.id || stored.userId);

  if (!userId) {
    $status.text("Missing user data. Please sign in again.").addClass("message error").show();
    return;
  }

  async function loadProfile() {
    $loader.show();
    $status.hide().text("").removeClass("error success");
    try {
      const profile = await App.authFetch(`/api/profile`);
      fillProfile(profile);
    } catch (err) {
      $status.text(err.message || "Unable to load profile.").addClass("message error").show();
    } finally {
      $loader.hide();
    }
  }

  function fillProfile(profile) {
    const fullName =
      [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
      profile?.name ||
      "—";
    $("#profileName").text(fullName);
    $("#profileUsername").text(profile?.username || "—");
    $("#profileEmail").text(profile?.email || "—");
    $("#profilePosition").text(profile?.position || profile?.role || "—");
  }

  $passwordForm.on("submit", async function (e) {
    e.preventDefault();
    $status.text("").removeClass("error success").hide();

    const current = ($currentPassword.val() || "").trim();
    const next = ($newPassword.val() || "").trim();
    const confirm = ($confirmPassword.val() || "").trim();

    if (!current || !next || !confirm) {
      $status.text("All password fields are required.").addClass("message error").show();
      return;
    }

    if (next !== confirm) {
      $status.text("New password and confirmation must match.").addClass("message error").show();
      return;
    }

    try {
      await App.authFetch(`/api/profile/password`, {
        method: "POST",
        body: JSON.stringify({
          oldPassword: current,
          newPassword: next,
          confirmNewPassword: confirm,
        }),
      });
      $currentPassword.val("");
      $newPassword.val("");
      $confirmPassword.val("");
      $status.text("Password updated successfully.").addClass("message success").show();
    } catch (err) {
      $status.text(err.message || "Update failed.").addClass("message error").show();
    }
  });

  loadProfile();
});
