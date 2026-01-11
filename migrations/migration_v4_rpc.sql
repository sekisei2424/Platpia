-- Function to create a conversation or return existing one
-- This runs with SECURITY DEFINER to bypass RLS for the insertion of the other user
CREATE OR REPLACE FUNCTION create_new_conversation(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    existing_convo_id UUID;
    new_convo_id UUID;
BEGIN
    current_user_id := auth.uid();

    -- 1. Check if a conversation already exists between these two users
    -- We look for a conversation that has both participants
    SELECT c.id INTO existing_convo_id
    FROM conversations c
    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE cp1.user_id = current_user_id 
      AND cp2.user_id = other_user_id;

    -- If found, return it
    IF existing_convo_id IS NOT NULL THEN
        RETURN existing_convo_id;
    END IF;

    -- 2. If not found, create a new conversation
    INSERT INTO conversations DEFAULT VALUES RETURNING id INTO new_convo_id;

    -- 3. Add both participants
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES 
        (new_convo_id, current_user_id),
        (new_convo_id, other_user_id);

    RETURN new_convo_id;
END;
$$;
