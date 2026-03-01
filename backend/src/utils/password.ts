import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePasswords = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

export const validatePasswordStrength = (
  password: string
): { valid: boolean; message?: string } => {
  if (password.length < 10) {
    return {
      valid: false,
      message: 'Password must be at least 10 characters long.',
    };
  }

  let hasLowerletter = false;
  let hasNumber = false;
  let hasCapitalletter = false;

  for (let i = 0; i < password.length; i++) {
    const char = password[i];

    if (char >= '0' && char <= '9') {
      hasNumber = true;
    } else if (char >= 'a' && char <= 'z') {
      hasLowerletter = true;
    } else if (char >= 'A' && char <= 'Z') {
      hasCapitalletter = true;
    }

    if (hasLowerletter && hasCapitalletter && hasNumber) {
      break;
    }
  }

  if (!hasLowerletter || !hasCapitalletter || !hasNumber) {
    if (hasLowerletter && hasCapitalletter && !hasNumber) {
      return {
        valid: false,
        message:
          'Password must contain a small letter, a capital letter, and a number, but there is no number in your password.',
      };
    } else if (hasLowerletter && !hasCapitalletter && hasNumber) {
      return {
        valid: false,
        message:
          'Password must contain a small letter, a capital letter, and a number, but there is no capital letter in your password.',
      };
    } else if (!hasLowerletter && hasCapitalletter && hasNumber) {
      return {
        valid: false,
        message:
          'Password must contain a small letter, a capital letter, and a number, but there is no small letter in your password.',
      };
    } else if (hasLowerletter && !hasCapitalletter && !hasNumber) {
      return {
        valid: false,
        message:
          'Password must contain a small letter, a capital letter, and a number, but there is no capital letter or number in your password.',
      };
    } else if (!hasLowerletter && hasCapitalletter && !hasNumber) {
      return {
        valid: false,
        message:
          'Password must contain a small letter, a capital letter, and a number, but there is no small letter or number in your password.',
      };
    } else if (!hasLowerletter && !hasCapitalletter && hasNumber) {
      return {
        valid: false,
        message:
          'Password must contain a small letter, a capital letter, and a number, but there are no letters at all in your password.',
      };
    } else {
      return {
        valid: false,
        message:
          'Password must contain at least one small letter, one capital letter, and one number.',
      };
    }
  }

  return { valid: true, message: 'Your password is nicee!' };
};
