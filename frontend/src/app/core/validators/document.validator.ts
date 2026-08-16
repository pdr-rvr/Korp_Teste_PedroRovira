import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function documentValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      return null; // Campo opcional
    }

    const clean = value.replace(/\D/g, '');

    if (clean.length === 11) {
      return isValidCpf(clean) ? null : { invalidCpf: true };
    }

    if (clean.length === 14) {
      return isValidCnpj(clean) ? null : { invalidCnpj: true };
    }

    return { invalidDocumentLength: true };
  };
}

export function isValidCpf(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;

  // Rejeita sequências repetidas
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rest = 11 - (sum % 11);
  const digit1 = rest === 10 || rest === 11 ? 0 : rest;

  if (digit1 !== parseInt(clean.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rest = 11 - (sum % 11);
  const digit2 = rest === 10 || rest === 11 ? 0 : rest;

  return digit2 === parseInt(clean.charAt(10), 10);
}

export function isValidCnpj(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;

  // Rejeita sequências repetidas
  if (/^(\d)\1{13}$/.test(clean)) return false;

  const size = clean.length - 2;
  const numbers = clean.substring(0, size);
  const digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  const size2 = size + 1;
  const numbers2 = clean.substring(0, size2);
  sum = 0;
  pos = size2 - 7;

  for (let i = size2; i >= 1; i--) {
    sum += parseInt(numbers2.charAt(size2 - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1), 10);
}
