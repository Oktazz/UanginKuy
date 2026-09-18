import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { successResponse, errorResponse } from '@/utils/api-response';
import { handleApiError, ApiError } from '@/utils/error-handler';
import { CreateAddressSchema } from '@/validations/address.schema';
import { checkRateLimit } from '@/utils/rate-limit';

export async function GET() {
  try {
    const supabase = await createClient(await cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) throw new ApiError('Sesi tidak valid. Silakan login kembali.', 401);

    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('profile_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new ApiError('Gagal memuat daftar alamat: ' + error.message, 500);

    return successResponse(data, 'Daftar alamat berhasil diambil');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient(await cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) throw new ApiError('Sesi tidak valid. Silakan login kembali.', 401);

    const rateLimit = await checkRateLimit(`addresses:create:${user.id}`, 20);
    if (!rateLimit.allowed) {
      return errorResponse('Terlalu banyak permintaan penambahan alamat. Silakan tunggu beberapa saat.', 429);
    }

    const body = await req.json();
    const payload = CreateAddressSchema.parse(body);

    if (payload.is_primary) {
      // Unset other primary addresses
      await supabase
        .from('user_addresses')
        .update({ is_primary: false })
        .eq('profile_id', user.id);
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .insert([
        {
          profile_id: user.id,
          label: payload.label,
          recipient_name: payload.recipient_name,
          phone_number: payload.phone_number,
          province: payload.province,
          city: payload.city,
          district: payload.district,
          full_address: payload.full_address,
          latitude: payload.latitude,
          longitude: payload.longitude,
          is_primary: payload.is_primary,
        }
      ])
      .select()
      .single();

    if (error) throw new ApiError('Gagal menyimpan alamat: ' + error.message, 500);

    return successResponse(data, 'Alamat berhasil ditambahkan', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
