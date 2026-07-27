exports.sanitizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return "";

  // Remove all non-numeric characters
  let cleaned = phoneNumber.toString().replace(/\D/g, "");

  // Remove leading '+'
  if (phoneNumber.toString().startsWith("+")) {
    cleaned = cleaned.slice(1);
  }

  console.log(`[sanitize] ${phoneNumber} -> ${cleaned}`);

  // Always return something, don't reject numbers
  return cleaned || phoneNumber.toString();
};
