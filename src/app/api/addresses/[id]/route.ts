import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { successResponse } from '@/utils/api-response';
import { handleApiError, ApiError } from '@/utils/error-handler';
import { UpdateAddressSchema } from '@/validations/address.schema';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient(await cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new ApiError('Unauthorized', 401);

    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (error || !data) throw new ApiError('Alamat tidak ditemukan', 404);

    return successResponse(data, 'Address fetched successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient(await cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new ApiError('Unauthorized', 401);

    const { data: existing, error: findError } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (findError || !existing) throw new ApiError('Alamat tidak ditemukan', 404);

    const body = await req.json();
    const payload = UpdateAddressSchema.parse(body);

    if (payload.is_primary) {
      await supabase
        .from('user_addresses')
        .update({ is_primary: false })
        .eq('profile_id', user.id);
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.label !== undefined) updateData.label = payload.label;
    if (payload.recipient_name !== undefined) updateData.recipient_name = payload.recipient_name;
    if (payload.phone_number !== undefined) updateData.phone_number = payload.phone_number;
    if (payload.province !== undefined) updateData.province = payload.province;
    if (payload.city !== undefined) updateData.city = payload.city;
    if (payload.district !== undefined) updateData.district = payload.district;
    if (payload.full_address !== undefined) updateData.full_address = payload.full_address;
    if (payload.latitude !== undefined) updateData.latitude = payload.latitude;
    if (payload.longitude !== undefined) updateData.longitude = payload.longitude;
    if (payload.is_primary !== undefined) updateData.is_primary = payload.is_primary;

    const { data, error } = await supabase
      .from('user_addresses')
      .update(updateData)
      .eq('id', id)
      .eq('profile_id', user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return successResponse(data, 'Alamat berhasil diperbarui');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  return PATCH(req, context);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient(await cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new ApiError('Unauthorized', 401);

    const { data: existing, error: findError } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (findError || !existing) throw new ApiError('Alamat tidak ditemukan', 404);

    // Guard: Periksa apakah alamat digunakan oleh tiket yang masih aktif
    const { count, error: ticketCheckError } = await supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('address_id', id)
      .in('status', ['pending', 'scheduled', 'on_the_way']);

    if (ticketCheckError) throw new Error(ticketCheckError.message);

    if (count && count > 0) {
      throw new ApiError(
        'Alamat tidak dapat dihapus karena masih digunakan dalam jadwal penjemputan aktif',
        400
      );
    }

    // Jika alamat yang dihapus adalah alamat utama, jadikan alamat terbaru lain sebagai alamat utama
    if (existing.is_primary) {
      const { data: fallback } = await supabase
        .from('user_addresses')
        .select('id')
        .eq('profile_id', user.id)
        .neq('id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallback) {
        await supabase
          .from('user_addresses')
          .update({ is_primary: true })
          .eq('id', fallback.id);
      }
    }

    const { error: deleteError } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', id)
      .eq('profile_id', user.id);

    if (deleteError) throw new Error(deleteError.message);

    return successResponse({ id }, 'Alamat berhasil dihapus');
  } catch (error) {
    return handleApiError(error);
  }
}
