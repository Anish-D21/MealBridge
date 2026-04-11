const otpGenerator = require('otp-generator');

exports.generateOTP = () => {
  return otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
};

exports.maskEmail = (email) => {
  const [local, domain] = email.split('@');
  const masked = local[0] + '*'.repeat(Math.max(local.length - 2, 3)) + (local.length > 1 ? local[local.length - 1] : '');
  return `${masked}@${domain}`;
};