-- Supprimer le compte Admin dupliqué soulsang383@gmail.com (ID: 9e7c0b33-4166-4311-bac2-00546d9e7249)
-- Cela supprimera toutes les données associées grâce aux cascades FK

-- D'abord supprimer les références dans les tables liées qui n'ont pas de cascade
DELETE FROM user_formation_assignments WHERE user_id = '9e7c0b33-4166-4311-bac2-00546d9e7249';
DELETE FROM tutor_student_assignments WHERE student_id = '9e7c0b33-4166-4311-bac2-00546d9e7249' OR tutor_id = '9e7c0b33-4166-4311-bac2-00546d9e7249';
DELETE FROM chat_group_members WHERE user_id = '9e7c0b33-4166-4311-bac2-00546d9e7249';
DELETE FROM attendance_signatures WHERE user_id = '9e7c0b33-4166-4311-bac2-00546d9e7249';
DELETE FROM notifications WHERE user_id = '9e7c0b33-4166-4311-bac2-00546d9e7249';
DELETE FROM message_recipients WHERE recipient_id = '9e7c0b33-4166-4311-bac2-00546d9e7249';
DELETE FROM event_registrations WHERE user_id = '9e7c0b33-4166-4311-bac2-00546d9e7249';

-- Supprimer le profil utilisateur
DELETE FROM users WHERE id = '9e7c0b33-4166-4311-bac2-00546d9e7249';

-- Note: Le compte auth.users associé doit être supprimé manuellement via le dashboard Supabase
-- car les migrations n'ont pas accès direct à auth.users