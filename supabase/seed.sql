-- ============================================================
-- Umrah Compagnon - Supabase Seed Data
-- ============================================================

-- Insert default Agency Settings
INSERT INTO public.agency_settings (
    name, subtitle, description, banner_url, logo_url, address, city, country, phone, email, license_number
) VALUES (
    'مسك طيبة للعمرة',
    'Umrah Compagnon',
    'وكالة مسك طيبة للأسفار والعمرة - خدمات متميزة ومرافقة شاملة للمعتمرين من تونس إلى البقاع المقدسة.',
    '',
    '',
    'شارع الحبيب بورقيبة، جمّال 5020',
    'المنستير / جمّال',
    'تونس',
    '+216 73 481 100',
    'misktibajammel@gmail.com',
    'AG-TUN-2026-88'
) ON CONFLICT DO NOTHING;

-- Insert initial Trip
INSERT INTO public.trips (id, name, start_date, end_date, makkah_hotel, madinah_hotel, bus_count, flight_details, active)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'عمرة المولد',
    '2026-08-22',
    '2026-09-04',
    'الماسـة',
    'الكيان العالمي',
    1,
    'TU711 Tunis -> Jeddah / TU712 Medina -> Tunis',
    true
) ON CONFLICT DO NOTHING;

-- Insert initial Pilgrim
INSERT INTO public.pilgrims (
    id, trip_id, name_arabic, name_latin, phone, unique_code, status, passport_number, avatar_url, emergency_contact, gender, birth_date
) VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'انوار زقاب',
    'Anouar Zghab',
    '99048168',
    'YELC9821',
    'مؤكد',
    'N2891048',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><rect width="128" height="128" rx="64" fill="%23E2E8F0"/><circle cx="64" cy="46" r="22" fill="%2364748B"/><path d="M28 106c0-19.882 16.118-36 36-36s36 16.118 36 36Z" fill="%2364748B"/></svg>',
    '+216 99 048 168',
    'F',
    '1982-05-14'
) ON CONFLICT DO NOTHING;

-- Insert initial Staff
INSERT INTO public.staff (id, trip_id, name_arabic, name_latin, phone, whatsapp, role, unique_code, avatar_url)
VALUES 
(
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'نادر قويعة',
    'Nader Kouiaa',
    '25800884',
    '+21625800884',
    'رئيس مجموعة',
    'KCF32091',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><rect width="128" height="128" rx="64" fill="%23E2E8F0"/><circle cx="64" cy="46" r="22" fill="%2364748B"/><path d="M28 106c0-19.882 16.118-36 36-36s36 16.118 36 36Z" fill="%2364748B"/></svg>'
),
(
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    NULL,
    'نادر قويعة',
    'Nader Kouiaa (Admin)',
    '25800884',
    '25800884',
    'مرافق(ة)',
    'Q44U8812',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><rect width="128" height="128" rx="64" fill="%23E2E8F0"/><circle cx="64" cy="46" r="22" fill="%2364748B"/><path d="M28 106c0-19.882 16.118-36 36-36s36 16.118 36 36Z" fill="%2364748B"/></svg>'
),
(
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    NULL,
    'كريمة شاكر',
    'Karima Chaker',
    '21805829',
    '21805829',
    'رئيس مجموعة',
    'FH659912',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><rect width="128" height="128" rx="64" fill="%23E2E8F0"/><circle cx="64" cy="46" r="22" fill="%2364748B"/><path d="M28 106c0-19.882 16.118-36 36-36s36 16.118 36 36Z" fill="%2364748B"/></svg>'
),
(
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    NULL,
    'حنان عطية',
    'Hanan Attia',
    '99048768',
    '99048768',
    'رئيس مجموعة',
    '3TUA4492',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><rect width="128" height="128" rx="64" fill="%23E2E8F0"/><circle cx="64" cy="46" r="22" fill="%2364748B"/><path d="M28 106c0-19.882 16.118-36 36-36s36 16.118 36 36Z" fill="%2364748B"/></svg>'
) ON CONFLICT DO NOTHING;

-- Insert initial Posts
INSERT INTO public.posts (id, trip_id, title, content, image_url, notify_push)
VALUES (
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'تذكير بموعد الرحلة والمستندات المطلوبة',
    'يرجى من جميع معتمري رحلة عمرة المولد تجهيز جوازات السفر والحضور لمقر الوكالة بجمال قبل الموعد بـ 4 ساعات.',
    'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=800&q=80',
    true
) ON CONFLICT DO NOTHING;

-- Insert initial Notifications
INSERT INTO public.notifications (id, title, message, type, read)
VALUES 
(
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
    'تم تحديث بطاقات QR',
    'جاهزية شارات المعتمرين لرحلة عمرة المولد للطباعة والتصدير.',
    'info',
    false
),
(
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
    'تأكيد تسجيل معتمر جديد',
    'تم إضافة المعتمر انوار زقاب بنجاح وتعيين الكود YELC9821.',
    'trip',
    false
) ON CONFLICT DO NOTHING;
