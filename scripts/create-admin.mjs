// Crée (ou réinitialise) un administrateur avec un mot de passe temporaire à changer à la 1re connexion.
// Usage : DATABASE_URL=… node scripts/create-admin.mjs admin@exemple.com ["Nom"]
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';

const [email, name = 'Administrateur'] = process.argv.slice(2);
if (!email || !email.includes('@')) { console.error('Usage : node scripts/create-admin.mjs email [nom]'); process.exit(1); }
const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL manquant'); process.exit(1); }
const local = /@(localhost|127\.0\.0\.1)|host=\//.test(url);
const sql = postgres(url, { ssl: local ? false : 'require', max: 1, prepare: false });
const password = crypto.randomBytes(12).toString('base64url') + '7a';
const hash = await bcrypt.hash(password, 12);
await sql`insert into boischauff.admins (email, password_hash, name, must_change_password) values (${email.toLowerCase()}, ${hash}, ${name}, true)
          on conflict ((lower(email))) do update set password_hash = excluded.password_hash, must_change_password = true`;
await sql.end();
console.log(`Administrateur : ${email}\nMot de passe temporaire : ${password}\n(à changer obligatoirement à la première connexion)`);
