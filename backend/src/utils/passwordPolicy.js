import crypto from 'crypto';

const COMMON_PASSWORDS = new Set([
  'password','123456','123456789','12345678','qwerty','111111','123123','abc123','password1','iloveyou','admin','welcome','monkey','login','dragon'
]);

export async function validatePassword(password, { email = '', name = '' } = {}) {
  if (typeof password !== 'string' || password.length < 8) {
    return { ok: false, reason: 'min_length', message: 'Password must be at least 8 characters.' };
  }

  // Block trivial/common
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, reason: 'common', message: 'Password is too common. Choose something more unique.' };
  }

  // Avoid obvious inclusion of name/email local part
  const emailLocal = (email || '').split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedName = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (emailLocal && password.toLowerCase().includes(emailLocal) && emailLocal.length >= 3) {
    return { ok: false, reason: 'contains_email', message: 'Password should not contain your email name.' };
  }
  if (normalizedName && password.toLowerCase().includes(normalizedName) && normalizedName.length >= 3) {
    return { ok: false, reason: 'contains_name', message: 'Password should not contain your name.' };
  }

  // Optional: Have I Been Pwned k-anonymity check
  if (process.env.ENABLE_PW_BREACH_CHECK === '1' || process.env.ENABLE_PW_BREACH_CHECK === 'true') {
    try {
      const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5);
      const resp = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, { headers: { 'Add-Padding': 'true' } });
      if (resp.ok) {
        const text = await resp.text();
        const leaked = text.split('\n').some(line => line.startsWith(suffix));
        if (leaked) {
          return { ok: false, reason: 'breached', message: 'This password appears in known breaches. Pick a different one.' };
        }
      }
    } catch (_) {}
  }

  return { ok: true };
}


