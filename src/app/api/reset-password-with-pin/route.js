import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SIMPLE_PASSWORDS = ['password', '123456', 'qwerty', 'admin123'];

const createAdminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const findAccount = async (supabaseAdmin, email) => {
  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (usersError) throw usersError;

  const user = usersData.users.find((candidate) => candidate.email?.toLowerCase() === email);
  if (!user) return null;

  const { data: merchant, error: merchantError } = await supabaseAdmin
    .from('merchants')
    .select('id, recovery_pin_hash, pin_attempts, pin_locked_until')
    .eq('id', user.id)
    .maybeSingle();

  if (merchantError) throw merchantError;
  if (!merchant) return null;
  return { user, merchant };
};

const verifyPin = async (supabaseAdmin, merchant, pin) => {
  if (!merchant.recovery_pin_hash) {
    throw new Error('PIN pemulihan belum diatur. Silakan hubungi CS untuk bantuan.');
  }

  if (merchant.pin_locked_until) {
    const lockTime = new Date(merchant.pin_locked_until);
    if (lockTime > new Date()) {
      const remainingMinutes = Math.ceil((lockTime - Date.now()) / 60000);
      throw new Error(`PIN terkunci. Coba lagi dalam ${remainingMinutes} menit atau hubungi CS via WhatsApp.`);
    }

    await supabaseAdmin
      .from('merchants')
      .update({ pin_attempts: 0, pin_locked_until: null })
      .eq('id', merchant.id);
  }

  const isPinValid = await bcrypt.compare(pin, merchant.recovery_pin_hash);
  if (!isPinValid) {
    const attempts = (merchant.pin_attempts || 0) + 1;
    if (attempts >= 3) {
      await supabaseAdmin
        .from('merchants')
        .update({
          pin_attempts: attempts,
          pin_locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        })
        .eq('id', merchant.id);
      throw new Error('PIN yang Anda masukkan salah. Akun dikunci selama 15 menit.');
    }

    await supabaseAdmin
      .from('merchants')
      .update({ pin_attempts: attempts })
      .eq('id', merchant.id);
    throw new Error(`PIN yang Anda masukkan salah. Sisa percobaan: ${3 - attempts} kali.`);
  }

  await supabaseAdmin
    .from('merchants')
    .update({ pin_attempts: 0, pin_locked_until: null })
    .eq('id', merchant.id);
};

export async function POST(request) {
  try {
    const { mode, email, pin, password } = await request.json();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Fitur reset password belum dikonfigurasi.' }, { status: 503 });
    }
    if (!['verify', 'update'].includes(mode)) {
      return NextResponse.json({ error: 'Mode reset password tidak valid.' }, { status: 400 });
    }

    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || !/^\d{6}$/.test(pin || '')) {
      return NextResponse.json({ error: 'Email dan PIN pemulihan 6 digit wajib diisi.' }, { status: 400 });
    }
    if (mode === 'update' && (!password || password.length < 6 || SIMPLE_PASSWORDS.includes(password.toLowerCase()))) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter dan tidak boleh terlalu mudah ditebak.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const account = await findAccount(supabaseAdmin, normalizedEmail);
    if (!account) {
      return NextResponse.json({ error: 'Email atau PIN pemulihan tidak cocok dengan data akun.' }, { status: 403 });
    }

    await verifyPin(supabaseAdmin, account.merchant, pin);

    if (mode === 'update') {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        account.user.id,
        { password }
      );
      if (updateError) throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.warn('Reset password with PIN warning:', error.message);
    return NextResponse.json({ error: error.message || 'Reset password gagal diproses.' }, { status: 500 });
  }
}