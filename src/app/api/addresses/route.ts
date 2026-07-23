import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { successResponse } from '@/utils/api-response';
import { handleApiError } from '@/utils/error-handler';
import { z } from 'zod';

const CreateAddressSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  recipient_name: z.string().min(1, 'Recipient name is required'),
  phone_number: z.string().min(1, 'Phone number is required'),
  province: z.string().min(1, 'Province is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  full_address: z.string().min(1, 'Full address is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  is_primary: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient(await cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('profile_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return successResponse(data, 'Addresses fetched successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient(await cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) throw new Error('Unauthorized');

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

    if (error) throw new Error(error.message);

    return successResponse(data, 'Address created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
