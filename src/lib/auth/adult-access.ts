type AdultAccessInput = {
  birthDate?: string | Date | null;
  adultContentEnabled?: boolean | null;
};

export type AdultAccessState = {
  age: number | null;
  isAdultByAge: boolean;
  adultContentEnabled: boolean;
  canAccessNsfw: boolean;
};

function toValidDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function ageInYears(birthDate: string | Date | null | undefined, now = new Date()): number | null {
  const parsedBirthDate = toValidDate(birthDate);
  if (!parsedBirthDate) {
    return null;
  }

  const birthYear = parsedBirthDate.getUTCFullYear();
  const birthMonth = parsedBirthDate.getUTCMonth();
  const birthDay = parsedBirthDate.getUTCDate();

  let age = now.getUTCFullYear() - birthYear;
  const hasHadBirthdayThisYear =
    now.getUTCMonth() > birthMonth ||
    (now.getUTCMonth() === birthMonth && now.getUTCDate() >= birthDay);

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

export function getAdultAccessState(input: AdultAccessInput, now = new Date()): AdultAccessState {
  const adultContentEnabled = Boolean(input.adultContentEnabled);
  const age = ageInYears(input.birthDate ?? null, now);
  const isAdultByAge = age !== null && age >= 21;

  return {
    age,
    isAdultByAge,
    adultContentEnabled,
    canAccessNsfw: isAdultByAge && adultContentEnabled,
  };
}

export function canAccessNsfw(input: AdultAccessInput, now = new Date()): boolean {
  return getAdultAccessState(input, now).canAccessNsfw;
}
