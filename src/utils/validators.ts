// Form validation utilities

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Email validation
 */
export const validateEmail = (email: string): ValidationResult => {
    const errors: string[] = [];

    if (!email) {
        errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Please enter a valid email address');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Password validation
 */
export const validatePassword = (password: string): ValidationResult => {
    const errors: string[] = [];

    if (!password) {
        errors.push('Password is required');
    } else {
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/(?=.*[a-z])/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/(?=.*\d)/.test(password)) {
            errors.push('Password must contain at least one number');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Confirm password validation
 */
export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
    const errors: string[] = [];

    if (!confirmPassword) {
        errors.push('Please confirm your password');
    } else if (password !== confirmPassword) {
        errors.push('Passwords do not match');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Name validation
 */
export const validateName = (name: string, fieldName: string = 'Name'): ValidationResult => {
    const errors: string[] = [];

    if (!name) {
        errors.push(`${fieldName} is required`);
    } else if (name.length < 2) {
        errors.push(`${fieldName} must be at least 2 characters long`);
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
        errors.push(`${fieldName} can only contain letters and spaces`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Login form validation
 */
export const validateLoginForm = (email: string, password: string): ValidationResult => {
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    const allErrors = [...emailValidation.errors, ...passwordValidation.errors];

    return {
        isValid: allErrors.length === 0,
        errors: allErrors
    };
};

/**
 * Registration form validation
 */
export const validateRegisterForm = (formData: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName?: string;
    lastName?: string;
    acceptTerms?: boolean;
}): ValidationResult => {
    const errors: string[] = [];

    // Email validation
    const emailValidation = validateEmail(formData.email);
    errors.push(...emailValidation.errors);

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    errors.push(...passwordValidation.errors);

    // Confirm password validation
    const confirmPasswordValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
    errors.push(...confirmPasswordValidation.errors);

    // Name validation (optional)
    if (formData.firstName) {
        const firstNameValidation = validateName(formData.firstName, 'First name');
        errors.push(...firstNameValidation.errors);
    }

    if (formData.lastName) {
        const lastNameValidation = validateName(formData.lastName, 'Last name');
        errors.push(...lastNameValidation.errors);
    }

    // Terms acceptance
    if (formData.acceptTerms !== undefined && !formData.acceptTerms) {
        errors.push('You must accept the terms and conditions');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
    return input
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .trim(); // Remove leading/trailing whitespace
};

/**
 * Check if string is empty or only whitespace
 */
export const isEmpty = (value: string | null | undefined): boolean => {
    return !value || value.trim().length === 0;
};
