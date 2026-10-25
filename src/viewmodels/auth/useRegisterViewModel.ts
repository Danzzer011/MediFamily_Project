import { useState } from 'react';

import { toAppError } from '../../models/errors';
import { validateEmail, validateNewPassword } from '../../models/validation';
import { authRepository } from '../../repositories/authRepository';

// ViewModel for the Register page: holds what the user typed, the error messages,
// and the register action. Registering creates an account only, never a health profile (FR01).
export function useRegisterViewModel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
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

  function changeConfirmPassword(text: string) {
    setConfirmPassword(text);
    setConfirmError('');
    setFormError('');
  }

  async function register() {
    if (loading) return;

    // 1. check the form before contacting the server
    const emailProblem = validateEmail(email) ?? '';
    const passwordProblem = validateNewPassword(password) ?? '';
    let confirmProblem = '';
    if (!confirmPassword) confirmProblem = 'Enter your password again.';
    else if (confirmPassword !== password) confirmProblem = 'The passwords do not match.';
    setEmailError(emailProblem);
    setPasswordError(passwordProblem);
    setConfirmError(confirmProblem);
    setFormError('');
    if (emailProblem || passwordProblem || confirmProblem) return;

    // 2. ask the repository to create the account. When the account is signed in
    //    straight away, the root layout moves the user to the Profiles page.
    setLoading(true);
    try {
      const result = await authRepository.register(email.trim(), password);
      if (result.needsEmailConfirmation) {
        setConfirmationMessage('Account created. Check your email to confirm it, then log in.');
        setLoading(false);
      }
    } catch (error) {
      setFormError(toAppError(error).message);
      setLoading(false);
    }
  }

  return {
    email,
    password,
    confirmPassword,
    emailError,
    passwordError,
    confirmError,
    formError,
    confirmationMessage,
    loading,
    changeEmail,
    changePassword,
    changeConfirmPassword,
    register,
  };
}
