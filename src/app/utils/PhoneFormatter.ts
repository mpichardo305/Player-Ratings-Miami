export class PhoneFormatter {
  private static PHONE_REGEX = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  private static DIGITS_ONLY = /[^\d]/g;

  static standardize(phone: string): string {
    if (!phone) return '';
    return phone.replace(this.DIGITS_ONLY, '');
  }

  static isValid(phone: string): boolean {
    const standardized = this.standardize(phone);
    return standardized.length === 10 && this.PHONE_REGEX.test(phone);
  }

  static format(phone: string): string {
    const standardized = this.standardize(phone);
    if (!this.isValid(phone)) return phone;
    return `(${standardized.slice(0, 3)}) ${standardized.slice(3, 6)}-${standardized.slice(6)}`;
  }
}

// Function to save phone number to database
async function save(phoneNumber: string): Promise<void> {
  // Implementation for saving to database
  console.log(`Saving phone number: ${phoneNumber}`);
}

const rawPhoneNumber = "(123) 456-7890";
const standardized = PhoneFormatter.standardize(rawPhoneNumber);
if (PhoneFormatter.isValid(standardized)) {
  // Save to database
  await save(standardized);
} else {
  throw new Error('Invalid phone number');
}