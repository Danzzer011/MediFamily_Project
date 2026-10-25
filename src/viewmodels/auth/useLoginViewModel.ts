import { useState } from 'react';

import { toAppError } from '../../models/errors';
import { validateEmail } from '../../models/validation';
import { authRepository } from '../../repositories/authRepository';

// ViewModel for the Login page: holds what the user typed, the error messages,
// and the logIn action. The page (View) only shows this state and calls logIn.
export function useLoginViewModel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  function changeEmail(text: string) {
    setEmail(text);
    setEmailError('');
    setFormError('');
  }

  function changePassword(text: string) {
    setPassword(text);
    setPasswordError('');
    setFormError('');
  }

  async function logIn() {
    if (loading) return;

    // 1. check the form before contacting the server
    const emailProblem = validateEmail(email) ?? '';
    const passwordProblem = password ? '' : 'Enter your password.';
    setEmailError(emailProblem);
    setPasswordError(passwordProblem);
    setFormError('');
    if (emailProblem || passwordProblem) return;

    // 2. ask the repository to log in. On success the session changes and the
    //    root layout moves the user into the app, so there is nothing else to do here.
    setLoading(true);
    try {
      await authRepository.signIn(email.trim(), password);
    } catch (error) {
      setFormError(toAppError(error).message);
      setLoading(false);
    }
  }

  return { email, password, emailError, passwordError, formError, loading, changeEmail, changePassword, logIn };
}
