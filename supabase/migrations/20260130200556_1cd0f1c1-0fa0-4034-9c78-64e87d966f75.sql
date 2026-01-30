-- Suppression complète des tables e-learning

-- 1. Supprimer d'abord les tables dépendantes (avec FK)
DROP TABLE IF EXISTS public.webrtc_signals CASCADE;
DROP TABLE IF EXISTS public.whiteboard_strokes CASCADE;
DROP TABLE IF EXISTS public.virtual_class_recordings CASCADE;
DROP TABLE IF EXISTS public.virtual_class_messages CASCADE;
DROP TABLE IF EXISTS public.virtual_class_materials CASCADE;
DROP TABLE IF EXISTS public.virtual_class_participants CASCADE;
DROP TABLE IF EXISTS public.meeting_participants CASCADE;

-- 2. Supprimer les tables principales
DROP TABLE IF EXISTS public.virtual_classes CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;

-- 3. Supprimer la fonction de nettoyage WebRTC si elle existe
DROP FUNCTION IF EXISTS public.cleanup_old_webrtc_signals();
