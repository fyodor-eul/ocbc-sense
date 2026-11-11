
function detectSensitiveData(message) {
  if (typeof message !== "string") {
    return null;
  }

  // Detect OTPs explicitly provided by the customer
  const otpPattern =
    /\b(?:my\s+)?(?:otp|one[-\s]?time\s+(?:password|code)|verification\s+code)\s*(?:is|:|=|-)\s*\d{4,8}\b/i;

  // Detect passwords explicitly provided by the customer
  const passwordPattern =
    /\b(?:my\s+)?password\s*(?:is|:|=|-)\s*\S+/i;

  // Detect passport numbers explicitly provided by the customer
  const passportPattern =
    /\b(?:my\s+)?passport\s*(?:number|no\.?|#)\s*(?:is|:|=|-)\s*[A-Z0-9]{6,12}\b/i;

  if (otpPattern.test(message)) {
    return "otp";
  }

  if (passwordPattern.test(message)) {
    return "password";
  }

  if (passportPattern.test(message)) {
    return "passport_number";
  }

  return null;
}

module.exports = { detectSensitiveData };
