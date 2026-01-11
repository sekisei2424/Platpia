-- Function to get unread message count for the current user
CREATE OR REPLACE FUNCTION get_unread_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    -- Count messages where:
    -- 1. The user is a participant in the conversation
    -- 2. The message was NOT sent by the user
    -- 3. The message is newer than the user's last_read_at timestamp in conversation_participants
    SELECT COUNT(*)
    INTO unread_count
    FROM messages m
    JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE cp.user_id = auth.uid() -- The current user's participation record
      AND m.sender_id != auth.uid() -- Message from someone else
      AND m.created_at > cp.last_read_at; -- Message is newer than last read

    RETURN unread_count;
END;
$$;

-- Function to mark a conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(p_conversation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE conversation_participants
    SET last_read_at = timezone('utc'::text, now())
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid();
END;
$$;
