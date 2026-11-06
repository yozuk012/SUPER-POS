import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export async function POST(request) {
  try {
    const { mode, code, email, fullName, pin, confirmPin } = await request.json();
    const expectedCode = process.env.PIN_RESET_SUPPORT_CODE;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Fitur reset PIN belum dikonfigurasi.' }, { status: 503 });
    }

    if (!['self', 'support'].includes(mode)) {
      return NextResponse.json({ error: 'Mode reset PIN tidak valid.' }, { status: 400 });
    }

    if (mode === 'support') {
      const providedCode = Buffer.from(code || '');
      const configuredCode = Buffer.from(expectedCode || '');
      const validCode = providedCode.length === configuredCode.length &&
        crypto.timingSafeEqual(providedCode, configuredCode);
      if (!expectedCode || !code || !validCode) {
        return NextResponse.json({ error: 'Kode reset developer/CS tidak valid.' }, { status: 403 });
      }
    }

    if (!email || !fullName || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Email dan nama lengkap wajib diisi.' }, { status: 400 });
    }

    if (!/^\d{6}$/.test(pin) || pin !== confirmPin) {
      return NextResponse.json({ error: 'PIN baru harus 6 digit dan konfirmasinya harus cocok.' }, { status: 400 });
    }

    const simplePins = ['123456', '654321', '111111', '000000', '121212', '696969'];
    if (simplePins.includes(pin)) {
      return NextResponse.json({ error: 'PIN terlalu mudah ditebak.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const normalizedEmail = email.trim().toLowerCase();
    let matchedUser = null;
    let page = 1;
    const perPage = 1000;

    do {
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (usersError) throw new Error(`Gagal membaca data Auth: ${usersError.message}`);

      matchedUser = usersData.users.find((user) => user.email?.toLowerCase() === normalizedEmail) || null;
      if (matchedUser || usersData.users.length < perPage) break;
      page += 1;
    } while (page <= 10);

    if (!matchedUser) {
      return NextResponse.json({ error: 'Email atau nama lengkap tidak cocok dengan data akun.' }, { status: 403 });
    }

    const normalizeName = (value) => value.trim().replace(/\s+/g, ' ').toLowerCase();
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, full_name')
      .eq('id', matchedUser.id)
      .maybeSingle();
    if (merchantError) throw merchantError;
    if (!merchant || normalizeName(fullName) !== normalizeName(merchant.full_name || '')) {
      return NextResponse.json({ error: 'Email atau nama lengkap tidak cocok dengan data akun.' }, { status: 403 });
    }

    const hashedPin = await bcrypt.hash(pin, 10);
    const { error: updateError } = await supabaseAdmin
      .from('merchants')
      .update({ recovery_pin_hash: hashedPin, pin_attempts: 0, pin_locked_until: null })
      .eq('id', merchant.id);

    if (updateError) throw updateError;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.warn('Reset PIN route warning:', error.message);
    return NextResponse.json({ error: 'Reset PIN gagal diproses.' }, { status: 500 });
  }
}