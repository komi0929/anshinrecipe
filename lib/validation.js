"use client";

import React from "react";

/**
 * フォームバリデーションユーティリティ（92件改善 Phase5）
 * 5.48-5.50 フォームバリデーション改善
 */

// バリデーションルール
export const validators = {
  required: (value) => {
    if (value === undefined || value === null || value === "") {
      return "必須項目です";
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "有効なメールアドレスを入力してください";
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^[0-9-]{10,13}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ""))) {
      return "有効な電話番号を入力してください";
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return `${min}文字以上で入力してください`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return `${max}文字以内で入力してください`;
    }
    return null;
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return "有効なURLを入力してください";
    }
  },

  pattern: (regex, message) => (value) => {
    if (!value) return null;
    if (!regex.test(value)) {
      return message || "フォーマットが正しくありません";
    }
    return null;
  },

  match: (field, message) => (value, allValues) => {
    if (value !== allValues[field]) {
      return message || "値が一致しません";
    }
    return null;
  },
};

// フォームバリデーションフック
export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    const ruleList = Array.isArray(rules) ? rules : [rules];

    for (const rule of ruleList) {
      const error = rule(value, values);
      if (error) return error;
    }
    return null;
  };

  const validateAll = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((name) => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (name) => (e) => {
    const value = e.target?.value ?? e;
    setValues((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name) => () => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (onSubmit) => async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);

    // Touch all fields
    const allTouched = Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (validateAll()) {
      await onSubmit(values);
    }

    setIsSubmitting(false);
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  const getFieldProps = (name) => ({
    value: values[name] || "",
    onChange: handleChange(name),
    onBlur: handleBlur(name),
    error: touched[name] ? errors[name] : null,
  });

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validateAll,
    reset,
    getFieldProps,
    isValid: Object.keys(errors).length === 0,
  };
};

export default { validators, useFormValidation };
