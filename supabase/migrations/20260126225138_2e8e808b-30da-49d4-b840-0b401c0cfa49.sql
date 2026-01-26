-- Add column to store scheduled message recipient data
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS scheduled_recipients jsonb DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.messages.scheduled_recipients IS 'Stores recipient info for scheduled messages: {type, ids}. Used by CRON job to deliver messages.';