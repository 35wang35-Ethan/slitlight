(async () => {
  const { data } = await slitSupabase.auth.getSession();
  if (data.session) location.replace('./index.html');
})();

document.querySelector('#loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  const errorElement = document.querySelector('#loginError');
  button.disabled = true;
  errorElement.textContent = '';
  const { error } = await slitSupabase.auth.signInWithPassword({
    email: event.currentTarget.email.value.trim(), password: event.currentTarget.password.value
  });
  if (error) {
    errorElement.textContent = '登入失敗，請確認 Email 與密碼。';
    button.disabled = false;
    return;
  }
  location.replace('./index.html');
});
